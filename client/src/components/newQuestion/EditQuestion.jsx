import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import AlertDialog from "../others/AlertDialog"; // Adjust the path as needed
import { apiUrl } from "../../utils";

const EditQuestion = () => {
  const { questionId = "" } = useParams();
  const [question, setQuestion] = useState({
    question: "",
    options: [],
    correctAnswer: "",
  });
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/exams/question/${questionId}`
        );
        setQuestion(data);
      } catch (error) {
        console.error("Error fetching question:", error);
        setAlertMessage("Error fetching question");
        setOpenAlert(true);
      }
    };
    fetchQuestion();
  }, [questionId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "correctAnswer") {
      setQuestion({ ...question, correctAnswer: question.options[value] });
    } else {
      const [type, index] = name.split("-");
      if (type === "option") {
        const updatedOptions = [...question.options];
        const optionIndex = parseInt(index);
        const oldValue = updatedOptions[optionIndex];
        updatedOptions[optionIndex] = value;

        // Update the correctAnswer if it matches the edited option
        const newCorrectAnswer =
          oldValue === question.correctAnswer ? value : question.correctAnswer;

        setQuestion({
          ...question,
          options: updatedOptions,
          correctAnswer: newCorrectAnswer,
        });
      } else {
        setQuestion({ ...question, [name]: value });
      }
    }
  };

  const optionToLetterMap = (options) => {
    return options.reduce((map, option, index) => {
      map[option] = String.fromCharCode(65 + index); // A, B, C, D...
      return map;
    }, {});
  };

  const letterToOptionMap = (options) => {
    return options.reduce((map, option, index) => {
      map[String.fromCharCode(65 + index)] = option; // A -> option[0], B -> option[1]...
      return map;
    }, {});
  };

  const correctAnswerLetter =
    optionToLetterMap(question.options)[question.correctAnswer] || "";

  console.log(question);

  const handleUpdateQuestion = async (e) => {
    e.preventDefault();
    const trimmedQuestion = {
      ...question,
      question: question.question.trim(),
      options: question.options.map((option) => option.trim()),
      correctAnswer: question.correctAnswer.trim(),
      examId: question.examId,
    };
    try {
      await axios.put(
        `${apiUrl}/api/exams/question/${questionId}`,
        trimmedQuestion
      );
      setAlertMessage("Question updated successfully");
      setOpenAlert(true);
    } catch (error) {
      console.error("Error updating question:", error);
      setAlertMessage("Error updating question");
      setOpenAlert(true);
    }
  };

  useEffect(() => {
    if (!openAlert && alertMessage === "Question updated successfully") {
      navigate(-1);
    }
  }, [openAlert, alertMessage, navigate]);

  return (
    <div className="editexam-container">
      {openAlert && (
        <AlertDialog message={alertMessage} setOpenAlert={setOpenAlert} />
      )}
      <form className="editForm" onSubmit={handleUpdateQuestion}>
        <h2>Edit Question</h2>
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
              Option {index + 1}:
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
          <label>
            Correct Answer:
            <select
              name="correctAnswer"
              value={correctAnswerLetter}
              onChange={(e) =>
                setQuestion({
                  ...question,
                  correctAnswer: letterToOptionMap(question.options)[
                    e.target.value
                  ],
                })
              }
              disabled={!question.options.length}
            >
              {question.options.map((_, index) => (
                <option key={index} value={String.fromCharCode(65 + index)}>
                  {String.fromCharCode(65 + index)}
                </option>
              ))}
            </select>
          </label>
        </label>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default EditQuestion;
