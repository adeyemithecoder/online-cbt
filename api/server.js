import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { userRoute } from "./routes/users.js";
import { subjectRoute } from "./routes/subjects.js";
import { examRoute } from "./routes/exam.js";
import { studentRoute } from "./routes/student.js";
const app = express();
dotenv.config();
app.use(cors());
app.use(express.json());

const port = process.env.port || 4000;

app.use("/api/students", studentRoute);
app.use("/api/users", userRoute);
app.use("/api/subjects", subjectRoute);
app.use("/api/exams", examRoute);

app.get("/", (req, res) => res.send("welcome to my blog app"));
app.use((err, req, res, next) => {
  res.status(500).send({ message: `My Mistake= ${err.message}` });
});
app.listen(port, () =>
  console.log(`server is currently running on port http://localhost:${port}`)
);
