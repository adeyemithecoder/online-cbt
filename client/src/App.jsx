/* eslint-disable react/prop-types */
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";
import Navbar from "./components/navbar/Navbar";
import Home from "./pages/home/Home";
import Login from "./pages/login/Login";
import Register from "./pages/login/Register";
import Exam from "./pages/exam/Exam";
import SetExam from "./pages/setexam/SetExam";
import AllStudents from "./pages/allStudent/AllStudents";
import { useState } from "react";
import Score from "./pages/score/Score";
import EditStudent from "./pages/allStudent/EditSudent";
import Admin from "./pages/admin/admin";
import ExamHistory from "./pages/examHistory/ExamHistory";
import EditExam from "./pages/editExam/EditExam";
import AllExam from "./pages/editExam/AllExam";
import StudentLogin from "./pages/login/StudentLogin";
import Subject from "./pages/subject/Subject";
import AddSingleQue from "./components/newQuestion/AddSingleQue";
import EditQuestion from "./components/newQuestion/EditQuestion";

function App() {
  const [isAdmin, setIsAdmin] = useState(null);

  const ProtectedRoute = ({ children }) => {
    const storedObject = JSON.parse(localStorage.getItem("loggedInStudent"));
    if (!storedObject) {
      return <Navigate to="/" />;
    }

    setIsAdmin(storedObject.role); // Ensure this is placed correctly; consider moving it to a `useEffect`.

    return children;
  };

  return (
    <Router>
      {isAdmin === "ADMIN" && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/student-login" element={<StudentLogin />} />
        <Route path="/" element={<Home />} />

        {/* Protected Routes */}
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <Register />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam"
          element={
            <ProtectedRoute>
              <Exam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subject"
          element={
            <ProtectedRoute>
              <Subject />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Admin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setexam"
          element={
            <ProtectedRoute>
              <SetExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/allExam"
          element={
            <ProtectedRoute>
              <AllExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-exam/:examId"
          element={
            <ProtectedRoute>
              <EditExam />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-question/:questionId"
          element={
            <ProtectedRoute>
              <EditQuestion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studentlist"
          element={
            <ProtectedRoute>
              <AllStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/score"
          element={
            <ProtectedRoute>
              <Score />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ExamHistory"
          element={
            <ProtectedRoute>
              <ExamHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-student/:studentId"
          element={
            <ProtectedRoute>
              <EditStudent />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-question/:examId"
          element={
            <ProtectedRoute>
              <AddSingleQue />
            </ProtectedRoute>
          }
        />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
