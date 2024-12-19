import { useState } from "react";
import axios from "axios";
import "./AllStudent.css";
import { Link } from "react-router-dom";
import Dialog from "../../components/others/Dialog";
import { apiUrl, getError } from "../../utils";

const AllStudents = () => {
  const [students, setStudents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;
  const handleLevelChange = async (event) => {
    const selectedLevel = event.target.value;
    console.log(selectedLevel);
    const { data } = await axios.get(
      `${apiUrl}/api/students/get-students-by-level/${selectedLevel}/${schoolId}`
    );
    setStudents(data);
  };
  const handleDeleteStudent = (studentId) => {
    setStudentToDelete(studentId);
    setOpenDialog(true);
  };

  // Confirm deletion
  const confirmDelete = async () => {
    try {
      console.log(studentToDelete);
      await axios.delete(`${apiUrl}/api/students/student/${studentToDelete}`);
      setStudents((prevStudents) =>
        prevStudents.filter((student) => student.id !== studentToDelete)
      );
      setOpenDialog(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error(getError(error));
    }
  };

  return (
    <div className="AllStudents">
      {openDialog && (
        <Dialog
          message="Are you sure you want to delete this student?"
          action={confirmDelete}
          setOpenDialog={setOpenDialog}
        />
      )}
      <div>
        <h2>All Students</h2>
        <div className="selectContainer">
          <select
            className="select"
            onChange={handleLevelChange}
            defaultValue=""
          >
            <option value="" disabled>
              Select level
            </option>
            <option value="js1">Jss 1</option>
            <option value="js2">Jss 2</option>
            <option value="js3">Jss 3</option>
            <option value="ss1">SSS 1</option>
            <option value="ss2">SSS 2</option>
            <option value="ss3">SSS 3</option>
          </select>
        </div>
        <table border={3}>
          <thead>
            <tr>
              <th>No</th>
              <th>Name</th>
              <th>Surname</th>
              <th>Username</th>
              <th>Password</th>
              <th>Class</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && <p>No students available.</p>}
            {students.map((student, index) => (
              <tr key={student.id}>
                <td>{index + 1}</td>
                <td>{student.name}</td>
                <td>{student.surname}</td>
                <td>{student.username}</td>
                <td>{student.password}</td>
                <td>{student.level}</td>
                <td className="actions">
                  <button className="edit">
                    <Link to={`/edit-student/${student.id}`}>Edit</Link>
                  </button>
                  <button
                    className="delete"
                    onClick={() => handleDeleteStudent(student.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllStudents;
