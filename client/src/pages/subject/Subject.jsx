import { useEffect, useRef, useState } from "react";
import { apiUrl } from "../../utils";
import axios from "axios";
import styles from "./Subject.module.css";
import { getError } from "../../components/others/getError";

const Subject = () => {
  const subjectRef = useRef();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedTerm, setSelectedTerm] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [exam, setExam] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [updatedName, setUpdatedName] = useState("");

  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;

  const [visibilityChanges, setVisibilityChanges] = useState(
    exam?.reduce((acc, ex) => {
      acc[ex.id] = ex.visible;
      return acc;
    }, {})
  );

  const [durationChanges, setDurationChanges] = useState({});
  useEffect(() => {
    const initialDurations = exam?.reduce((acc, ex) => {
      acc[ex.id] = ex.examDuration; // Set each exam's duration using its ID
      return acc;
    }, {});
    setDurationChanges(initialDurations);
  }, [exam]);

  const handleCheckboxChange = (examId) => {
    setVisibilityChanges((prev) => ({
      ...prev,
      [examId]: !prev[examId],
    }));
  };

  const handleDurationChange = (examId, value) => {
    setDurationChanges((prev) => ({
      ...prev,
      [examId]: Number(value),
    }));
  };

  useEffect(() => {
    async function fetchSubjects() {
      try {
        const { data } = await axios.get(
          `${apiUrl}/api/subjects/subjects/${schoolId}`
        );
        setSubjects(data);
      } catch (error) {
        console.log(getError(error));
      }
    }
    fetchSubjects();
  }, [schoolId]);

  const createSubject = async () => {
    const subjectName = subjectRef.current.value?.trim();
    if (!subjectName) {
      alert("Subject name is required");
      return;
    }
    try {
      await axios.post(`${apiUrl}/api/subjects/create-subject`, {
        name: subjectName,
        schoolId: schoolId,
      });
      alert("Subject created successfully");
      subjectRef.current.value = "";
      const { data } = await axios.get(
        `${apiUrl}/api/subjects/subjects/${schoolId}`
      );
      setSubjects(data);
    } catch (error) {
      alert(getError(error));
    }
  };

  const fetchExam = async (selectedTerm, selectedLevel) => {
    try {
      if (!selectedTerm || !selectedLevel) {
        console.log("Both termType and level are required to fetch exams.");
        return;
      }
      const { data } = await axios.get(
        `${apiUrl}/api/exams/exams-by-level-term`,
        {
          params: {
            level: selectedLevel,
            termType: selectedTerm,
            schoolId,
          },
        }
      );
      setExam(data);
      const initialVisibility = {};
      data.forEach((ex) => {
        initialVisibility[ex.id] = ex.visible;
      });
      setVisibilityChanges(initialVisibility);
    } catch (error) {
      console.log(getError(error));
    }
  };

  const handleTermChange = async (event) => {
    const selectedTerm = event.target.value;
    setSelectedTerm(selectedTerm);
    await fetchExam(selectedTerm, selectedLevel);
  };

  const handleLevelChange = async (event) => {
    const selectedLevel = event.target.value;
    setSelectedLevel(selectedLevel);
    await fetchExam(selectedTerm, selectedLevel);
  };

  const handleSubjectChange = (event) => {
    setSelectedSubjectId(event.target.value);
  };

  const handleAddNewExam = async () => {
    if (!selectedTerm || !selectedLevel || !selectedSubjectId) {
      alert("Please select term, class, and subject.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${apiUrl}/api/exams/create-exam`, {
        visible: true,
        termType: selectedTerm,
        level: selectedLevel,
        schoolId,
        subjectId: selectedSubjectId,
        examDuration: 40 * 60,
        questions: [],
      });
      alert("Successfully added the new exam");
      await fetchExam(selectedTerm, selectedLevel);
    } catch (error) {
      console.log(getError(error));
      alert(getError(error));
    }
    setLoading(false);
  };

  const handleUpdateExams = async () => {
    try {
      setLoading(true);
      const updates = Object.keys(visibilityChanges).map((id) => ({
        id,
        visible: visibilityChanges[id],
        examDuration: durationChanges[id],
      }));

      console.log(updates); // Debug log

      await axios.put(`${apiUrl}/api/exams/update-visibility-duration`, {
        updates,
      });
      alert("Exam visibility and durations updated successfully.");
    } catch (error) {
      console.error(error.message);
      alert("Error updating exams: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (subject) => {
    setEditingId(subject.id); // Set the current subject to edit mode
    setUpdatedName(subject.name); // Pre-fill input with current name
  };

  const handleSaveClick = async (id) => {
    try {
      await axios.put(`${apiUrl}/api/subjects//subject/${id}`, {
        name: updatedName,
      });
      const { data } = await axios.get(
        `${apiUrl}/api/subjects/subjects/${schoolId}`
      );
      setSubjects(data);
      alert("Subject updated successfully!");
      setEditingId(null); // Exit edit mode
    } catch (err) {
      console.error(err.message);
      alert("An error occurred while updating the subject.");
    }
  };

  return (
    <div className={styles.subject}>
      <div className={styles.newSubject}>
        <input ref={subjectRef} type="text" placeholder="Enter new subject" />
        <button onClick={createSubject}>Add new subject</button>
      </div>
      <div className={styles.selectContainer}>
        <select value={selectedTerm} onChange={handleTermChange}>
          <option value="" disabled>
            Select Term
          </option>
          <option value="FIRST">First Term</option>
          <option value="SECOND">Second Term</option>
          <option value="THIRD">Third Term</option>
        </select>
        <select value={selectedLevel} onChange={handleLevelChange}>
          <option value="" disabled>
            Select Class
          </option>
          <option value="js1">JSS 1</option>
          <option value="js2">JSS 2</option>
          <option value="js3">JSS 3</option>
          <option value="ss1">SSS 1</option>
          <option value="ss2">SSS 2</option>
          <option value="ss3">SSS 3</option>
        </select>
        <select value={selectedSubjectId} onChange={handleSubjectChange}>
          <option value="">Select Subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.creatExam}>
        <button onClick={handleAddNewExam} disabled={loading}>
          {loading ? "Creating..." : "Create Exam"}
        </button>
      </div>
      <table border="">
        <thead>
          <tr>
            <th>Exam Name</th>
            <th>Visibility</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          {exam.length === 0 && <p>No exam available.</p>}
          {exam.map((ex) => (
            <tr key={ex.id}>
              <td>
                <span>{ex.subjectName}</span>
              </td>
              <td>
                <input
                  type="checkbox"
                  checked={visibilityChanges[ex.id]}
                  onChange={() => handleCheckboxChange(ex.id)}
                />
              </td>
              <td>
                <select
                  value={durationChanges[ex.id] || ""} // Display the selected/default duration
                  onChange={(e) => handleDurationChange(ex.id, e.target.value)}
                >
                  <option disabled value="">
                    Select Time Duration
                  </option>
                  <option value={30 * 60}>30 minutes</option>
                  <option value={40 * 60}>40 minutes</option>
                  <option value={50 * 60}>50 minutes</option>
                  <option value={60 * 60}>1 hour</option>
                  <option value={70 * 60}>1 hour 10 minutes</option>
                  <option value={80 * 60}>1 hour 20 minutes</option>
                  <option value={90 * 60}>1 hour 30 minutes</option>
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className={styles.updateExamBtn}>
        <button disabled={loading} onClick={handleUpdateExams}>
          {loading ? "Please wait..." : "Save"}
        </button>
      </div>

      <div className={styles.allSubjects}>
        <h2>All Subjects</h2>
        {subjects.map((subject) => (
          <div key={subject.id}>
            {editingId === subject.id ? (
              <>
                <input
                  type="text"
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                />
                <button onClick={() => handleSaveClick(subject.id)}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)}>Cancel</button>
              </>
            ) : (
              <>
                <p>{subject.name}</p>
                <button onClick={() => handleEditClick(subject)}>Edit</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subject;
