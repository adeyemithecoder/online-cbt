import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { apiUrl, getError } from "../../utils";
import "./ExamHistory.css";
import Spinner from "../../components/Spinner/Spinner";

const ExamHistory = () => {
  const [studentQuestionsAndAnswers, setStudentQuestionsAndAnswers] = useState(
    []
  );
  const [selectedSubject, setSelectedSubject] = useState("");
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;

  const [allowStudent, setAllowStudent] = useState(false);

  useEffect(() => {
    const fetchStudentAnswers = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${apiUrl}/api/users/school/${schoolId}`
        );
        setAllowStudent(data.viewExamHistory);
        const loginStudent = JSON.parse(
          localStorage.getItem("loggedInStudent")
        );
        if (loginStudent) {
          const { data } = await axios.get(
            `${apiUrl}/api/students/answers/${loginStudent.id}`
          );
          setStudentQuestionsAndAnswers(data);
        } else {
          console.error("No logged-in student found");
        }
      } catch (error) {
        console.error(getError(error));
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAnswers();
  }, [schoolId]);

  const handleSubjectClick = (subject) => {
    console.log(subject);
    setSelectedSubject(subject);
  };

  const confirmLogout = () => {
    if (!window.confirm("Are you sure to log out?")) return;
    localStorage.removeItem("loggedInStudent");
    navigate("/login");
  };

  const calculateSubjectStats = (questionsAndAnswers) => {
    const totalQuestions = questionsAndAnswers.length;
    let totalFail = 0;
    let totalPass = 0;
    let noSelectedOption = 0;

    questionsAndAnswers.forEach((qa) => {
      if (
        qa.selectedOption === null ||
        qa.selectedOption === undefined ||
        qa.selectedOption === ""
      ) {
        noSelectedOption += 1;
      } else if (qa.selectedOption === qa.correctAnswer) {
        totalPass += 1;
      } else {
        totalFail += 1;
      }
    });

    return {
      totalQuestions,
      totalFail,
      totalPass,
      noSelectedOption,
    };
  };

  // Extract unique subjects (exam names) for rendering buttons
  const subjects = [
    ...new Map(
      studentQuestionsAndAnswers.map((item) => [
        `${item.examName}-${item.termType}`,
        { examName: item.examName, termType: item.termType },
      ])
    ).values(),
  ];

  const formatQuestionToJSX = (text) => {
    const parts = text.split(/\[([^\]]+)\]/g); // Split at words inside brackets
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <span key={index} className="underline">
          {part}
        </span>
      ) : (
        part
      )
    );
  };
  if (loading)
    return (
      <h1 className="loadindH1">
        <Spinner size="5rem" />
      </h1>
    );
  console.log(subjects);
  return (
    <>
      {allowStudent ? (
        <div className="qes-and-ans">
          <h2>
            All questions and answers of your past exams are here, including the
            correct answers.
          </h2>
          <button onClick={confirmLogout} className="logOut">
            Log Out
          </button>

          <div className="subjects-container">
            {subjects.length > 0 ? (
              subjects.map((subject, index) => (
                <button key={index} onClick={() => handleSubjectClick(subject)}>
                  {subject.examName} - {subject.termType} Term
                </button>
              ))
            ) : (
              <h3>No exam history available.</h3>
            )}
          </div>

          {/* Display selected subject's details */}
          {selectedSubject && (
            <div>
              <h2>
                Questions and Answers for {selectedSubject.examName} -{" "}
                {selectedSubject.termType} Term
              </h2>
              {studentQuestionsAndAnswers
                .filter(
                  (data) =>
                    data.examName === selectedSubject.examName &&
                    data.termType === selectedSubject.termType
                )
                .map((data, index) => {
                  const stats = calculateSubjectStats(data.questionsAndAnswers);
                  return (
                    <div className="display-div" key={index}>
                      <div className="summary">
                        <p>Subject: {data.examName}</p>
                        <p>Term: {data.termType}</p>
                        <p>Level: {data.level}</p>
                        <p>Total Questions: {stats.totalQuestions}</p>
                        <p>Total Failed: {stats.totalFail}</p>
                        <p>Total Passed: {stats.totalPass}</p>
                        <p>Unanswered Questions: {stats.noSelectedOption}</p>
                      </div>

                      {data.questionsAndAnswers.map((qa, qaIndex) => (
                        <div className="each-ques" key={qaIndex}>
                          <p>
                            Question {qaIndex + 1}:{" "}
                            {formatQuestionToJSX(qa.question)}
                          </p>

                          <p>
                            Selected Option:{" "}
                            {qa.selectedOption || "Not Answered"}
                          </p>
                          <p>Correct Answer: {qa.correctAnswer}</p>
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        <h1>This page is disabled by admin.</h1>
      )}
    </>
  );
};

export default ExamHistory;
