import express from "express";
const reportsRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import { protect } from "../middleware/auth.js";

// ════════════════════════════════════════════════
// RULE: All reports use ONLY POSTED journal entries
// RULE: All reports MUST respect sessionId
// ════════════════════════════════════════════════

// ─── Ledger — Get all journal lines for an account with running balance ────
reportsRoute.get(
  "/ledger/:accountId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { accountId } = req.params;
    const { sessionId, schoolId } = req.query;

    if (!sessionId || !schoolId) {
      return res
        .status(400)
        .json({ message: "sessionId and schoolId are required." });
    }

    const account = await prisma.chartOfAccount.findUnique({
      where: { id: accountId },
    });
    if (!account)
      return res.status(404).json({ message: "Account not found." });

    // Fetch all POSTED journal lines for this account in the session
    const lines = await prisma.journalLine.findMany({
      where: {
        accountId,
        JournalEntry: {
          status: "POSTED",
          sessionId,
          schoolId,
        },
      },
      include: {
        JournalEntry: {
          select: { entryNumber: true, date: true, description: true },
        },
      },
      orderBy: { JournalEntry: { date: "asc" } },
    });

    // Compute running balance based on the account's normal balance direction
    // DEBIT normal: debits increase balance, credits decrease
    // CREDIT normal: credits increase balance, debits decrease
    let runningBalance = 0;
    const ledgerLines = lines.map((line) => {
      if (account.normalBalance === "DEBIT") {
        runningBalance +=
          line.entryType === "DEBIT" ? line.amount : -line.amount;
      } else {
        runningBalance +=
          line.entryType === "CREDIT" ? line.amount : -line.amount;
      }

      return {
        date: line.JournalEntry.date,
        entryNumber: line.JournalEntry.entryNumber,
        description: line.JournalEntry.description,
        debit: line.entryType === "DEBIT" ? line.amount : 0,
        credit: line.entryType === "CREDIT" ? line.amount : 0,
        narration: line.narration,
        runningBalance,
      };
    });

    res.json({ account, lines: ledgerLines, closingBalance: runningBalance });
  }),
);

// ─── Trial Balance ─────────────────────────────────────────────────────────
// Aggregate all accounts — show total debit and credit per account
reportsRoute.get(
  "/trial-balance/:schoolId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const accounts = await prisma.chartOfAccount.findMany({
      where: { schoolId, isActive: true },
      include: {
        journalLines: {
          where: {
            JournalEntry: { status: "POSTED", sessionId, schoolId },
          },
        },
      },
      orderBy: { code: "asc" },
    });

    let grandTotalDebit = 0;
    let grandTotalCredit = 0;

    const rows = accounts
      .map((account) => {
        const totalDebit = account.journalLines
          .filter((l) => l.entryType === "DEBIT")
          .reduce((sum, l) => sum + l.amount, 0);

        const totalCredit = account.journalLines
          .filter((l) => l.entryType === "CREDIT")
          .reduce((sum, l) => sum + l.amount, 0);

        grandTotalDebit += totalDebit;
        grandTotalCredit += totalCredit;

        return {
          code: account.code,
          name: account.name,
          accountType: account.accountType,
          normalBalance: account.normalBalance,
          totalDebit,
          totalCredit,
          // Net balance in account's normal direction
          netBalance:
            account.normalBalance === "DEBIT"
              ? totalDebit - totalCredit
              : totalCredit - totalDebit,
        };
      })
      // Only include accounts with movement
      .filter((r) => r.totalDebit > 0 || r.totalCredit > 0);

    const isBalanced = Math.abs(grandTotalDebit - grandTotalCredit) < 0.01;

    res.json({
      rows,
      grandTotalDebit,
      grandTotalCredit,
      isBalanced,
      difference: grandTotalDebit - grandTotalCredit,
    });
  }),
);

// ─── Balance Sheet ─────────────────────────────────────────────────────────
// Groups accounts into: Assets | Liabilities | Equity
reportsRoute.get(
  "/balance-sheet/:schoolId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    // Fetch ALL account types so we can compute net profit too
    const accounts = await prisma.chartOfAccount.findMany({
      where: { schoolId, isActive: true },
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

    const buildSection = (type) => {
      const items = accounts
        .filter((a) => a.accountType === type)
        .map((a) => ({ code: a.code, name: a.name, balance: getBalance(a) }))
        .filter((a) => a.balance !== 0);
      const total = items.reduce((s, a) => s + a.balance, 0);
      return { items, total };
    };

    const assets = buildSection("ASSET");
    const liabilities = buildSection("LIABILITY");
    const equity = buildSection("EQUITY");
    const revenue = buildSection("REVENUE");
    const expenses = buildSection("EXPENSE");

    // Net profit/loss from income statement accounts
    const netProfit = revenue.total - expenses.total;

    // CORRECT equation: Assets = Liabilities + Equity + Net Profit
    const liabilitiesPlusEquityPlusProfit =
      liabilities.total + equity.total + netProfit;

    const isBalanced =
      Math.abs(assets.total - liabilitiesPlusEquityPlusProfit) < 0.01;
    res.json({
      assets,
      liabilities,
      equity,
      netProfit, // expose this so frontend can show it
      profitOrLoss: netProfit >= 0 ? "PROFIT" : "LOSS",
      totalLiabilitiesPlusEquity: liabilitiesPlusEquityPlusProfit,
      isBalanced,
      note: isBalanced
        ? "Balance sheet is balanced ✓"
        : "⚠ Balance sheet is NOT balanced — check for missing entries.",
    });
  }),
);

// ─── Income Statement (P&L) ────────────────────────────────────────────────
// Revenue − Expenses = Net Profit / Loss
reportsRoute.get(
  "/income-statement/:schoolId",
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
        accountType: { in: ["REVENUE", "EXPENSE"] },
      },
      include: {
        journalLines: {
          where: {
            JournalEntry: { status: "POSTED", sessionId, schoolId },
          },
        },
      },
    });

    const buildSection = (type) => {
      const section = accounts
        .filter((a) => a.accountType === type)
        .map((a) => {
          const totalDebit = a.journalLines
            .filter((l) => l.entryType === "DEBIT")
            .reduce((s, l) => s + l.amount, 0);
          const totalCredit = a.journalLines
            .filter((l) => l.entryType === "CREDIT")
            .reduce((s, l) => s + l.amount, 0);

          // Revenue normal balance is CREDIT, Expense is DEBIT
          const balance =
            a.normalBalance === "CREDIT"
              ? totalCredit - totalDebit
              : totalDebit - totalCredit;

          return { code: a.code, name: a.name, balance };
        })
        .filter((a) => a.balance !== 0);

      const total = section.reduce((s, a) => s + a.balance, 0);
      return { items: section, total };
    };

    const revenue = buildSection("REVENUE");
    const expenses = buildSection("EXPENSE");

    const netProfit = revenue.total - expenses.total;

    res.json({
      revenue,
      expenses,
      netProfit,
      profitOrLoss: netProfit >= 0 ? "PROFIT" : "LOSS",
    });
  }),
);

export default reportsRoute;
