import express from "express";
const examRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";

// Create Exam
examRoute.post(
  "/create-exam",
  expressAsyncHandler(async (req, res) => {
    try {
      const { visible, examDuration, termType, level, schoolId, subjectId } =
        req.body;
      const existingExam = await prisma.exam.findFirst({
        where: {
          termType,
          level,
          subjectId,
          schoolId,
        },
      });
      if (existingExam) {
        return res.status(400).json({
          message:
            "An exam for this subject already exists for the selected term and class.",
        });
      }

      // Create the new exam
      const exam = await prisma.exam.create({
        data: {
          visible,
          examDuration,
          termType,
          schoolId,
          level,
          subjectId,
        },
      });

      res.status(201).json(exam);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);
//delete-exam by id
examRoute.delete(
  "/delete/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;

      // Check if the exam exists
      const existingExam = await prisma.exam.findUnique({
        where: { id },
      });

      if (!existingExam) {
        return res.status(404).json({ message: "Exam not found." });
      }

      // Delete the exam
      await prisma.exam.delete({
        where: { id },
      });

      res.status(200).json({ message: "Exam deleted successfully." });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

// Get Exams by level and termType
examRoute.get(
  "/exams-by-level-term",
  expressAsyncHandler(async (req, res) => {
    try {
      const { level, termType, schoolId } = req.query;
      console.log(level, termType, schoolId);
      // Validate query parameters
      if (!level || !termType || !schoolId) {
        return res.status(400).json({
          message: "Both level and termType are required to fetch exams.",
        });
      }

      // Fetch exams along with the subject name
      const exams = await prisma.exam.findMany({
        where: {
          level,
          termType,
          schoolId,
        },
        include: {
          Subject: {
            select: {
              name: true, // Fetch only the subject name
            },
          },
        },
      });
      // Format the response to include subject name directly
      const formattedExams = exams.map((exam) => ({
        id: exam.id,
        level: exam.level,
        termType: exam.termType,
        visible: exam.visible,
        examDuration: exam.examDuration,
        subjectId: exam.subjectId,
        subjectName: exam.Subject?.name || "Unknown",
      }));
      res.status(200).json(formattedExams);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch exams", error: err.message });
    }
  })
);

// Get Exams by Subject
examRoute.get(
  "/exams/:subjectId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { subjectId } = req.params;

      const exams = await prisma.exam.findMany({
        where: { subjectId },
      });

      res.status(200).json(exams);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch exams", error: err.message });
    }
  })
);

//Get all exam where visible is true
examRoute.get(
  "/visible-true-exams/:schoolId",
  expressAsyncHandler(async (req, res) => {
    const { schoolId } = req.params;
    console.log(schoolId);
    try {
      const exams = await prisma.exam.findMany({
        where: {
          visible: true,
          schoolId,
        },
        include: {
          Subject: {
            select: {
              name: true,
            },
          },
        },
      });

      if (exams.length === 0) {
        return res.status(404).json({
          message:
            "No hidden exams found for the specified level and term type.",
        });
      }

      // Format the response to include subject name directly
      const formattedExams = exams.map((exam) => ({
        id: exam.id,
        level: exam.level,
        termType: exam.termType,
        visible: exam.visible,
        examDuration: exam.examDuration,
        subjectName: exam.Subject?.name || "Unknown",
      }));

      res.status(200).json(formattedExams);
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch visible exams",
        error: err.message,
      });
    }
  })
);

