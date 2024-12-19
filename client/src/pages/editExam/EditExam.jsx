import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { BiEditAlt } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import axios from "axios";
import Dialog from "../../components/others/Dialog";
import { apiUrl } from "../../utils";

const EditExam = () => {
  const { examId } = useParams();
  const [questions, setQuestions] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [questionIdToDelete, setQuestionIdToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchSubjectData() {
      if (!examId) return;
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/exams/questions/${examId}`
        );
        setQuestions(data);
      } catch (error) {
        console.error("Error fetching subject data:", error);
      }
    }
    fetchSubjectData();
  }, [examId]);
  const handleDeleteQuestion = (questionId) => {
    setQuestionIdToDelete(questionId);
    setOpenDialog(true);
  };

  const confirmDeleteQuestion = async () => {
    if (questionIdToDelete === null) return;
    try {
      const { data } = await axios.delete(
        `${apiUrl}/api/exams/question/${questionIdToDelete}`
      );
      console.log(data);
      setQuestions(
        questions.filter((question) => question.id !== questionIdToDelete)
      );
      setOpenDialog(false);
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  return (
    <>
      {openDialog && (
        <Dialog
          message="Are you sure you want to delete this question?"
          action={confirmDeleteQuestion}
          setOpenDialog={setOpenDialog}
        />
      )}
      <div className="setexam-container">
        <div className="btnContainer">
          <button onClick={() => navigate(-1)} className="add-question-button">
            Go back
          </button>
          {questions && (
            <button
              className="add-question-button"
              onClick={() => navigate(`/add-question/${examId}`)}
            >
              Add new question
            </button>
          )}
        </div>

        <table>
          <thead>
            <tr>
              <th className="no">NO</th>
              <th className="questions">Questions</th>
              <th className="option">A</th>
              <th className="option">B</th>
              <th className="option">C</th>
              <th className="option">D</th>
              <th className="option">Correct ans</th>
              <th className="option">Actions</th>
            </tr>
          </thead>
          <tbody>
            {questions &&
              questions?.map((question, index) => (
                <tr key={`${question.id}-${index}`}>
                  <td>{index + 1}</td>
                  <td>{question.question}</td>
                  {question.options.map((option, optionIndex) => (
                    <td key={optionIndex}>{option}</td>
                  ))}
                  <td>{question.correctAnswer}</td>
                  <td className="actionss">
                    <Link
                      to={`/edit-question/${question.id}`}
                      className="actionbutton"
                    >
                      <BiEditAlt className="action-icon" />
                    </Link>

                    <button
                      className="actionbutton"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <MdDelete className="action-icon delete" />
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default EditExam;
