import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { apiUrl, getError } from "../../utils";

const EditStudent = () => {
  const { studentId = "" } = useParams();
  const [loading, setLoading] = useState(false);
  const [student, setStudent] = useState({
    id: "",
    level: "",
    password: "",
    name: "",
    username: "",
    surname: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/students/student/${studentId}`
        );
        setStudent(data);
      } catch (error) {
        console.error("Error fetching student:", error);
      }
    };
    fetchStudent();
  }, [studentId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStudent({ ...student, [name]: value });
  };
  const handleLevelChange = (e) => {
    const { value } = e.target;
    setStudent({ ...student, level: value });
  };
  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.patch(`${apiUrl}/api/students/student/${studentId}`, student);
      alert("Student updated successfully");
      navigate(-1);
    } catch (error) {
      console.error(getError(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editstudent-container">
      <form className="editForm" onSubmit={handleUpdateStudent}>
        <h2>Edit Student</h2>
        <label>Level:</label>
        <select
          className="select"
          onChange={handleLevelChange}
          value={student.level}
          name="level"
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

        <label>Password:</label>
        <input
          type="text"
          name="password"
          value={student.password}
          onChange={handleInputChange}
        />
        <label>Name:</label>
        <input
          type="text"
          name="name"
          value={student.name}
          onChange={handleInputChange}
        />
        <label>Username:</label>
        <input
          type="text"
          name="username"
          value={student.username}
          onChange={handleInputChange}
        />
        <label>Surname:</label>
        <input
          type="text"
          name="surname"
          value={student.surname}
          onChange={handleInputChange}
        />
        <button disabled={loading} type="submit">
          {loading ? "Update..." : "Update"}
        </button>
      </form>
    </div>
  );
};

export default EditStudent;
