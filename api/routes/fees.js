import express from "express";
const feesRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";
import { createAuditLog } from "./_helpers.js";
import { protect } from "../middleware/auth.js";

// ════════════════════════════════════════════════
// STUDENT SEARCH
// ════════════════════════════════════════════════

// ─── Search Students by Name or Surname ───────────────────────────────────
// GET /fees/students/search?q=john&schoolId=xxx
feesRoute.get(
  "/students/search",
  expressAsyncHandler(async (req, res) => {
    const { q, schoolId } = req.query;

    if (!q || !schoolId) {
      return res
        .status(400)
        .json({ message: "Query (q) and schoolId are required." });
    }

    const query = String(q).trim();

    const students = await prisma.student.findMany({
      where: {
        schoolId: String(schoolId),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { surname: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        level: true,
      },
      take: 15, // cap results for performance
      orderBy: { name: "asc" },
    });

    res.json(students);
  }),
);

// ════════════════════════════════════════════════
// FEE STRUCTURE
// ════════════════════════════════════════════════

// ─── Create Fee Structure ─────────────────────────────────────────────────
feesRoute.post(
  "/structures",
  protect,
  expressAsyncHandler(async (req, res) => {
    const {
      name,
      description,
      level,
      isAllLevels,
      amount,
      dueDate,
      sessionId,
      schoolId,
      revenueAccountId,
    } = req.body;

    if (!name || !amount || !sessionId || !schoolId || !revenueAccountId) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // If not school-wide, level is required
    if (!isAllLevels && !level) {
      return res
        .status(400)
        .json({ message: "Level is required for class-specific fees." });
    }

    // Duplicate check
    const existing = await prisma.feeStructure.findFirst({
      where: {
        name,
        sessionId,
        schoolId,
        // if school-wide, check among school-wide fees only
        isAllLevels: isAllLevels ? true : false,
        // if class-specific, check same level
        ...(isAllLevels ? {} : { level }),
      },
    });
    if (existing) {
      return res.status(409).json({
        message: isAllLevels
          ? `A school-wide fee named "${name}" already exists in this session.`
          : `A fee named "${name}" already exists for ${level} in this session.`,
      });
    }

    try {
      const structure = await prisma.feeStructure.create({
        data: {
          name,
          description,
          level: isAllLevels ? null : level,
          isAllLevels: isAllLevels ?? false,
          amount,
          dueDate: dueDate ? new Date(dueDate) : null,
          sessionId,
          schoolId,
          revenueAccountId,
        },
      });

      await createAuditLog({
        action: "CREATE",
        entity: "FeeStructure",
        entityId: structure.id,
        userId: req.user?.id,
        schoolId,
        newData: structure,
      });

      res.status(201).json(structure);
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(409).json({
          message: `A fee structure with this name already exists in this session.`,
        });
      }
      throw e;
    }
  }),
);

// ─── Update Fee Structure ─────────────────────────────────────────────────
feesRoute.put(
  "/structures/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, description, amount, dueDate } = req.body;

    const old = await prisma.feeStructure.findUnique({ where: { id } });
    if (!old)
      return res.status(404).json({ message: "Fee structure not found." });

    const structure = await prisma.feeStructure.update({
      where: { id },
      data: {
        name,
        description,
        amount,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "FeeStructure",
      entityId: id,
      userId: req.user?.id,
      schoolId: structure.schoolId,
      oldData: old,
      newData: structure,
    });

    res.json(structure);
  }),
);

// ─── Activate / Deactivate Fee Structure ──────────────────────────────────
feesRoute.put(
  "/structures/:id/toggle-status",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.feeStructure.findUnique({ where: { id } });
    if (!existing)
      return res.status(404).json({ message: "Fee structure not found." });

    const structure = await prisma.feeStructure.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    res.json({
      message: `Fee structure ${structure.isActive ? "activated" : "deactivated"}.`,
      structure,
    });
  }),
);

// ─── Get All Fee Structures ────────────────────────────────────────────────
feesRoute.get(
  "/structures/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    const structures = await prisma.feeStructure.findMany({
      where: { schoolId, ...(sessionId ? { sessionId } : {}) },
      include: { RevenueAccount: true, Session: true },
      orderBy: { createdAt: "desc" },
    });

    res.json(structures);
  }),
);

