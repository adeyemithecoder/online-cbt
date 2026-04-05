import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { apiUrl, getError } from "../../utils";
import styles from "./AllExam.module.css";
import Spinner from "../../components/Spinner/Spinner";

const AllExam = () => {
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedTerm, setSelectedTerm] = useState("");
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;

  // Fetch exams based on selected level and term
  const fetchExams = async (selectedTerm, selectedLevel) => {
    try {
      setLoading(true);
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
      console.log(data);
      setExams(data);
    } catch (error) {
      console.log(getError(error));
    } finally {
      setLoading(false);
    }
  };

  // Handle Term Change
  const handleTermChange = async (event) => {
    const term = event.target.value;
    setSelectedTerm(term);
    await fetchExams(term, selectedLevel);
  };

  // Handle Level Change
  const handleLevelChange = async (event) => {
    const level = event.target.value;
    setSelectedLevel(level);
    await fetchExams(selectedTerm, level);
  };

  // Handle Delete Exam
  const handleDelete = async (examId) => {
    if (window.confirm("Are you sure you want to delete this exam?")) {
      try {
        await axios.delete(`${apiUrl}/api/exams/delete/${examId}`);
        setExams(exams.filter((exam) => exam.id !== examId));
        alert("Exam deleted successfully.");
      } catch (error) {
        console.log(getError(error));
      }
    }
  };

  return (
    <div className={styles.allexams}>
      <h1>All Exams</h1>
      <div className={styles.selectContainer}>
        <select value={selectedTerm} onChange={handleTermChange}>
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>

        <select value={selectedLevel} onChange={handleLevelChange}>
          <option value="" disabled>
            Select Class
          </option>
          <option value="js1">JSS 1</option>
          <option value="js2">JSS 2</option>
          <option value="js3">JSS 3</option>
          <option value="ss1">SSS 1</option>
          <option value="ss2">SSS 2</option>
          <option value="ss3">SSS 3</option>
        </select>
      </div>
      {loading ? (
        <h1 className="loadindH1">
          <Spinner size="5rem" />
        </h1>
      ) : (
        <table>
          {exams.length === 0 && (
            <p>No exams found. Please select a term and class.</p>
          )}
          <thead>
            <tr>
              <th>No</th>
              <th>Subject</th>
              <th>Level</th>
              <th>Term</th>
              <th>Duration (mins)</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.map((exam, index) => (
              <tr key={exam.id}>
                <td>{index + 1}</td>
                <td>{exam.subjectName}</td>
                <td>{exam.level.toUpperCase()}</td>
                <td>{exam.termType}</td>
                <td>{exam.examDuration / 60}</td>
                <td>{exam.visible ? "Yes" : "No"}</td>
                <td>
                  <Link to={`/edit-exam/${exam.id}`} className={styles.edit}>
                    Go to Questions
                  </Link>
                  <button
                    className={styles.delete}
                    onClick={() => handleDelete(exam.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AllExam;
