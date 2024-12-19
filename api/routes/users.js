import express from "express";
import prisma from "../prisma/prisma.js";
const userRoute = express.Router();
import expressAsyncHandler from "express-async-handler";

//create-school
userRoute.post(
  "/create-school",
  expressAsyncHandler(async (req, res) => {
    console.log(req.body);
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
  })
);

//Get school by Id
userRoute.get(
  "/school/:id",
  expressAsyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(id);
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
  })
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
  })
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
  })
);
//login-user
userRoute.post(
  "/login-user",
  expressAsyncHandler(async (req, res) => {
    const { username, password } = req.body;
    try {
      const userByUsername = await prisma.user.findUnique({
        where: {
          username: username,
        },
      });

      if (!userByUsername) {
        console.log("Username not found");
        res.status(404).send({
          message: "Username not found",
        });
      }
      const user = await prisma.user.findFirst({
        where: {
          AND: [{ username: username }, { password: password }],
        },
      });

      if (!user) {
        console.log("Wrong password");
        res.status(404).send({
          message: "Wrong password",
        });
      }
      res.status(200).json(user);
    } catch (err) {
      res
        .status(500)
        .json({ message: "An error occurred", error: err.message });
    }
  })
);

export { userRoute };
