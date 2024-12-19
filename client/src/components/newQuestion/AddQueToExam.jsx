/* eslint-disable react/prop-types */
import { useState } from "react";
import axios from "axios";
import { apiUrl, getError } from "../../utils";
import styles from "./AddQueToExam.module.css";

const AddQueToExam = ({ newQuestions, setQuestions }) => {
  const [loading, setLoading] = useState(false);
  const [exam, setExam] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [examId, setExamId] = useState("");
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
  const handleTermChange = async (event) => {
    const selectedTerm = event.target.value;
    setSelectedTerm(selectedTerm);
    await fetchExam(selectedTerm, selectedLevel);
  };

  const handleLevelChange = async (event) => {
    const selectedLevel = event.target.value;
    setSelectedLevel(selectedLevel);
    await fetchExam(selectedTerm, selectedLevel);
  };

  const handleAddQuestions = async () => {
    if (!examId) {
      alert("Please select an exam before adding questions.");
      return;
    }
    if (newQuestions.length == 0) {
      alert("No question to add.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/api/exams/create-questions`, {
        examId,
        questions: newQuestions,
      });
      alert("Successfully added all questions");
      setQuestions([]);
    } catch (error) {
      console.log(getError(error));
      alert(getError(error));
    }
    setLoading(false);
  };

  const handleExamChange = (event) => {
    const selectedExamId = event.target.value;
    if (!selectedExamId) {
      alert("Please select a valid exam.");
      return;
    }
    setExamId(selectedExamId);
  };

  return (
    <div className={styles.container}>
      <select
        id="termSelect"
        value={selectedLevel}
        onChange={handleLevelChange}
      >
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

      <select id="termSelect" value={selectedTerm} onChange={handleTermChange}>
        <option value="" disabled>
          Select Term
        </option>
        <option value="FIRST">First Term</option>
        <option value="SECOND">Second Term</option>
        <option value="THIRD">Third Term</option>
      </select>
      <select value={examId} onChange={handleExamChange}>
        <option value="">Select Exam</option>
        {exam.map((examItem) => (
          <option key={examItem.id} value={examItem.id}>
            {examItem.subjectName}
          </option>
        ))}
      </select>
      <button onClick={handleAddQuestions} disabled={loading}>
        {loading ? "Adding please wait..." : "Add Questions to Exam"}
      </button>
    </div>
  );
};

export default AddQueToExam;
