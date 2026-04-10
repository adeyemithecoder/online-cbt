import express from "express";
const journalRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import {
  generateEntryNumber,
  assertSessionNotLocked,
  createAuditLog,
} from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ─── Create Manual Journal Entry (DRAFT) ──────────────────────────────────
journalRoute.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { date, description, reference, sessionId, schoolId, createdById } =
      req.body;

    if (!date || !description || !sessionId || !schoolId || !createdById) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    await assertSessionNotLocked(sessionId);

    const entryNumber = await generateEntryNumber(schoolId);

    const entry = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(date),
        description,
        reference,
        source: "MANUAL",
        status: "DRAFT",
        sessionId,
        schoolId,
        createdById,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "JournalEntry",
      entityId: entry.id,
      userId: createdById,
      schoolId,
      newData: entry,
    });

    res.status(201).json(entry);
  }),
);

// ─── Add Lines to a Draft Journal Entry ───────────────────────────────────
journalRoute.post(
  "/:id/lines",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { lines } = req.body;

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ message: "Lines array is required." });
    }

    // Validate each line has a positive amount
    const hasInvalidAmount = lines.some((l) => !l.amount || l.amount <= 0);
    if (hasInvalidAmount) {
      return res
        .status(400)
        .json({ message: "All line amounts must be greater than zero." });
    }

    // Validate each line has a valid entryType
    const hasInvalidType = lines.some(
      (l) => !["DEBIT", "CREDIT"].includes(l.entryType),
    );
    if (hasInvalidType) {
      return res
        .status(400)
        .json({ message: "Each line must have entryType of DEBIT or CREDIT." });
    }

    const entry = await prisma.journalEntry.findUnique({ where: { id } });
    if (!entry)
      return res.status(404).json({ message: "Journal entry not found." });
    if (entry.status !== "DRAFT") {
      return res
        .status(400)
        .json({ message: "Cannot add lines to a non-draft entry." });
    }

    const created = await prisma.journalLine.createMany({
      data: lines.map((l) => ({
        journalEntryId: id,
        accountId: l.accountId,
        entryType: l.entryType,
        amount: l.amount,
        narration: l.narration || null,
      })),
    });

    res.status(201).json({ message: `${created.count} line(s) added.` });
  }),
);

// ─── Post Journal Entry ────────────────────────────────────────────────────
// CRITICAL: Validate debit === credit before posting
journalRoute.put(
  "/:id/post",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!entry)
      return res.status(404).json({ message: "Journal entry not found." });
    if (entry.status !== "DRAFT") {
      return res
        .status(400)
        .json({ message: "Only DRAFT entries can be posted." });
    }

    await assertSessionNotLocked(entry.sessionId);

    // Validate balance: total debits must equal total credits
    const totalDebit = entry.lines
      .filter((l) => l.entryType === "DEBIT")
      .reduce((sum, l) => sum + l.amount, 0);
    const totalCredit = entry.lines
      .filter((l) => l.entryType === "CREDIT")
      .reduce((sum, l) => sum + l.amount, 0);

    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return res.status(400).json({
        message: `Journal entry is not balanced. Debit: ${totalDebit}, Credit: ${totalCredit}`,
      });
    }

    if (entry.lines.length < 2) {
      return res
        .status(400)
        .json({ message: "A journal entry must have at least 2 lines." });
    }

    const posted = await prisma.journalEntry.update({
      where: { id },
      data: { status: "POSTED", postedAt: new Date() },
    });

    await createAuditLog({
      action: "POST",
      entity: "JournalEntry",
      entityId: id,
      userId: req.user?.id,
      schoolId: entry.schoolId,
      newData: { status: "POSTED" },
    });

    res.json({ message: "Journal entry posted successfully.", entry: posted });
  }),
);

// ─── Reverse a Posted Journal Entry ───────────────────────────────────────
// Creates a new entry with all debits/credits flipped
journalRoute.post(
  "/:id/reverse",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const createdById = req.user.id;

    // ✅ Do this OUTSIDE transaction
    const original = await prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: true },
    });

    if (!original) throw new Error("Journal entry not found.");

    if (original.status !== "POSTED") {
      throw new Error(
        original.status === "REVERSED"
          ? "Already reversed."
          : "Only POSTED entries can be reversed.",
      );
    }

    if (original.reversalOfId) {
      throw new Error("Cannot reverse a reversal.");
    }

    await assertSessionNotLocked(original.sessionId);

    // ✅ Also outside (can be slow)
    const entryNumber = await generateEntryNumber(original.schoolId);

    let feePayment = null;
    if (original.source === "FEE_PAYMENT") {
      feePayment = await prisma.feePayment.findFirst({
        where: { journalEntryId: original.id },
        include: { StudentFee: true },
      });

      if (!feePayment || feePayment.journalEntryId === null) {
        throw new Error("Already reversed.");
      }
    }

    // ⚡ ONLY critical writes inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const reversalEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(),
          description: `REVERSAL: ${original.description}${
            reason ? ` — ${reason}` : ""
          }`,
          source: original.source,
          status: "POSTED",
          postedAt: new Date(),
          reversalOfId: original.id,
          sessionId: original.sessionId,
          schoolId: original.schoolId,
          createdById,
          lines: {
            create: original.lines.map((l) => ({
              accountId: l.accountId,
              entryType: l.entryType === "DEBIT" ? "CREDIT" : "DEBIT",
              amount: l.amount,
              narration: `Reversal of: ${l.narration || ""}`,
            })),
          },
        },
        include: { lines: true },
      });

      await tx.journalEntry.update({
        where: { id },
        data: { status: "REVERSED" },
      });

      if (original.source === "FEE_PAYMENT" && feePayment) {
        const studentFee = feePayment.StudentFee;

        const newAmountPaid = Math.max(
          0,
          studentFee.amountPaid - feePayment.amountPaid,
        );

        const newStatus =
          newAmountPaid <= 0
            ? "UNPAID"
            : newAmountPaid >= studentFee.amountCharged
              ? "PAID"
              : "PARTIALLY_PAID";

        await tx.studentFee.update({
          where: { id: studentFee.id },
          data: {
            amountPaid: newAmountPaid,
            status: newStatus,
          },
        });

        await tx.feePayment.update({
          where: { id: feePayment.id },
          data: { journalEntryId: null },
        });
      }

      if (original.source === "EXPENSE") {
        const expense = await tx.expense.findFirst({
          where: { journalEntryId: original.id },
        });

        if (expense) {
          await tx.expense.update({
            where: { id: expense.id },
            data: {
              status: "PENDING",
              approvedById: null,
              approvedAt: null,
              journalEntryId: null,
            },
          });
        }
      }

      return reversalEntry;
    });

    // ✅ OUTSIDE transaction (important)
    await createAuditLog({
      action: "REVERSE",
      entity: "JournalEntry",
      entityId: id,
      userId: createdById,
      schoolId: original.schoolId,
      newData: { reversedBy: result.id },
    });

    res.status(201).json({
      message: "Entry reversed successfully.",
      reversalEntry: result,
    });
  }),
);

