/* eslint-disable react/prop-types */
import { useNavigate } from "react-router-dom";
import "./QuestionComponent.css";
import { useCallback, useEffect, useState } from "react";
import { FiClock } from "react-icons/fi";
import axios from "axios";
import Dialog from "../others/Dialog"; // Adjust the path as needed
import AlertDialog from "../others/AlertDialog"; // Adjust the path as needed
import { apiUrl, getError } from "../../utils";

const QuestionComponent = ({
  exam,
  loggedInStudent,
  subjectName,
  updateStudentScore,
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [alertShown, setAlertShown] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [postSubmitNavigation, setPostSubmitNavigation] = useState(false);
  const [remainingTime, setRemainingTime] = useState(exam?.examDuration || 0);
  const [loading, setLoading] = useState(false);

  const [answers, setAnswers] = useState(
    exam && Array(exam.questions?.length).fill("")
  );
  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;
  const navigate = useNavigate();
  const handleSubmit = useCallback(async () => {
    setLoading(true);
    let score = 0;
    const studentQuestionsAndAnswers = {
      studentId: loggedInStudent.id,
      schoolId,
      examId: exam.id,
      answers: exam?.questions?.map((question, index) => ({
        questionId: question.id,
        selectedOption: answers[index],
      })),
    };
    try {
      await axios.post(
        `${apiUrl}/api/students/create-answer`,
        studentQuestionsAndAnswers
      );
    } catch (error) {
      console.error(getError(error));
    }
    exam.questions?.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        score++;
      }
    });
    updateStudentScore(score, loggedInStudent.id);
    setLoading(false);
    setAlertMessage(
      `Your score is ${score}/${exam.questions?.length}. You are good to go.`
    );
    setOpenAlert(true);
    setPostSubmitNavigation(true);
  }, [answers, loggedInStudent, exam, schoolId, updateStudentScore]);

  useEffect(() => {
    if (!openAlert && postSubmitNavigation) {
      localStorage.removeItem("loggedInStudent");
      navigate("/student-login");
    }
  }, [openAlert, postSubmitNavigation, navigate]);

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = selectedOption;
    setAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime > 0) {
          return prevTime - 1;
        } else {
          clearInterval(timer);
          return 0;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam]);

  useEffect(() => {
    if (remainingTime === 480 && !alertShown) {
      setAlertShown(true);
      setAlertMessage("You have just 8 minutes left!!!");
      setOpenAlert(true);
    }
  }, [remainingTime, alertShown]);

  const formatTime = (timeInSeconds) => {
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = timeInSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const confirmSubmit = () => {
    setOpenDialog(true);
  };

  return (
    <>
      {openDialog && (
        <Dialog
          message="Are you sure you want to submit?"
          action={handleSubmit}
          loading={loading}
          setOpenDialog={setOpenDialog}
        />
      )}
      {openAlert && (
        <AlertDialog message={alertMessage} setOpenAlert={setOpenAlert} />
      )}
      <div className="questions-components">
        <div className="count-container">
          <h2>Exam is in progress...</h2>

          <h2 className="time">
            <FiClock fontSize={30} /> {formatTime(remainingTime)}
          </h2>

          <h2 className="current-user">
            {loggedInStudent?.name}: {"  "}
            {loggedInStudent?.level} student
          </h2>
        </div>
        <div className="all-subject">
          <span>{subjectName}</span>
        </div>
        {exam &&
          exam?.questions?.map((question, index) => (
            <div key={index}>
              <div
                className={`question-container ${
                  index === currentQuestionIndex ? "active" : ""
                }`}
              >
                <h2>{index + 1}</h2>
                <div className="each-question">
                  <span>{question.question}</span>
                  <ul>
                    {question.options.map((option, optionIndex) => {
                      const optionLabels = ["(a)", "(b)", "(c)", "(d)"];
                      return (
                        <li key={optionIndex}>
                          <label>
                            <input
                              type="radio"
                              value={option}
                              name={`question_${index}`}
                              onChange={() => handleAnswerSelect(index, option)}
                            />
                            <span>
                              {optionLabels[optionIndex]} {option}
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        <div className="next-prev-button">
          <button onClick={handlePrev} disabled={currentQuestionIndex === 0}>
            Prev
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestionIndex === exam.questions?.length - 1}
          >
            Next
          </button>
        </div>

        <div className="question-number">
          {exam.questions?.map((_, index) => (
            <button
              key={index}
              className={
                index === currentQuestionIndex
                  ? "exam-number active"
                  : answers[index]
                  ? "exam-number answered"
                  : "exam-number"
              }
              onClick={() => setCurrentQuestionIndex(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <button className="submit-btn" onClick={confirmSubmit}>
          Submit
        </button>
      </div>
    </>
  );
};

export default QuestionComponent;
