import express from "express";
const sessionRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";

import { createAuditLog } from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ─── Create Academic Session ───────────────────────────────────────────────
sessionRoute.post(
  "/",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { name, term, startDate, endDate, schoolId } = req.body;
    if (!name || !term || !startDate || !endDate || !schoolId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existing = await prisma.academicSession.findFirst({
      where: { name, term, schoolId },
    });

    if (existing) {
      return res.status(409).json({
        message: `${term} term already exists for session "${name}".`,
      });
    }

    const session = await prisma.academicSession.create({
      data: {
        name,
        term,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        schoolId,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "AcademicSession",
      entityId: session.id,
      userId: req.user?.id,
      schoolId,
      newData: session,
    });

    res.status(201).json(session);
  }),
);
// ─── Get All Sessions (per school) ────────────────────────────────────────
sessionRoute.get(
  "/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;

    const sessions = await prisma.academicSession.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
    });

    res.json(sessions);
  }),
);

// ─── Get Current Session ───────────────────────────────────────────────────
sessionRoute.get(
  "/current/:schoolId",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;

    const session = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
    });

    if (!session) {
      return res.status(404).json({ message: "No current session found." });
    }

    res.json(session);
  }),
);

// ─── Set Current Session ───────────────────────────────────────────────────
sessionRoute.put(
  "/:id/set-current",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { schoolId } = req.body;

    if (!schoolId) {
      return res.status(400).json({ message: "schoolId is required." });
    }

    // Unset all other sessions for this school
    await prisma.academicSession.updateMany({
      where: { schoolId, isCurrent: true },
      data: { isCurrent: false },
    });

    const session = await prisma.academicSession.update({
      where: { id },
      data: { isCurrent: true },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "AcademicSession",
      entityId: id,
      userId: req.user?.id,
      schoolId,
      newData: { isCurrent: true },
    });

    res.json(session);
  }),
);

// ─── Lock Session ─────────────────────────────────────────────────────────
sessionRoute.put(
  "/:id/lock",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const session = await prisma.academicSession.update({
      where: { id },
      data: { isLocked: true },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "AcademicSession",
      entityId: id,
      userId: req.user?.id,
      schoolId: session.schoolId,
      newData: { isLocked: true },
    });

    res.json({ message: "Session locked.", session });
  }),
);

// ─── Unlock Session ───────────────────────────────────────────────────────
sessionRoute.put(
  "/:id/unlock",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const session = await prisma.academicSession.update({
      where: { id },
      data: { isLocked: false },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "AcademicSession",
      entityId: id,
      userId: req.user?.id,
      schoolId: session.schoolId,
      newData: { isLocked: false },
    });

    res.json({ message: "Session unlocked.", session });
  }),
);

export default sessionRoute;
