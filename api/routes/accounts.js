import express from "express";
const accountRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import { createAuditLog } from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ─── Create Account ────────────────────────────────────────────────────────
accountRoute.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { code, name, description, accountType, normalBalance, schoolId } =
      req.body;

    if (!code || !name || !accountType || !normalBalance || !schoolId) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    const existing = await prisma.chartOfAccount.findUnique({
      where: { code_schoolId: { code, schoolId } },
    });
    if (existing) {
      return res
        .status(409)
        .json({ message: "Account code already exists for this school." });
    }

    const account = await prisma.chartOfAccount.create({
      data: { code, name, description, accountType, normalBalance, schoolId },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "ChartOfAccount",
      entityId: account.id,
      userId: req.user?.id,
      schoolId,
      newData: account,
    });

    res.status(201).json(account);
  }),
);

// ─── Update Account ────────────────────────────────────────────────────────
accountRoute.put(
  "/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description } = req.body;

    const old = await prisma.chartOfAccount.findUnique({ where: { id } });
    if (!old) return res.status(404).json({ message: "Account not found." });

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: { name, description },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "ChartOfAccount",
      entityId: id,
      userId: req.user?.id,
      schoolId: account.schoolId,
      oldData: old,
      newData: account,
    });

    res.json(account);
  }),
);

// ─── Activate / Deactivate Account ────────────────────────────────────────
accountRoute.put(
  "/:id/toggle-status",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.chartOfAccount.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Account not found." });

    const account = await prisma.chartOfAccount.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    res.json({
      message: `Account ${account.isActive ? "activated" : "deactivated"}.`,
      account,
    });
  }),
);

// ─── Get All Accounts (per school) ────────────────────────────────────────
accountRoute.get(
  "/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;

    const accounts = await prisma.chartOfAccount.findMany({
      where: { schoolId },
      orderBy: { code: "asc" },
    });

    res.json(accounts);
  }),
);

// ─── Get Accounts by Type ─────────────────────────────────────────────────
accountRoute.get(
  "/school/:schoolId/type/:accountType",
  expressAsyncHandler(async (req, res) => {
    const { schoolId, accountType } = req.params;

    const accounts = await prisma.chartOfAccount.findMany({
      where: { schoolId, accountType, isActive: true },
      orderBy: { code: "asc" },
    });

    res.json(accounts);
  }),
);

export default accountRoute;