// ─── Get Fee Structures by Class / Level ──────────────────────────────────
feesRoute.get(
  "/structures/school/:schoolId/level/:level",
  expressAsyncHandler(async (req, res) => {
    const { schoolId, level } = req.params;
    const { sessionId } = req.query;

    const structures = await prisma.feeStructure.findMany({
      where: {
        schoolId,
        level,
        isActive: true,
        ...(sessionId ? { sessionId } : {}),
      },
      include: { RevenueAccount: true },
    });

    res.json(structures);
  }),
);

// ════════════════════════════════════════════════
// STUDENT FEES
// ════════════════════════════════════════════════

// ─── Assign Fee to Student (generate StudentFee) ──────────────────────────
feesRoute.post(
  "/student-fees",
  expressAsyncHandler(async (req, res) => {
    const { studentId, feeStructureId, sessionId, schoolId } = req.body;

    if (!studentId || !feeStructureId || !sessionId || !schoolId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const structure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });
    if (!structure) {
      return res.status(404).json({ message: "Fee structure not found." });
    }

    const exists = await prisma.studentFee.findUnique({
      where: { studentId_feeStructureId: { studentId, feeStructureId } },
    });
    if (exists) {
      return res.status(409).json({
        message: "This fee has already been assigned to this student.",
      });
    }

    try {
      const studentFee = await prisma.studentFee.create({
        data: {
          studentId,
          feeStructureId,
          sessionId,
          schoolId,
          amountCharged: structure.amount,
          amountPaid: 0,
          status: "UNPAID",
        },
      });
      res.status(201).json(studentFee);
    } catch (e) {
      if (e.code === "P2002") {
        return res.status(409).json({
          message: "This fee has already been assigned to this student.",
        });
      }
      throw e;
    }
  }),
);

// ─── Bulk Assign Fee to All Students in a Level ───────────────────────────
feesRoute.post(
  "/student-fees/bulk-assign",
  expressAsyncHandler(async (req, res) => {
    const { feeStructureId, sessionId, schoolId } = req.body;

    if (!feeStructureId || !sessionId || !schoolId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const structure = await prisma.feeStructure.findUnique({
      where: { id: feeStructureId },
    });
    if (!structure) {
      return res.status(404).json({ message: "Fee structure not found." });
    }

    // If school-wide fee, assign to ALL students, otherwise filter by level
    const students = await prisma.student.findMany({
      where: {
        schoolId,
        ...(structure.isAllLevels ? {} : { level: structure.level }),
      },
    });

    if (students.length === 0) {
      return res.status(404).json({
        message: structure.isAllLevels
          ? "No students found in this school."
          : `No students found for level ${structure.level}.`,
      });
    }

    let assigned = 0;
    let skipped = 0;

    for (const student of students) {
      const exists = await prisma.studentFee.findUnique({
        where: {
          studentId_feeStructureId: { studentId: student.id, feeStructureId },
        },
      });
      if (exists) {
        skipped++;
        continue;
      }

      try {
        await prisma.studentFee.create({
          data: {
            studentId: student.id,
            feeStructureId,
            sessionId,
            schoolId,
            amountCharged: structure.amount,
            amountPaid: 0,
            status: "UNPAID",
          },
        });
        assigned++;
      } catch (e) {
        if (e.code === "P2002") {
          skipped++;
        } else {
          throw e;
        }
      }
    }

    res.json({
      message: `Done. Assigned: ${assigned}, Already existed (skipped): ${skipped}.`,
      assigned,
      skipped,
    });
  }),
);

// ─── Get All Fees for a Student ───────────────────────────────────────────
feesRoute.get(
  "/student-fees/student/:studentId",
  expressAsyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { sessionId } = req.query;

    const fees = await prisma.studentFee.findMany({
      where: { studentId, ...(sessionId ? { sessionId } : {}) },
      include: { FeeStructure: true, Session: true, payments: true },
    });

    res.json(fees);
  }),
);

