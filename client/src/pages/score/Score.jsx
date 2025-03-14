import { useState } from "react";
import axios from "axios";
import styles from "./Score.module.css";
import { apiUrl, getError } from "../../utils";
import Spinner from "../../components/Spinner/Spinner";

const Score = () => {
  const [students, setStudents] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [exam, setExam] = useState([]);
  const [examId, setExamId] = useState(null);
  const [loading, setLoading] = useState(false);
  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;

  const fetchExam = async (selectedTerm, selectedLevel) => {
    try {
      if (!selectedTerm || !selectedLevel) {
        console.log("Both termType and level are required to fetch exams.");
        return;
      }
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const studentsWithScore = async (examId, selectedLevel) => {
    if (!schoolId || !examId || !selectedLevel) return;
    try {
      setLoading(true);
      const { data } = await axios.get(
        `${apiUrl}/api/students/students-with-exam/${schoolId}/${examId}/${selectedLevel}`
      );
      console.log(data);
      setStudents(data);
    } catch (error) {
      console.log(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = async (event) => {
    setSelectedTerm(event.target.value);
    await fetchExam(event.target.value, selectedLevel);
    studentsWithScore(examId, selectedLevel);
  };

  const handleLevelChange = async (event) => {
    setSelectedLevel(event.target.value);
    await fetchExam(selectedTerm, event.target.value);
    studentsWithScore(examId, event.target.value);
  };

  const handleExamChange = async (event) => {
    setExamId(event.target.value);
    await fetchExam(selectedTerm, selectedLevel);
    studentsWithScore(event.target.value, selectedLevel);
  };

  return (
    <div className={styles.Score}>
      <h2>Students Exam Scores</h2>
      <div className={styles.selectContainer}>
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
          <option value="js1">Js 1</option>
          <option value="js2">Js 2</option>
          <option value="js3">Js 3</option>
          <option value="ss1">SS 1</option>
          <option value="ss2">SS 2</option>
          <option value="ss3">SS 3</option>
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
      {loading ? (
        <h1 className="loadindH1">
          <Spinner size="5rem" />
        </h1>
      ) : (
        <div>
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
          {students.length === 0 && (
            <h2>Available students will appear here.</h2>
          )}
        </div>
      )}
    </div>
  );
};

export default Score;
