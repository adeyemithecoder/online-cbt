import express from "express";
const expenseRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import {
  generateEntryNumber,
  assertSessionNotLocked,
  createAuditLog,
} from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ─── Create Expense (starts as PENDING) ───────────────────────────────────
expenseRoute.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      title,
      description,
      amount,
      expenseDate,
      paymentMethod,
      vendor,
      invoiceNumber,
      receiptUrl,
      expenseAccountId,
      cashAccountId,
      sessionId,
      schoolId,
      createdById,
    } = req.body;

    if (
      !title ||
      !amount ||
      !expenseDate ||
      !paymentMethod ||
      !expenseAccountId ||
      !cashAccountId ||
      !sessionId ||
      !schoolId ||
      !createdById
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    await assertSessionNotLocked(sessionId);

    const expense = await prisma.expense.create({
      data: {
        title,
        description,
        amount,
        expenseDate: new Date(expenseDate),
        paymentMethod,
        vendor,
        invoiceNumber,
        receiptUrl,
        expenseAccountId,
        cashAccountId,
        sessionId,
        schoolId,
        createdById,
        status: "PENDING",
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Expense",
      entityId: expense.id,
      userId: createdById,
      schoolId,
      newData: expense,
    });

    res.status(201).json(expense);
  }),
);

// ─── Approve Expense ───────────────────────────────────────────────────────
// CRITICAL: On approval → generate journal entry:
//   Debit:  Expense account
//   Credit: Cash account

expenseRoute.put(
  "/:id/approve",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approvedById } = req.body;

    if (!approvedById) {
      return res.status(400).json({ message: "approvedById is required." });
    }

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense)
      return res.status(404).json({ message: "Expense not found." });
    if (expense.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Only PENDING expenses can be approved." });
    }

    await assertSessionNotLocked(expense.sessionId);

    const entryNumber = await generateEntryNumber(expense.schoolId);

    // Destructure BOTH results from the transaction
    const [updatedExpense, journalEntry] = await prisma.$transaction([
      prisma.expense.update({
        where: { id },
        data: { status: "APPROVED", approvedById, approvedAt: new Date() },
      }),

      prisma.journalEntry.create({
        data: {
          entryNumber,
          date: expense.expenseDate,
          description: `Expense: ${expense.title}`,
          source: "EXPENSE",
          status: "POSTED",
          postedAt: new Date(),
          sessionId: expense.sessionId,
          schoolId: expense.schoolId,
          createdById: approvedById,
          lines: {
            create: [
              {
                accountId: expense.expenseAccountId,
                entryType: "DEBIT",
                amount: expense.amount,
                narration: `Expense — ${expense.title}`,
              },
              {
                accountId: expense.cashAccountId,
                entryType: "CREDIT",
                amount: expense.amount,
                narration: `Cash paid — ${expense.title}`,
              },
            ],
          },
        },
      }),
    ]);

    // Link the journal entry back to the expense
    await prisma.expense.update({
      where: { id },
      data: { journalEntryId: journalEntry.id },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Expense",
      entityId: id,
      userId: approvedById,
      schoolId: expense.schoolId,
      oldData: { status: "PENDING" },
      newData: { status: "APPROVED", journalEntryId: journalEntry.id },
    });

    res.json({
      message: "Expense approved and journal entry created.",
      expense: updatedExpense,
    });
  }),
);

// ─── Reject Expense ────────────────────────────────────────────────────────
expenseRoute.put(
  "/:id/reject",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { approvedById } = req.body;

    const expense = await prisma.expense.findUnique({ where: { id } });
    if (!expense)
      return res.status(404).json({ message: "Expense not found." });
    if (expense.status !== "PENDING") {
      return res
        .status(400)
        .json({ message: "Only PENDING expenses can be rejected." });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: { status: "REJECTED", approvedById },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Expense",
      entityId: id,
      userId: approvedById,
      schoolId: expense.schoolId,
      oldData: { status: "PENDING" },
      newData: { status: "REJECTED" },
    });

    res.json({ message: "Expense rejected.", expense: updated });
  }),
);

// ─── Get All Expenses ──────────────────────────────────────────────────────
expenseRoute.get(
  "/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { status, sessionId, startDate, endDate } = req.query;

    const where = { schoolId };
    if (status) where.status = status;
    if (sessionId) where.sessionId = sessionId;
    if (startDate || endDate) {
      where.expenseDate = {};
      if (startDate) where.expenseDate.gte = new Date(startDate);
      if (endDate) where.expenseDate.lte = new Date(endDate);
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        ExpenseAccount: { select: { name: true, code: true } },
        CashAccount: { select: { name: true, code: true } },
        CreatedBy: { select: { name: true } },
      },
      orderBy: { expenseDate: "desc" },
    });

    res.json(expenses);
  }),
);

export default expenseRoute;
