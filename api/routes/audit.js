import express from "express";
const auditRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";

// ─── Get Logs by Entity ────────────────────────────────────────────────────
auditRoute.get(
  "/entity/:entity/:entityId",
  expressAsyncHandler(async (req, res) => {
    const { entity, entityId } = req.params;

    const logs = await prisma.auditLog.findMany({
      where: { entity, entityId },
      include: { User: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(logs);
  }),
);

// ─── Get Logs by User ─────────────────────────────────────────────────────
auditRoute.get(
  "/user/:userId",
  expressAsyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { schoolId } = req.query;

    const logs = await prisma.auditLog.findMany({
      where: { userId, ...(schoolId ? { schoolId } : {}) },
      orderBy: { createdAt: "desc" },
      take: 100, // Paginate large logs
    });

    res.json(logs);
  }),
);

// ─── Get All Logs for a School ────────────────────────────────────────────
auditRoute.get(
  "/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { entity, startDate, endDate } = req.query;

    const where = { schoolId };
    if (entity) where.entity = entity;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: { User: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    res.json(logs);
  }),
);

export default auditRoute;
