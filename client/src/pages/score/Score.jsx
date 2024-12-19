import { useState } from "react";
import axios from "axios";
import "./Score.css";
import { apiUrl, getError } from "../../utils";

const Score = () => {
  const [students, setStudents] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [exam, setExam] = useState([]);
  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;

  const fetchExam = async (selectedTerm, selectedLevel) => {
    try {
      if (!selectedTerm || !selectedLevel) {
        console.log("Both termType and level are required to fetch exams.");
        return;
      }
      const { data } = await axios.get(
        `${apiUrl}/api/exams/exams-by-level-term`,
        {
          params: {
            level: selectedLevel,
            termType: selectedTerm,
            schoolId,
          },
        }
      );
      setExam(data);
    } catch (error) {
      console.log(getError(error));
      console.log(error.message);
    }
  };

  const studentsWithScore = async (examId) => {
    if (!schoolId || !examId || !selectedLevel) return;
    try {
      const { data } = await axios.get(
        `${apiUrl}/api/students/students-with-exam/${schoolId}/${examId}/${selectedLevel}`
      );
      setStudents(data);
    } catch (error) {
      console.log(getError(error));
    }
  };

  const handleTermChange = async (event) => {
    const selectedTerm = event.target.value;
    setSelectedTerm(selectedTerm);
    await fetchExam(selectedTerm, selectedLevel);
    studentsWithScore();
  };

  const handleLevelChange = async (event) => {
    const selectedLevel = event.target.value;
    setSelectedLevel(selectedLevel);
    await fetchExam(selectedTerm, selectedLevel);
    studentsWithScore();
  };

  const handleExamChange = (event) => {
    studentsWithScore(event.target.value);
  };

  return (
    <div className="Score">
      <h2>Students Exam Scores</h2>
      <div className="selectContainer">
        <select
          className="select"
          id="termSelect"
          value={selectedTerm}
          onChange={handleTermChange}
        >
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>
        <select
          className="select"
          id="termSelect"
          value={selectedLevel}
          onChange={handleLevelChange}
        >
          <option value="" disabled>
            Select Class
          </option>
          <option value="js1">Jss 1</option>
          <option value="js2">Jss 2</option>
          <option value="js3">Jss 3</option>
          <option value="ss1">SSS 1</option>
          <option value="ss2">SSS 2</option>
          <option value="ss3">SSS 3</option>
        </select>

        <select className="select" onChange={handleExamChange}>
          <option value="">Select Exam</option>
          {exam.map((examItem) => (
            <option key={examItem.id} value={examItem.id}>
              {examItem.subjectName}
            </option>
          ))}
        </select>
      </div>

      <div className="student-table">
        {students.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Surname</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.surname}</td>
                  <td>{student.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {students.length === 0 && <h2>Available students will appear here.</h2>}
      </div>
    </div>
  );
};

export default Score;
