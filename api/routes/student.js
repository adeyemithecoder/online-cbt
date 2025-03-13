import express from "express";
const studentRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";

//create-student
studentRoute.post(
  "/create-student",
  expressAsyncHandler(async (req, res) => {
    try {
      const { username, schoolId } = req.body;

      // Check if schoolId is provided
      if (!schoolId) {
        return res.status(400).json({ message: "schoolId is required" });
      }

      // Check if student already exists
      const studentAlreadyExist = await prisma.student.findUnique({
        where: { username },
      });

      if (studentAlreadyExist) {
        return res.status(409).json({
          message: `Student with the name '${username}' already exists`,
        });
      }

      // Create new student
      const newStudent = await prisma.student.create({
        data: req.body,
      });

      res.status(201).json(newStudent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);
//create-answer
studentRoute.post(
  "/create-answer",
  expressAsyncHandler(async (req, res) => {
    try {
      const { studentId, schoolId, examId, answers } = req.body;
      const studentExists = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!studentExists) {
        return res.status(404).json({ message: "Student not found" });
      }
      const examExists = await prisma.exam.findUnique({
        where: { id: examId },
        include: { questions: true },
      });
      if (!examExists) {
        return res.status(404).json({ message: "Exam not found" });
      }
      const validQuestionIds = examExists.questions.map((q) => q.id);
      const invalidAnswers = answers.filter(
        (answer) => !validQuestionIds.includes(answer.questionId)
      );
      if (invalidAnswers.length > 0) {
        return res.status(400).json({
          message: "Invalid question ID(s) in answers",
          invalidAnswers,
        });
      }
      const newAnswer = await prisma.answer.create({
        data: {
          studentId,
          schoolId,
          examId,
          answers: JSON.stringify(answers),
        },
      });

      res.status(201).json(newAnswer);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//delete-answer
studentRoute.delete(
  "/delete-answers/:schoolId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { schoolId } = req.params;
      // Check if schoolId is provided
      if (!schoolId) {
        return res.status(400).json({ message: "School ID is required" });
      }

      // Check if the school exists
      const schoolExists = await prisma.school.findUnique({
        where: { id: schoolId },
      });
      if (!schoolExists) {
        return res.status(404).json({ message: "School not found" });
      }

      // Delete all answers for the given schoolId
      const deletedAnswers = await prisma.answer.deleteMany({
        where: { schoolId },
      });

      res.status(200).json({
        message: `Successfully deleted ${deletedAnswers.count} answers for school ID ${schoolId}`,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//Get answer by studentId
studentRoute.get(
  "/answers/:studentId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      const studentAnswers = await prisma.answer.findMany({
        where: { studentId },
        include: {
          Exam: {
            include: {
              questions: true, // Include questions
              Subject: true, // Include subject for subjectName
            },
          },
        },
      });
      // Transform the response to the desired format
      const formattedAnswers = studentAnswers.map((answerRecord) => {
        const parsedAnswers = JSON.parse(answerRecord.answers); // Parse answers JSON
        const questionsAndAnswers = parsedAnswers.map((item) => {
          // Find the corresponding question
          const question = answerRecord.Exam.questions.find(
            (q) => q.id === item.questionId
          );
          return {
            question: question?.question || "Question not found",
            selectedOption: item.selectedOption,
            correctAnswer: question?.correctAnswer || null,
          };
        });

        return {
          name: student.name,
          surname: student.surname,
          level: answerRecord.Exam.level,
          termType: answerRecord.Exam.termType,
          examName: answerRecord.Exam.Subject?.name || "Unknown Subject", // Fetch Subject Name
          questionsAndAnswers,
        };
      });

      // Send the transformed response
      res.status(200).json(formattedAnswers);
    } catch (err) {
      console.error(err);
      res
        .status(500)
        .json({ message: "An error occurred", error: err.message });
    }
  })
);

//check-score-exists
studentRoute.get(
  "/check-score-exists/:studentId/:examId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { studentId, examId } = req.params;
      // Find the student by ID
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      // Parse the subjects field, which is stored as a JSON string
      const existingSubjects = student.subjects
        ? JSON.parse(student.subjects)
        : {};
      // Check if the examId exists in the parsed subjects
      const scoreExists = Object.hasOwn(existingSubjects, examId);
      res.status(200).json({ scoreExists });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//login-student
studentRoute.post(
  "/login-student",
  expressAsyncHandler(async (req, res) => {
    const { username, password } = req.body;
    try {
      const studentByUsername = await prisma.student.findUnique({
        where: {
          username: username,
        },
      });

      if (!studentByUsername) {
        console.log("Username not found");
        res.status(404).send({
          message: "Username not found",
        });
      }
      const student = await prisma.student.findFirst({
        where: {
          AND: [{ username: username }, { password: password }],
        },
      });

      if (!student) {
        console.log("Wrong password");
        res.status(404).send({
          message: "Wrong password",
        });
      }
      res.status(200).json(student);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//get-students-by-level
studentRoute.get(
  "/get-students-by-level/:level/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { level, schoolId } = req.params;
    try {
      if (!level || !schoolId) {
        return res.status(400).json({
          message: "Level and schoolId are required",
        });
      }
      const students = await prisma.student.findMany({
        where: {
          AND: [{ level: level }, { schoolId: schoolId }],
        },
      });

      res.status(200).json(students);
    } catch (err) {
      console.error("Error fetching students:", err.message);
      res.status(500).json({ message: err.message });
    }
  })
);

//Delete student
studentRoute.delete(
  "/student/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const studentId = req.params.id;
      const deletedStudent = await prisma.student.delete({
        where: { id: studentId },
      });
      res.status(200).json(deletedStudent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//Get studentbyId
studentRoute.get(
  "/student/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const studentId = req.params.id;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });
      if (!student) {
        return res.status(404).json({
          message: "Student not found",
        });
      }
      res.status(200).json(student);
    } catch (err) {
      console.error("Error fetching student by ID:", err.message);
      res.status(500).json({
        message: "Error fetching student",
        error: err.message,
      });
    }
  })
);

//Update student data
studentRoute.patch(
  "/student/:id",
  expressAsyncHandler(async (req, res) => {
    const studentId = req.params.id;
    const { level, password, name, username, surname } = req.body;
    try {
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          level,
          password,
          name,
          username,
          surname,
        },
      });
      res.status(200).json(updatedStudent);
    } catch (err) {
      console.error("Error updating student:", err.message);
      res.status(500).json({
        message: "Error updating student",
        error: err.message,
      });
    }
  })
);

//Update student exam score
studentRoute.put(
  "/update-student-subjects/:studentId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { studentId } = req.params;
      const { subjects } = req.body;

      const student = await prisma.student.findUnique({
        where: { id: studentId },
      });

      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }

      // Parse existing subjects
      const existingSubjects = student.subjects
        ? JSON.parse(student.subjects)
        : {};

      // Merge new subjects (update existing ones or add new ones)
      const updatedSubjects = { ...existingSubjects, ...subjects };

      // Save updated subjects
      const updatedStudent = await prisma.student.update({
        where: { id: studentId },
        data: {
          subjects: JSON.stringify(updatedSubjects),
        },
      });

      res.status(200).json(updatedStudent);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//students-with-exam
studentRoute.get(
  "/students-with-exam/:schoolId/:examId/:studentLevel",
  expressAsyncHandler(async (req, res) => {
    try {
      const { schoolId, examId, studentLevel } = req.params;
      // Find all students matching the schoolId and level
      const students = await prisma.student.findMany({
        where: {
          schoolId,
          level: studentLevel,
        },
      });
      // Extract the relevant data
      const filteredStudents = [];
      for (const student of students) {
        const subjects = student.subjects ? JSON.parse(student.subjects) : {};

        if (Object.hasOwn(subjects, examId)) {
          // Push only the required fields into the filtered array
          filteredStudents.push({
            name: student.name,
            surname: student.surname,
            score: subjects[examId], // Get the score directly from subjects
          });
        }
      }
      res.status(200).json(filteredStudents);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

export { studentRoute };
