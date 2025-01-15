import express from "express";
const subjectRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import prisma from "../prisma/prisma.js";

// Create Subject
subjectRoute.post(
  "/create-subject",
  expressAsyncHandler(async (req, res) => {
    try {
      const { name, schoolId } = req.body;
      // Check if a subject with the same name and schoolId already exists
      const existingSubject = await prisma.subject.findFirst({
        where: {
          name,
          schoolId,
        },
      });

      if (existingSubject) {
        return res.status(409).json({
          message: `Subject '${name}' already exists for the given school.`,
        });
      }

      // Create a new subject
      const subject = await prisma.subject.create({
        data: {
          name,
          schoolId,
        },
      });

      res.status(201).json({
        message: "Subject created successfully!",
        subject,
      });
    } catch (err) {
      res.status(500).json({
        message: "Failed to create subject",
        error: err.message,
      });
    }
  })
);

// Get All Subjects
subjectRoute.get(
  "/subjects/:schoolId",
  expressAsyncHandler(async (req, res) => {
    try {
      const { schoolId } = req.params;
      const subjects = await prisma.subject.findMany({
        where: { schoolId },
      });
      if (!subjects || subjects.length === 0) {
        return res
          .status(404)
          .json({ message: "No subjects found for this school." });
      }
      res.status(200).json(subjects);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  })
);

// Update Subjects by id
subjectRoute.put(
  "/subject/:id",
  expressAsyncHandler(async (req, res) => {
    try {
      const { id } = req.params; // Extract the subject ID from the URL params
      const { name } = req.body; // Data to update, e.g., subject name

      // Update the subject in the database
      const updatedSubject = await prisma.subject.update({
        where: { id }, // Find the subject by ID
        data: { name }, // Update the fields (add more fields here if needed)
      });

      // If no subject was found with the given ID
      if (!updatedSubject) {
        return res.status(404).json({ message: "Subject not found." });
      }

      // Return the updated subject
      res.status(200).json({
        message: "Subject updated successfully.",
        subject: updatedSubject,
      });
    } catch (err) {
      // Handle cases where the ID is invalid or Prisma fails
      res.status(500).json({ message: err.message });
    }
  })
);

export { subjectRoute };
