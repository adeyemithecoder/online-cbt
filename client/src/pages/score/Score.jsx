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
      setStudents(data);
    } catch (error) {
      console.log(getError(error));
    } finally {
      setLoading(false);
    }
  };

  const handleTermChange = async (event) => {
    setExamId(null);
    setSelectedTerm(event.target.value);
    await fetchExam(event.target.value, selectedLevel);
    studentsWithScore(examId, selectedLevel);
  };

  const handleLevelChange = async (event) => {
    setExamId(null);
    setSelectedLevel(event.target.value);
    await fetchExam(selectedTerm, event.target.value);
    studentsWithScore(examId, event.target.value);
  };

  const handleExamChange = async (event) => {
    setExamId(event.target.value);
    await fetchExam(selectedTerm, selectedLevel);
    studentsWithScore(event.target.value, selectedLevel);
  };

  const handleDeleteExam = async (studentId) => {
    if (!examId) return;

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this exam score?"
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);
      console.log(studentId);
      console.log(examId);
      await axios.delete(
        `${apiUrl}/api/students/delete-student-subject/${studentId}/${examId}`
      );
      // Refetch students after deletion
      await studentsWithScore(examId, selectedLevel);
    } catch (error) {
      console.error("Error deleting exam from student:", getError(error));
    } finally {
      setLoading(false);
    }
  };
  console.log(students);
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
          {students.length > 0 && examId && (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Subject</th>
                  <th>Name</th>
                  <th>Surname</th>
                  <th>Score</th>
                  <th>Delete Exam</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => (
                  <tr key={student.id}>
                    <td>{index + 1}</td>
                    <td>{student.subjectName}</td>
                    <td>{student.name}</td>
                    <td>{student.surname}</td>
                    <td>{student.score}</td>
                    <td>
                      <button onClick={() => handleDeleteExam(student.id)}>
                        Delete Exam
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!examId || students.length === 0 ? (
            <h2>Students who wrote the selected exam will appear here.</h2>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default Score;
