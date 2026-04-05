import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import { userRoute } from "./routes/users.js";
import { subjectRoute } from "./routes/subjects.js";
import { examRoute } from "./routes/exam.js";
import { studentRoute } from "./routes/student.js";
import accountingRouter from "./routes/index.js";

const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());

const port = process.env.port || 4000;

// Existing routes
app.use("/api/students", studentRoute);
app.use("/api/users", userRoute);
app.use("/api/subjects", subjectRoute);
app.use("/api/exams", examRoute);

// ─── DELETE SCHOOL AND ALL RELATED DATA ───────────────────────────────────
// DELETE http://localhost:5000/api/delete-school/:schoolId

app.delete("/api/delete-school/:schoolId", async (req, res) => {
  const { schoolId } = req.params;

  try {
    // 1. Audit logs (references users, no dependents)
    await prisma.auditLog.deleteMany({ where: { schoolId } });

    // 2. Journal lines (depends on journalEntry and chartOfAccount)
    await prisma.journalLine.deleteMany({
      where: { JournalEntry: { schoolId } },
    });

    // 3. Null out self-referencing reversal links first
    await prisma.journalEntry.updateMany({
      where: { schoolId },
      data: { reversalOfId: null },
    });

    // Then delete journal entries
    await prisma.journalEntry.deleteMany({ where: { schoolId } });
    // 4. Fee payments (depends on studentFee, student, session, chartOfAccount)
    await prisma.feePayment.deleteMany({ where: { schoolId } });

    // 5. Student fees (depends on feeStructure, student, session)
    await prisma.studentFee.deleteMany({ where: { schoolId } });

    // 6. Fee structures (depends on session, chartOfAccount)
    await prisma.feeStructure.deleteMany({ where: { schoolId } });

    // 7. Expenses (depends on session, chartOfAccount, user)
    await prisma.expense.deleteMany({ where: { schoolId } });

    // 8. Donations (depends on session, chartOfAccount)
    await prisma.donation.deleteMany({ where: { schoolId } });

    // 9. Loans (depends on session, chartOfAccount)
    await prisma.loan.deleteMany({ where: { schoolId } });

    // 10. Academic sessions (depends on school only)
    await prisma.academicSession.deleteMany({ where: { schoolId } });

    // 11. Chart of accounts (depends on school only)
    await prisma.chartOfAccount.deleteMany({ where: { schoolId } });

    // 12. Answers (depends on student, exam)
    await prisma.answer.deleteMany({ where: { schoolId } });

    // 13. Exams (depends on subject, school)
    await prisma.exam.deleteMany({ where: { schoolId } });

    // 14. Subjects (depends on school only)
    await prisma.subject.deleteMany({ where: { schoolId } });

    // 15. Students (depends on school only)
    await prisma.student.deleteMany({ where: { schoolId } });

    res.json({
      message: `School ${schoolId} and all related data deleted successfully.`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Deletion failed.", error: error.message });
  }
});
// ✅ Accounting routes
app.use("/api/accounting", accountingRouter);

app.get("/", (req, res) => res.send("welcome to blog app"));

app.use((err, req, res, next) => {
  res.status(500).send({ message: `${err.message}` });
});

app.listen(port, () =>
  console.log(`server is currently running on port http://localhost:${port}`),
);
