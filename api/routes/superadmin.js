import express from "express";
const superAdminRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import { protect, requireRole } from "../middleware/auth.js";

// ─── Get All Schools ───────────────────────────────────────────────────────
superAdminRoute.get(
  "/schools",
  protect,
  requireRole("SUPER_ADMIN"),
  expressAsyncHandler(async (req, res) => {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: { users: true, students: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(schools);
  }),
);

// ─── Get Single School ─────────────────────────────────────────────────────
superAdminRoute.get(
  "/schools/:id",
  protect,
  requireRole("SUPER_ADMIN"),
  expressAsyncHandler(async (req, res) => {
    const school = await prisma.school.findUnique({
      where: { id: req.params.id },
      include: {
        _count: { select: { users: true, students: true } },
      },
    });
    if (!school) return res.status(404).json({ message: "School not found." });
    res.json(school);
  }),
);

// ─── Create School ─────────────────────────────────────────────────────────
superAdminRoute.post(
  "/schools",
  protect,
  requireRole("SUPER_ADMIN"),
  expressAsyncHandler(async (req, res) => {
    const { name, fullName, classes } = req.body;

    if (!name || !classes || classes.length === 0) {
      return res.status(400).json({
        message: "School name and at least one class are required.",
      });
    }

    const existing = await prisma.school.findUnique({ where: { name } });
    if (existing) {
      return res.status(409).json({
        message: `A school with name "${name}" already exists.`,
      });
    }

    const school = await prisma.school.create({
      data: {
        name,
        fullName,
        classes: classes.map((c) => c.toLowerCase().trim()),
      },
    });

    res.status(201).json(school);
  }),
);

// ─── Update School ─────────────────────────────────────────────────────────
superAdminRoute.put(
  "/schools/:id",
  protect,
  requireRole("SUPER_ADMIN"),
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, fullName, classes } = req.body;

    const school = await prisma.school.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(fullName !== undefined ? { fullName } : {}),
        ...(classes
          ? { classes: classes.map((c) => c.toLowerCase().trim()) }
          : {}),
      },
    });

    res.json(school);
  }),
);

// ─── Delete School ─────────────────────────────────────────────────────────
superAdminRoute.delete(
  "/schools/:id",
  protect,
  requireRole("SUPER_ADMIN"),
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    // Delete in correct order
    await prisma.auditLog.deleteMany({ where: { schoolId: id } });
    await prisma.journalLine.deleteMany({
      where: { JournalEntry: { schoolId: id } },
    });
    await prisma.journalEntry.updateMany({
      where: { schoolId: id },
      data: { reversalOfId: null },
    });
    await prisma.journalEntry.deleteMany({ where: { schoolId: id } });
    await prisma.feePayment.deleteMany({ where: { schoolId: id } });
    await prisma.studentFee.deleteMany({ where: { schoolId: id } });
    await prisma.feeStructure.deleteMany({ where: { schoolId: id } });
    await prisma.expense.deleteMany({ where: { schoolId: id } });
    await prisma.donation.deleteMany({ where: { schoolId: id } });
    await prisma.loan.deleteMany({ where: { schoolId: id } });
    await prisma.academicSession.deleteMany({ where: { schoolId: id } });
    await prisma.chartOfAccount.deleteMany({ where: { schoolId: id } });
    await prisma.answer.deleteMany({ where: { schoolId: id } });
    await prisma.exam.deleteMany({ where: { schoolId: id } });
    await prisma.subject.deleteMany({ where: { schoolId: id } });
    await prisma.student.deleteMany({ where: { schoolId: id } });
    // await prisma.user.deleteMany({ where: { schoolId: id } });
    // await prisma.school.delete({ where: { id } });

    res.json({ message: "School and all related data deleted successfully." });
  }),
);

// ─── Create Admin User for a School ───────────────────────────────────────
superAdminRoute.post(
  "/schools/:id/admins",
  protect,
  requireRole("SUPER_ADMIN"),
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { username, password, name, role } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username and password are required." });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: "Username already taken." });
    }

    const user = await prisma.user.create({
      data: {
        username,
        password, // ⚠️ stored as plain text
        name,
        role: role || "ADMIN",
        schoolId: id,
      },
    });

    res.status(201).json({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
  }),
);

export default superAdminRoute;
