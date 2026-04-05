import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AlertDialog from "../others/AlertDialog";
import { apiUrl } from "../../utils";

const AddSingleQue = () => {
  const { examId = "" } = useParams();
  const [question, setQuestion] = useState({
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    examId,
  });
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "correctAnswer") {
      setQuestion({ ...question, correctAnswer: value });
    } else {
      const [type, index] = name.split("-");
      if (type === "option") {
        const updatedOptions = [...question.options];
        updatedOptions[parseInt(index)] = value;
        setQuestion({ ...question, options: updatedOptions });
      } else {
        setQuestion({ ...question, [name]: value });
      }
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!question.correctAnswer) {
      setAlertMessage("Please select a correct answer before submitting.");
      setOpenAlert(true);
      return;
    }
    setLoading(true);
    const trimmedQuestion = {
      ...question,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
    };
    try {
      await axios.post(`${apiUrl}/api/exams/create-question`, trimmedQuestion);
      setAlertMessage("Question added successfully");
      setOpenAlert(true);
    } catch (error) {
      console.error("Error adding question:", error);
      setAlertMessage("Error adding question");
      setOpenAlert(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!openAlert && alertMessage === "Question added successfully") {
      navigate(-1);
    }
  }, [openAlert, alertMessage, navigate]);

  return (
    <div className="editexam-container">
      {openAlert && (
        <AlertDialog message={alertMessage} setOpenAlert={setOpenAlert} />
      )}
      <form className="editForm" onSubmit={handleAddQuestion}>
        <h2>Add Question</h2>
        <label>
          Question:
          <textarea
            className="question"
            rows={4}
            name="question"
            value={question.question}
            onChange={handleInputChange}
          />
        </label>
        {question.options.map((option, index) => (
          <div key={index}>
            <label>
              Option {String.fromCharCode(65 + index)}:
              <input
                type="text"
                name={`option-${index}`}
                value={option}
                onChange={handleInputChange}
              />
            </label>
          </div>
        ))}
        <label>
          Correct Answer:
          <select
            name="correctAnswer"
            value={question.correctAnswer}
            onChange={handleInputChange}
          >
            <option value="">Select an option</option>
            {question.options.map((option, index) => (
              <option key={index} value={option}>
                {String.fromCharCode(65 + index)}
              </option>
            ))}
          </select>
        </label>
        <button disabled={loading} type="submit">
          Add Question
        </button>
      </form>
    </div>
  );
};

export default AddSingleQue;
