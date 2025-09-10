import axios from "axios";
import { useEffect, useState } from "react";
import "./admin.css";
import { apiUrl, getError } from "../../utils";

const Admin = () => {
  const [allowStudent, setAllowStudent] = useState(false);

  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;

  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/users/school/${schoolId}`
        );
        setAllowStudent(data.viewExamHistory);
      } catch (error) {
        console.error(getError(error));
      }
    };
    fetchSchool();
  }, [schoolId]);

  const deleteAllExamHistory = async () => {
    if (
      !window.confirm("Are you sure you want to delete all the exam history?")
    )
      return;
    try {
      await axios.delete(`${apiUrl}/api/students/delete-answers/${schoolId}`);
    } catch (error) {
      console.error(getError(error));
    }
  };

  const handleAllowStudentToggle = async () => {
    const newAllowStudent = !allowStudent;
    setAllowStudent(newAllowStudent);

    try {
      await axios.put(`${apiUrl}/api/users/school/${schoolId}`, {
        viewExamHistory: newAllowStudent, // Update `viewExamHistory` in the backend
      });
    } catch (error) {
      console.error("Error updating viewExamHistory:", error);
    }
  };

  return (
    <div className="admin">
      <h2>Admin Page</h2>
      <div className="settings">
        <div className="allowStudent">
          {allowStudent ? (
            <h3 className="visible">Now all students can view exam history</h3>
          ) : (
            <h3 className="notvisible">Students cannot view exam history</h3>
          )}
          <button onClick={handleAllowStudentToggle}>
            {allowStudent ? "Disallow" : "Allow"} students to view exam history
          </button>
        </div>
      </div>

      <div className="exam-history">
        <h2>Exam History</h2>
        <h3>
          Once all students have reviewed the exam history, you can free up
          space by deleting it.
        </h3>
        <div>
          <button onClick={deleteAllExamHistory}>Delete All History</button>
        </div>
      </div>
    </div>
  );
};

export default Admin;
