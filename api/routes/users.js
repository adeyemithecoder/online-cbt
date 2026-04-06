import express from "express";
import prisma from "../prisma/prisma.js";
const userRoute = express.Router();
import expressAsyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";

//create-school
userRoute.post(
  "/create-school",
  expressAsyncHandler(async (req, res) => {
    const { fullName, name, viewExamHistory, logo } = req.body;
    try {
      const schoolAlreadyExist = await prisma.school.findFirst({
        where: { name },
      });
      if (schoolAlreadyExist) {
        res
          .status(409)
          .send({ message: `School with the name '${name}' already exists` });
        return;
      }
      const newSchool = await prisma.school.create({
        data: {
          fullName,
          name,
          viewExamHistory,
        },
      });
      res.status(200).json(newSchool);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }),
);

//Get school by Id
userRoute.get(
  "/school/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      const school = await prisma.school.findUnique({
        where: { id },
      });
      if (!school) {
        res.status(404).json({ message: "School not found" });
        return;
      }
      res.status(200).json(school);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }),
);

//update school
userRoute.put(
  "/school/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params; // Extract school ID from the request parameters
    const { viewExamHistory } = req.body; // Extract viewExamHistory from the request body

    try {
      // Check if the school exists
      const school = await prisma.school.findUnique({
        where: { id },
      });

      if (!school) {
        return res.status(404).json({ message: "School not found" });
      }

      // Update the school's viewExamHistory field
      const updatedSchool = await prisma.school.update({
        where: { id },
        data: { viewExamHistory },
      });

      // Send the updated school data as the response
      res.status(200).json(updatedSchool);
    } catch (err) {
      console.error("Error updating school:", err);
      res
        .status(500)
        .json({ message: "Failed to update school", error: err.message });
    }
  }),
);

//create-user
userRoute.post(
  "/create-user",
  expressAsyncHandler(async (req, res) => {
    try {
      const userAlreadyExist = await prisma.user.findFirst({
        where: { username: req.body.username },
      });

      if (userAlreadyExist) {
        res.status(409).send({
          message: `User with the name '${req.body.username}' already exists`,
        });
        return;
      }
      const newUser = await prisma.user.create({
        data: req.body,
      });

      res.status(200).json(newUser);
    } catch (err) {
      res
        .status(500)
        .json({ message: "An error occurred", error: err.message });
    }
  }),
);

//login-user
userRoute.post(
  "/login-user",
  expressAsyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(404).json({ message: "Username not found" });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, schoolId: user.schoolId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    let currentSessionId = null;
    let classes = [];

    if (user.schoolId) {
      const [currentSession, school] = await Promise.all([
        prisma.academicSession.findFirst({
          where: { schoolId: user.schoolId, isCurrent: true },
        }),
        prisma.school.findUnique({ where: { id: user.schoolId } }),
      ]);
      currentSessionId = currentSession?.id || null;
      classes = school?.classes || [];
    }

    res.status(200).json({
      message: "Login successful",
      currentSessionId,
      token,
      userId: user.id,
      schoolId: user.schoolId || null,
      role: user.role,
      classes,
    });
  }),
);
export { userRoute };
