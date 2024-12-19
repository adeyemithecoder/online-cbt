import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import QuestionComponent from "../../components/questions/QuestionComponent";
import Calculator from "../../components/calculator/Calculator";
import "./Exam.css";
import Dialog from "../../components/others/Dialog";
import AlertDialog from "../../components/others/AlertDialog";
import { apiUrl, getError } from "../../utils";

const Exam = () => {
  const [exam, setExam] = useState({});
  const [exams, setExams] = useState([]);
  const [loggedInStudent, setLoggedInStudent] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [redirectAfterAlert, setRedirectAfterAlert] = useState(false);

  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;
  const hasShuffled = useRef(false);
  const subjectName = exam?.subjectName;
  const examId = exam?.id;
  const [allowStudent, setAllowStudent] = useState(false);

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        console.log(schoolId);
        const { data } = await axios.get(
          `${apiUrl}/api/users/school/${schoolId}`
        );
        console.log(data);
        setAllowStudent(data.viewExamHistory);
      } catch (error) {
        console.error(getError(error));
      }
    };
    fetchSchool();
  }, [schoolId]);

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchExams() {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/exams/visible-true-exams/${schoolId}`
        );
        setExams(data);
      } catch (error) {
        console.error(getError(error));
      }
    }
    fetchExams();
  }, [schoolId]);

  useEffect(() => {
    function shuffleArray(array) {
      if (!array) return [];
      let shuffledArray = array.slice(); // Create a copy of the array
      for (let i = shuffledArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledArray[i], shuffledArray[j]] = [
          shuffledArray[j],
          shuffledArray[i],
        ];
      }
      return shuffledArray;
    }
    if (!hasShuffled.current && subjectName && exam?.questions) {
      const shuffledQuestions = shuffleArray(exam.questions);
      setExam((prevExam) => ({
        ...prevExam,
        questions: shuffledQuestions,
      }));
      hasShuffled.current = true;
    }
  }, [subjectName, exam, setExam]);

  const handleSubjectChange = async (event) => {
    const selectedExamId = event.target.value;
    if (selectedExamId) {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/exams/exam/${selectedExamId}`
        );
        setExam(data);
      } catch (error) {
        console.error(getError(error));
      }
    }
  };

  const updateStudentScore = async (score, studentId) => {
    try {
      const updatedSubjects = {
        [examId]: score,
      };
      const { data } = await axios.put(
        `${apiUrl}/api/students/update-student-subjects/${studentId}`,
        {
          subjects: updatedSubjects,
          studentId,
        }
      );
      console.log(data);
    } catch (error) {
      console.error("Error updating student score on server:", error);
    }
  };

  const checkIfScoreExist = useCallback(
    async (studentId) => {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/students/check-score-exists/${studentId}/${examId}`
        );
        if (data.scoreExists) {
          setAlertMessage(
            "You have already submitted this exam. Please wait until the next exam."
          );
          setOpenAlert(true);
          setRedirectAfterAlert(true);
          localStorage.removeItem("loggedInStudent");
        }
      } catch (error) {
        console.error(getError(error));
      }
    },
    [examId]
  );

  useEffect(() => {
    const storedObject = JSON.parse(localStorage.getItem("loggedInStudent"));
    setLoggedInStudent(storedObject);
    if (!storedObject) {
      navigate("/login");
    } else {
      checkIfScoreExist(storedObject.id);
    }
  }, [navigate, checkIfScoreExist]);
  useEffect(() => {
    if (redirectAfterAlert && !openAlert) {
      navigate("/login");
    }
  }, [redirectAfterAlert, openAlert, navigate]);

  const handleLogout = () => {
    setOpenDialog(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("loggedInStudent");
    navigate("/login");
  };

  return (
    <>
      {openDialog && (
        <Dialog
          message="Are you sure you want to log out?"
          action={confirmLogout}
          setOpenDialog={setOpenDialog}
        />
      )}
      {openAlert && (
        <AlertDialog message={alertMessage} setOpenAlert={setOpenAlert} />
      )}
      <div className="exam-containere">
        <div className="exam-select-container">
          <select onChange={handleSubjectChange}>
            <option value="">Select Exam</option>
            {exams.map((exam) => (
              <option
                className={
                  loggedInStudent?.username === "admin"
                    ? ""
                    : loggedInStudent?.level !== exam.level
                    ? "notInTheClass"
                    : ""
                }
                key={exam.id}
                value={exam.id}
              >
                {exam.subjectName}
              </option>
            ))}
          </select>

          {allowStudent && (
            <button
              className="examHistory"
              onClick={() => navigate("/ExamHistory")}
            >
              Go to exam history
            </button>
          )}

          <button className="logout" onClick={handleLogout}>
            Log out
          </button>
        </div>
        {Object.keys(exam || {}).length > 0 ? (
          <div>
            <QuestionComponent
              updateStudentScore={updateStudentScore}
              exam={exam}
              loggedInStudent={loggedInStudent}
              subjectName={subjectName}
            />
            <Calculator />
          </div>
        ) : (
          <h2 className="please-select-h2">
            Please select exam and start now!!!
          </h2>
        )}
      </div>
    </>
  );
};

export default Exam;