// ─── Get Outstanding Fees (school-wide or per session) ────────────────────
// ─── Get Outstanding Fees (school-wide or per session) ─────────────────────
feesRoute.get(
  "/student-fees/outstanding/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { sessionId } = req.query;

    const fees = await prisma.studentFee.findMany({
      where: {
        schoolId,
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
        ...(sessionId ? { sessionId } : {}),
      },
      include: {
        Student: {
          select: {
            id: true,
            name: true,
            surname: true,
            level: true,
            username: true,
          },
        },
        FeeStructure: { select: { name: true, amount: true } },
        Session: { select: { name: true, term: true } }, // ← ADD THIS
      },
      orderBy: { createdAt: "asc" },
    });

    // Compute balance due per record
    const result = fees.map((f) => ({
      ...f,
      balanceDue: f.amountCharged - f.amountPaid,
    }));

    const totalOutstanding = result.reduce((s, f) => s + f.balanceDue, 0);

    res.json({ fees: result, totalOutstanding, count: result.length });
  }),
);

// ─── Outstanding Fees Grouped by Session ──────────────────────────────────
// GET /fees/student-fees/outstanding-summary/:schoolId
feesRoute.get(
  "/student-fees/outstanding-summary/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;

    const fees = await prisma.studentFee.findMany({
      where: {
        schoolId,
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      include: {
        Session: { select: { id: true, name: true, term: true } },
      },
    });

    // Group by session
    const grouped = {};
    for (const fee of fees) {
      const key = fee.sessionId;
      if (!grouped[key]) {
        grouped[key] = {
          sessionId: fee.sessionId,
          sessionName: fee.Session?.name,
          term: fee.Session?.term,
          totalOutstanding: 0,
          studentCount: new Set(),
          feeCount: 0,
        };
      }
      grouped[key].totalOutstanding += fee.amountCharged - fee.amountPaid;
      grouped[key].studentCount.add(fee.studentId);
      grouped[key].feeCount++;
    }

    const summary = Object.values(grouped).map((g) => ({
      ...g,
      studentCount: g.studentCount.size, // convert Set → number
    }));

    res.json(summary);
  }),
);

// ─── Get a Student's Outstanding Fees Across All Sessions ─────────────────
// GET /fees/student-fees/student/:studentId/outstanding
feesRoute.get(
  "/student-fees/student/:studentId/outstanding",
  expressAsyncHandler(async (req, res) => {
    const { studentId } = req.params;

    const fees = await prisma.studentFee.findMany({
      where: {
        studentId,
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      include: {
        FeeStructure: { select: { name: true, amount: true } },
        Session: { select: { name: true, term: true } },
        payments: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const result = fees.map((f) => ({
      ...f,
      balanceDue: f.amountCharged - f.amountPaid,
    }));

    const totalOwed = result.reduce((s, f) => s + f.balanceDue, 0);

    res.json({ fees: result, totalOwed });
  }),
);

// ─── Carry Forward Outstanding Fees to a New Session ─────────────────────
// POST /fees/student-fees/carry-forward
feesRoute.post(
  "/student-fees/carry-forward",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { fromSessionId, toSessionId, schoolId } = req.body;

    if (!fromSessionId || !toSessionId || !schoolId) {
      return res
        .status(400)
        .json({
          message: "fromSessionId, toSessionId and schoolId are required.",
        });
    }

    // Get all unpaid/partial fees from the old session
    const outstanding = await prisma.studentFee.findMany({
      where: {
        schoolId,
        sessionId: fromSessionId,
        status: { in: ["UNPAID", "PARTIALLY_PAID"] },
      },
      include: { FeeStructure: true },
    });

    if (outstanding.length === 0) {
      return res.status(404).json({
        message: "No outstanding fees found for the selected session.",
      });
    }

    let carried = 0;
    let skipped = 0;

    for (const fee of outstanding) {
      const balanceDue = fee.amountCharged - fee.amountPaid;
      if (balanceDue <= 0) {
        skipped++;
        continue;
      }

      // Check if already carried forward
      const exists = await prisma.studentFee.findFirst({
        where: {
          studentId: fee.studentId,
          feeStructureId: fee.feeStructureId,
          sessionId: toSessionId,
          carriedForwardFrom: fee.id, // track origin
        },
      });
      if (exists) {
        skipped++;
        continue;
      }

      try {
        await prisma.studentFee.create({
          data: {
            studentId: fee.studentId,
            feeStructureId: fee.feeStructureId,
            sessionId: toSessionId,
            schoolId,
            amountCharged: balanceDue, // only the unpaid balance
            amountPaid: 0,
            status: "UNPAID",
            carriedForwardFrom: fee.id, // ← add this field to your schema
          },
        });
        carried++;
      } catch (e) {
        if (e.code === "P2002") {
          skipped++;
        } else {
          throw e;
        }
      }
    }

    res.json({
      message: `Carry forward complete. Carried: ${carried}, Skipped: ${skipped}.`,
      carried,
      skipped,
    });
  }),
);

// ════════════════════════════════════════════════
// STUDENT MANAGEMENT ROUTES
// ════════════════════════════════════════════════

// ─── Register a New Student ───────────────────────────────────────────────
// POST /fees/students
feesRoute.post(
  "/students",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { name, surname, username, password, level, schoolId } = req.body;

    if (!name || !surname || !username || !password || !level || !schoolId) {
      return res.status(400).json({
        message:
          "Name, surname, username, password, level and schoolId are required.",
      });
    }

    const existing = await prisma.student.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({ message: "Username already taken." });
    }

    const student = await prisma.student.create({
      data: { name, surname, username, password, level, schoolId },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        level: true,
        schoolId: true,
      },
    });

    await createAuditLog({
      action: "CREATE",
      entity: "Student",
      entityId: student.id,
      userId: req.user?.id,
      schoolId,
      newData: { name, surname, username, level },
    });

    res.status(201).json(student);
  }),
);