//update-visibility
examRoute.put(
  "/update-visibility-duration",
  expressAsyncHandler(async (req, res) => {
    try {
      const { updates } = req.body;

      // Validate request body
      if (!Array.isArray(updates) || updates.length === 0) {
        return res.status(400).json({
          message: "Updates array is required and cannot be empty.",
        });
      }

      // Validate each update object
      for (const update of updates) {
        if (
          !update.id ||
          typeof update.visible !== "boolean" ||
          typeof update.examDuration !== "number"
        ) {
          return res.status(400).json({
            message:
              "Each update must include 'id', 'visible', and 'examDuration'.",
          });
        }
      }

      // Perform updates in a transaction
      const updatePromises = updates.map((update) =>
        prisma.exam.update({
          where: { id: update.id },
          data: {
            visible: update.visible,
            examDuration: update.examDuration,
          },
        })
      );

      await Promise.all(updatePromises);
      res.status(200).json({
        message: "Exam visibility and durations updated successfully.",
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//Get exam by examId
examRoute.get(
  "/exam/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params;
      console.log(id);
      // Validate exam ID
      if (!id) {
        return res.status(400).json({
          message: "Exam ID is required to fetch the exam.",
        });
      }
      // Fetch the exam with questions and subject name
      const exam = await prisma.exam.findUnique({
        where: {
          id,
        },
        include: {
          Subject: {
            select: {
              name: true, // Include the subject name
            },
          },
          questions: true, // Include all questions
        },
      });
      if (!exam) {
        return res.status(404).json({
          message: "Exam not found.",
        });
      }

      // Format the response
      const formattedExam = {
        id: exam.id,
        level: exam.level,
        termType: exam.termType,
        visible: exam.visible,
        examDuration: exam.examDuration,
        subjectName: exam.Subject?.name || "Unknown",
        questions: exam.questions.map((question) => ({
          id: question.id,
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
        })),
      };
      res.status(200).json(formattedExam);
    } catch (err) {
      res.status(500).json({
        message: "Failed to fetch the exam",
        error: err.message,
      });
    }
  })
);

// Create Multiple Question
examRoute.post(
  "/create-questions",
  expressAsyncHandler(async (req, res) => {
    try {
      const { questions, examId } = req.body;
      // Validate input
      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ message: "Questions must be an array" });
      }
      if (!examId) {
        return res.status(400).json({ message: "Exam ID is required" });
      }
      const createdQuestions = await prisma.question.createMany({
        data: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          examId,
        })),
      });
      res.status(201).json("Successfully added all questions");
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

// Create Single Question
examRoute.post(
  "/create-question",
  expressAsyncHandler(async (req, res) => {
    try {
      const { question, options, correctAnswer, examId } = req.body;

      // Validate input
      if (!question || !Array.isArray(options) || options.length === 0) {
        return res.status(400).json({ message: "Invalid question or options" });
      }
      if (!correctAnswer || !options.includes(correctAnswer)) {
        return res
          .status(400)
          .json({ message: "Correct answer must be one of the options" });
      }
      if (!examId) {
        return res.status(400).json({ message: "Exam ID is required" });
      }

      const createdQuestion = await prisma.question.create({
        data: {
          question,
          options,
          correctAnswer,
          examId,
        },
      });

      res
        .status(201)
        .json({ message: "Question added successfully", createdQuestion });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

// Get Questions by Exam
examRoute.get(
  "/questions/:examId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { examId } = req.params;

      const questions = await prisma.question.findMany({
        where: { examId },
      });
      res.status(200).json(questions);
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to fetch questions", error: err.message });
    }
  })
);

// Get Questions by Id
examRoute.get(
  "/question/:questionId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { questionId } = req.params;
      const question = await prisma.question.findUnique({
        where: { id: questionId },
      });
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.status(200).json(question);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

//Delete quetion byId
examRoute.delete(
  "/question/:questionId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { questionId } = req.params;
      const existingQuestion = await prisma.question.findUnique({
        where: { id: questionId },
      });
      if (!existingQuestion) {
        return res.status(404).json({ message: "Question not found" });
      }
      await prisma.question.delete({
        where: { id: questionId },
      });
      res.status(200).json({ message: "Question deleted successfully" });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Failed to delete question", error: err.message });
    }
  })
);

// Update Questions by Id
examRoute.put(
  "/question/:questionId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { questionId } = req.params;
      const { question, options, correctAnswer, examId } = req.body;
      console.log(options);
      const updatedQuestion = await prisma.question.update({
        where: { id: questionId },
        data: {
          question, // Update question text
          options, // Update options (e.g., an array of answers)
          correctAnswer, // Update correct answer
          examId, // (Optional) Update associated examId
        },
      });

      res
        .status(200)
        .json({ message: "Question updated successfully", updatedQuestion });
    } catch (err) {
      // Handle errors (e.g., question not found or validation errors)
      res
        .status(500)
        .json({ message: "Failed to update question", error: err.message });
    }
  })
);

export { examRoute };