// ─── Get All Journal Entries (with filters) ────────────────────────────────
journalRoute.get(
  "/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId, status, accountId, startDate, endDate } = req.query;

    const where = { schoolId };

    if (sessionId) where.sessionId = sessionId;
    if (status) where.status = status;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    // Filter by account via journal lines
    if (accountId) {
      where.lines = { some: { accountId } };
    }

    const entries = await prisma.journalEntry.findMany({
      where,
      include: {
        lines: { include: { Account: true } },
        CreatedBy: { select: { name: true, username: true } },
      },
      orderBy: { date: "desc" },
    });

    res.json(entries);
  }),
);

// ─── Get Single Journal Entry with Lines ──────────────────────────────────
journalRoute.get(
  "/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const entry = await prisma.journalEntry.findUnique({
      where: { id },
      include: {
        lines: { include: { Account: true } },
        CreatedBy: { select: { name: true, username: true } },
        ReversalOf: true,
        reversedBy: true,
        Session: true,
      },
    });

    if (!entry)
      return res.status(404).json({ message: "Journal entry not found." });

    res.json(entry);
  }),
);

// ─── Generate Closing Entry Preview ───────────────────────────────────────
// Reads income statement accounts and returns pre-filled closing entry lines
journalRoute.get(
  "/closing-entry/:schoolId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: {
        schoolId,
        isActive: true,
        accountType: { in: ["REVENUE", "EXPENSE", "EQUITY"] },
      },
      include: {
        journalLines: {
          where: {
            JournalEntry: { status: "POSTED", sessionId, schoolId },
          },
        },
      },
    });

    const getBalance = (account) => {
      const totalDebit = account.journalLines
        .filter((l) => l.entryType === "DEBIT")
        .reduce((s, l) => s + l.amount, 0);
      const totalCredit = account.journalLines
        .filter((l) => l.entryType === "CREDIT")
        .reduce((s, l) => s + l.amount, 0);
      return account.normalBalance === "DEBIT"
        ? totalDebit - totalCredit
        : totalCredit - totalDebit;
    };

    // Revenue accounts with balances → need to be DEBITED to zero out
    const revenueLines = accounts
      .filter((a) => a.accountType === "REVENUE")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        entryType: "DEBIT",
        amount: getBalance(a),
        narration: `Close ${a.name} to Retained Earnings`,
      }))
      .filter((l) => l.amount > 0);

    // Expense accounts with balances → need to be CREDITED to zero out
    const expenseLines = accounts
      .filter((a) => a.accountType === "EXPENSE")
      .map((a) => ({
        accountId: a.id,
        accountCode: a.code,
        accountName: a.name,
        entryType: "CREDIT",
        amount: getBalance(a),
        narration: `Close ${a.name} to Retained Earnings`,
      }))
      .filter((l) => l.amount > 0);

    const totalRevenue = revenueLines.reduce((s, l) => s + l.amount, 0);
    const totalExpenses = expenseLines.reduce((s, l) => s + l.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    // Find Retained Earnings account
    const retainedEarnings = accounts.find(
      (a) =>
        a.accountType === "EQUITY" && a.name.toLowerCase().includes("retained"),
    );

    if (!retainedEarnings) {
      return res.status(404).json({
        message:
          "No Retained Earnings account found. Please create one in your Chart of Accounts.",
      });
    }

    // Net profit → CREDIT Retained Earnings
    // Net loss → DEBIT Retained Earnings
    const retainedEarningsLine = {
      accountId: retainedEarnings.id,
      accountCode: retainedEarnings.code,
      accountName: retainedEarnings.name,
      entryType: netProfit >= 0 ? "CREDIT" : "DEBIT",
      amount: Math.abs(netProfit),
      narration: `Transfer net ${netProfit >= 0 ? "profit" : "loss"} to Retained Earnings`,
    };

    const lines = [...revenueLines, ...expenseLines, retainedEarningsLine];

    if (lines.every((l) => l.amount === 0)) {
      return res.status(400).json({
        message:
          "No income or expense activity found for this session. Nothing to close.",
      });
    }

    res.json({
      description: `Period-end closing entry`,
      netProfit,
      profitOrLoss: netProfit >= 0 ? "PROFIT" : "LOSS",
      lines,
    });
  }),
);

export default journalRoute;