// ─── Get All Students for a School ───────────────────────────────────────
// GET /fees/students/school/:schoolId
feesRoute.get(
  "/students/school/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    const { level } = req.query;

    const students = await prisma.student.findMany({
      where: {
        schoolId,
        ...(level ? { level } : {}),
      },
      orderBy: { surname: "asc" },
    });

    res.json(students);
  }),
);

// ─── Search Students by Name or Surname ──────────────────────────────────
// GET /fees/students/search?q=john&schoolId=xxx
feesRoute.get(
  "/students/search",
  expressAsyncHandler(async (req, res) => {
    const { q, schoolId } = req.query;

    if (!q || !schoolId) {
      return res
        .status(400)
        .json({ message: "Query (q) and schoolId are required." });
    }

    const query = String(q).trim();

    const students = await prisma.student.findMany({
      where: {
        schoolId: String(schoolId),
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { surname: { contains: query, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        level: true,
      },
      take: 15,
      orderBy: { name: "asc" },
    });

    res.json(students);
  }),
);
// PUT /fees/students/:id
feesRoute.put(
  "/students/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, surname, level, password } = req.body;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Student not found." });
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(surname && { surname }),
        ...(level && { level }),
        ...(password && { password }),
      },
      select: {
        id: true,
        name: true,
        surname: true,
        username: true,
        level: true,
        schoolId: true,
      },
    });

    await createAuditLog({
      action: "UPDATE",
      entity: "Student",
      entityId: id,
      userId: req.user?.id,
      schoolId: existing.schoolId,
      oldData: {
        name: existing.name,
        surname: existing.surname,
        level: existing.level,
      },
      newData: {
        name: student.name,
        surname: student.surname,
        level: student.level,
      },
    });

    res.json(student);
  }),
);

// DELETE /fees/students/:id
feesRoute.delete(
  "/students/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await prisma.student.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Prisma cascade (onDelete: Cascade on Student relations) handles
    // StudentFee, FeePayment and Answer deletion automatically.
    await prisma.student.delete({ where: { id } });

    await createAuditLog({
      action: "DELETE",
      entity: "Student",
      entityId: id,
      userId: req.user?.id,
      schoolId: existing.schoolId,
      oldData: {
        name: existing.name,
        surname: existing.surname,
        level: existing.level,
      },
    });

    res.json({ message: "Student deleted successfully." });
  }),
);
// ─── Remove Fee Assignment from Student ───────────────────────────────────
feesRoute.delete(
  "/student-fees/:id",
  protect,
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;

    const studentFee = await prisma.studentFee.findUnique({ where: { id } });
    if (!studentFee)
      return res.status(404).json({ message: "Student fee not found." });

    // Only allow removal if no payment has been made yet
    if (studentFee.amountPaid > 0) {
      return res.status(400).json({
        message:
          "Cannot remove a fee that has already been partially or fully paid.",
      });
    }

    await prisma.studentFee.delete({ where: { id } });

    res.json({ message: "Fee assignment removed successfully." });
  }),
);

export default feesRoute;
