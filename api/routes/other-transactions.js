import express from "express";
const otherTransactionsRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import {
  generateEntryNumber,
  assertSessionNotLocked,
  createAuditLog,
} from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ─── Create Other Transaction ──────────────────────────────────────────────
// INCOME:  Debit Cash account, Credit Income account
// EXPENSE: Debit Expense account, Credit Cash account
otherTransactionsRoute.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      type, // "INCOME" | "EXPENSE"
      accountId, // the income or expense account
      cashAccountId, // the asset/cash account
      amount,
      date,
      description,
      reference,
      sessionId,
      schoolId,
      createdById,
    } = req.body;

    if (
      !type ||
      !accountId ||
      !cashAccountId ||
      !amount ||
      !date ||
      !description ||
      !sessionId ||
      !schoolId ||
      !createdById
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Type must be INCOME or EXPENSE." });
    }

    if (amount <= 0) {
      return res
        .status(400)
        .json({ message: "Amount must be greater than zero." });
    }

    await assertSessionNotLocked(sessionId);

    const entryNumber = await generateEntryNumber(schoolId);

    // INCOME:  Debit Cash, Credit Income account
    // EXPENSE: Debit Expense account, Credit Cash
    const lines =
      type === "INCOME"
        ? [
            {
              accountId: cashAccountId,
              entryType: "DEBIT",
              amount,
              narration: `Cash received — ${description}`,
            },
            {
              accountId,
              entryType: "CREDIT",
              amount,
              narration: description,
            },
          ]
        : [
            {
              accountId,
              entryType: "DEBIT",
              amount,
              narration: description,
            },
            {
              accountId: cashAccountId,
              entryType: "CREDIT",
              amount,
              narration: `Cash paid — ${description}`,
            },
          ];

    const transaction = await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: new Date(date),
        description,
        reference: reference || null,
        source: "MANUAL",
        status: "POSTED",
        postedAt: new Date(),
        sessionId,
        schoolId,
        createdById,
        lines: { create: lines },
      },
      include: { lines: { include: { Account: true } } },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "OtherTransaction",
      entityId: transaction.id,
      userId: createdById,
      schoolId,
      newData: { type, amount, description },
    });

    res.status(201).json({
      message: "Transaction recorded successfully.",
      transaction,
    });
  }),
);

// ─── Get All Other Transactions ────────────────────────────────────────────
otherTransactionsRoute.get(
  "/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    const entries = await prisma.journalEntry.findMany({
      where: {
        schoolId,
        source: "MANUAL",
        status: "POSTED",
        ...(sessionId ? { sessionId } : {}),
      },
      include: {
        lines: { include: { Account: true } },
        CreatedBy: { select: { name: true, username: true } },
      },
      orderBy: { date: "desc" },
    });

    res.json(entries);
  }),
);

export default otherTransactionsRoute;
