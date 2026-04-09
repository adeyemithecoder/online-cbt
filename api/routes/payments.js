import express from "express";
const paymentRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import {
  generateEntryNumber,
  generateReceiptNumber,
  assertSessionNotLocked,
  createAuditLog,
} from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ─── Record Fee Payment ────────────────────────────────────────────────────
// CRITICAL: Auto-updates StudentFee.amountPaid + status + creates journal entry
paymentRoute.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      studentId,
      studentFeeId,
      amountPaid,
      paymentDate,
      paymentMethod,
      cashAccountId,
      sessionId,
      schoolId,
      recordedById,
      reference,
      note,
    } = req.body;

    if (
      !studentId ||
      !studentFeeId ||
      !amountPaid ||
      !paymentDate ||
      !paymentMethod ||
      !cashAccountId ||
      !sessionId ||
      !schoolId ||
      !recordedById
    ) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }
    if (amountPaid <= 0) {
      return res
        .status(400)
        .json({ message: "Amount paid must be greater than zero." });
    }
    await assertSessionNotLocked(sessionId);

    const studentFee = await prisma.studentFee.findUnique({
      where: { id: studentFeeId },
      include: { FeeStructure: { include: { RevenueAccount: true } } },
    });

    if (!studentFee) {
      return res.status(404).json({ message: "Student fee record not found." });
    }
    if (studentFee.status === "PAID") {
      return res
        .status(400)
        .json({ message: "This fee is already fully paid." });
    }

    const remaining = studentFee.amountCharged - studentFee.amountPaid;
    if (amountPaid > remaining + 0.01) {
      return res.status(400).json({
        message: `Overpayment detected. Remaining balance: ${remaining}`,
      });
    }

    const receiptNumber = await generateReceiptNumber();
    const entryNumber = await generateEntryNumber(schoolId);
    const revenueAccountId = studentFee.FeeStructure.revenueAccountId;

    const newAmountPaid = studentFee.amountPaid + amountPaid;
    const newStatus =
      newAmountPaid >= studentFee.amountCharged
        ? "PAID"
        : newAmountPaid > 0
          ? "PARTIALLY_PAID"
          : "UNPAID";

    // Destructure ALL 3 results from the transaction
    const [payment, , journalEntry] = await prisma.$transaction([
      // 1. Record the payment
      prisma.feePayment.create({
        data: {
          receiptNumber,
          amountPaid,
          paymentDate: new Date(paymentDate),
          paymentMethod,
          cashAccountId,
          studentId,
          studentFeeId,
          sessionId,
          schoolId,
          recordedById,
          reference,
          note,
        },
      }),

      // 2. Update student fee amount and status
      prisma.studentFee.update({
        where: { id: studentFeeId },
        data: { amountPaid: newAmountPaid, status: newStatus },
      }),

      // 3. Create journal entry
      prisma.journalEntry.create({
        data: {
          entryNumber,
          date: new Date(paymentDate),
          description: `Fee payment — Receipt #${receiptNumber}`,
          source: "FEE_PAYMENT",
          status: "POSTED",
          postedAt: new Date(),
          sessionId,
          schoolId,
          createdById: recordedById,
          lines: {
            create: [
              {
                accountId: cashAccountId,
                entryType: "DEBIT",
                amount: amountPaid,
                narration: `Cash received — Receipt #${receiptNumber}`,
              },
              {
                accountId: revenueAccountId,
                entryType: "CREDIT",
                amount: amountPaid,
                narration: `Fee income — Receipt #${receiptNumber}`,
              },
            ],
          },
        },
      }),
    ]);

    // Link the journal entry back to the payment
    await prisma.feePayment.update({
      where: { id: payment.id },
      data: { journalEntryId: journalEntry.id },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "FeePayment",
      entityId: payment.id,
      userId: recordedById,
      schoolId,
      newData: {
        receiptNumber,
        amountPaid,
        studentFeeId,
        journalEntryId: journalEntry.id,
      },
    });

    res.status(201).json({
      message: "Payment recorded successfully.",
      payment,
      newStatus,
      newAmountPaid,
    });
  }),
);

// ─── Get All Payments ──────────────────────────────────────────────────────
paymentRoute.get(
  "/school/:schoolId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    const payments = await prisma.feePayment.findMany({
      where: { schoolId, ...(sessionId ? { sessionId } : {}) },
      include: {
        Student: { select: { name: true, surname: true, level: true } },
        StudentFee: { include: { FeeStructure: { select: { name: true } } } },
        RecordedBy: { select: { name: true } },
        CashAccount: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(payments);
  }),
);

// ─── Get Payments by Student ───────────────────────────────────────────────
paymentRoute.get(
  "/student/:studentId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { sessionId } = req.query;

    const payments = await prisma.feePayment.findMany({
      where: { studentId, ...(sessionId ? { sessionId } : {}) },
      include: {
        StudentFee: { include: { FeeStructure: { select: { name: true } } } },
        CashAccount: { select: { name: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    res.json(payments);
  }),
);

// ─── Get Payments by Session ───────────────────────────────────────────────
paymentRoute.get(
  "/session/:sessionId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    const payments = await prisma.feePayment.findMany({
      where: { sessionId },
      include: {
        Student: { select: { name: true, surname: true } },
        CashAccount: { select: { name: true, code: true } },
      },
      orderBy: { paymentDate: "desc" },
    });

    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    res.json({ payments, totalCollected });
  }),
);

export default paymentRoute;
