import express from "express";
const loanDonationRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import {
  generateEntryNumber,
  assertSessionNotLocked,
  createAuditLog,
} from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ════════════════════════════════════════════════
// LOANS
// ════════════════════════════════════════════════

// ─── Record Loan Received ─────────────────────────────────────────────────
// ACCOUNTING RULE:
//   Debit:  Cash account      (money received)
//   Credit: Loan Liability    (obligation created)
loanDonationRoute.post(
  "/loans",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      amount,
      lender,
      description,
      dateReceived,
      repaymentDate,
      liabilityAccountId,
      cashAccountId,
      sessionId,
      schoolId,
      createdById,
    } = req.body;

    if (
      !amount ||
      !lender ||
      !dateReceived ||
      !liabilityAccountId ||
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

    const entryNumber = await generateEntryNumber(schoolId);

    const [loan, journalEntry] = await prisma.$transaction([
      prisma.loan.create({
        data: {
          amount,
          lender,
          description,
          dateReceived: new Date(dateReceived),
          repaymentDate: repaymentDate ? new Date(repaymentDate) : null,
          status: "ACTIVE",
          liabilityAccountId,
          cashAccountId,
          sessionId,
          schoolId,
        },
      }),

      prisma.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(dateReceived),
          description: `Loan received from ${lender}`,
          source: "LOAN",
          status: "POSTED",
          postedAt: new Date(),
          sessionId,
          schoolId,
          createdById,
          lines: {
            create: [
              {
                accountId: cashAccountId,
                entryType: "DEBIT",
                amount,
                narration: `Cash from loan — ${lender}`,
              },
              {
                accountId: liabilityAccountId,
                entryType: "CREDIT",
                amount,
                narration: `Loan liability — ${lender}`,
              },
            ],
          },
        },
      }),
    ]);

    // Link journal entry to loan
    await prisma.loan.update({
      where: { id: loan.id },
      data: { journalEntryId: journalEntry.id },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Loan",
      entityId: loan.id,
      userId: createdById,
      schoolId,
      newData: { amount, lender },
    });

    res.status(201).json({ loan, journalEntry });
  }),
);

// ─── Mark Loan as Paid ────────────────────────────────────────────────────
loanDonationRoute.put(
  "/loans/:id/mark-paid",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    const loan = await prisma.loan.findUnique({ where: { id } });

    if (!loan) {
      return res.status(404).json({ message: "Loan not found." });
    }

    if (loan.status === "PAID") {
      return res.status(400).json({ message: "Already paid." });
    }

    await assertSessionNotLocked(loan.sessionId);

    const entryNumber = await generateEntryNumber(loan.schoolId);

    const result = await prisma.$transaction(async (tx) => {
      // 🔥 1. Create repayment journal entry
      const repaymentEntry = await tx.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(),
          description: `Loan repayment to ${loan.lender}`,
          source: "LOAN_REPAYMENT",
          status: "POSTED",
          postedAt: new Date(),
          sessionId: loan.sessionId,
          schoolId: loan.schoolId,
          createdById: userId,
          lines: {
            create: [
              {
                accountId: loan.liabilityAccountId,
                entryType: "DEBIT", // 🔥 reduces liability
                amount: loan.amount,
                narration: `Loan cleared — ${loan.lender}`,
              },
              {
                accountId: loan.cashAccountId,
                entryType: "CREDIT", // 🔥 cash leaves
                amount: loan.amount,
                narration: `Cash paid for loan — ${loan.lender}`,
              },
            ],
          },
        },
      });

      // 🔥 2. Update loan
      const updatedLoan = await tx.loan.update({
        where: { id },
        data: {
          status: "PAID",
          repaymentJournalEntryId: repaymentEntry.id, // 👈 IMPORTANT
        },
      });

      return { repaymentEntry, updatedLoan };
    });

    await createAuditLog({
      action: "LOAN_REPAID",
      entity: "Loan",
      entityId: id,
      userId,
      schoolId: loan.schoolId,
      newData: { amount: loan.amount },
    });

    res.json({
      message: "Loan repaid successfully.",
      loan: result.updatedLoan,
    });
  }),
);

// ─── Get All Loans ────────────────────────────────────────────────────────
loanDonationRoute.get(
  "/loans/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId, status } = req.query;

    const loans = await prisma.loan.findMany({
      where: {
        schoolId,
        ...(sessionId ? { sessionId } : {}),
        ...(status ? { status } : {}),
      },
      include: {
        LiabilityAccount: { select: { name: true, code: true } },
        CashAccount: { select: { name: true, code: true } },
      },
      orderBy: { dateReceived: "desc" },
    });

    res.json(loans);
  }),
);

// ════════════════════════════════════════════════
// DONATIONS
// ════════════════════════════════════════════════

// ─── Record Donation ──────────────────────────────────────────────────────
// ACCOUNTING RULE:
//   Debit:  Cash account        (money received)
//   Credit: Donation Revenue    (income recognised)
loanDonationRoute.post(
  "/donations",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      donorName,
      amount,
      description,
      date,
      revenueAccountId,
      cashAccountId,
      sessionId,
      schoolId,
      createdById,
    } = req.body;

    if (
      !amount ||
      !date ||
      !revenueAccountId ||
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

    const entryNumber = await generateEntryNumber(schoolId);

    const [donation, journalEntry] = await prisma.$transaction([
      prisma.donation.create({
        data: {
          donorName,
          amount,
          description,
          date: new Date(date),
          revenueAccountId,
          cashAccountId,
          sessionId,
          schoolId,
        },
      }),

      prisma.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(date),
          description: `Donation received${donorName ? ` from ${donorName}` : ""}`,
          source: "DONATION",
          status: "POSTED",
          postedAt: new Date(),
          sessionId,
          schoolId,
          createdById,
          lines: {
            create: [
              {
                accountId: cashAccountId,
                entryType: "DEBIT",
                amount,
                narration: `Cash from donation${donorName ? ` — ${donorName}` : ""}`,
              },
              {
                accountId: revenueAccountId,
                entryType: "CREDIT",
                amount,
                narration: `Donation revenue${donorName ? ` — ${donorName}` : ""}`,
              },
            ],
          },
        },
      }),
    ]);

    // Link journal entry to donation
    await prisma.donation.update({
      where: { id: donation.id },
      data: { journalEntryId: journalEntry.id },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Donation",
      entityId: donation.id,
      userId: createdById,
      schoolId,
      newData: { amount, donorName },
    });

    res.status(201).json({ donation, journalEntry });
  }),
);

// ─── Get All Donations ────────────────────────────────────────────────────
loanDonationRoute.get(
  "/donations/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    const donations = await prisma.donation.findMany({
      where: { schoolId, ...(sessionId ? { sessionId } : {}) },
      include: {
        RevenueAccount: { select: { name: true, code: true } },
        CashAccount: { select: { name: true, code: true } },
      },
      orderBy: { date: "desc" },
    });

    const totalDonated = donations.reduce((sum, d) => sum + d.amount, 0);

    res.json({ donations, totalDonated });
  }),
);

export default loanDonationRoute;
