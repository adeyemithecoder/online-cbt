// ─── Accounting Module Router ─────────────────────────────────────────────
// Mount this in your server.js like:
//
//   import accountingRouter from "./routes/accounting/index.js";
//   app.use("/api/accounting", accountingRouter);
//
// This gives you routes like:
//   POST   /api/accounting/sessions
//   GET    /api/accounting/accounts/school/:schoolId
//   POST   /api/accounting/journal
//   POST   /api/accounting/payments
//   ...etc

import express from "express";
const accountingRouter = express.Router();

import sessionRoute from "./sessions.js";
import accountRoute from "./accounts.js";
import journalRoute from "./journal.js";
import feesRoute from "./fees.js";
import paymentRoute from "./payments.js";
import expenseRoute from "./expenses.js";
import loanDonationRoute from "./loans-donations.js";
import auditRoute from "./audit.js";
import reportsRoute from "./reports.js";

accountingRouter.use("/sessions", sessionRoute);
accountingRouter.use("/accounts", accountRoute);
accountingRouter.use("/journal", journalRoute);
accountingRouter.use("/fees", feesRoute);
accountingRouter.use("/payments", paymentRoute);
accountingRouter.use("/expenses", expenseRoute);
accountingRouter.use("/loans-donations", loanDonationRoute);
accountingRouter.use("/audit", auditRoute);
accountingRouter.use("/reports", reportsRoute);

export default accountingRouter;
