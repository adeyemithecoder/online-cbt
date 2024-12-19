import { useState } from "react";
import FileInput from "../../components/excel/FileInput";
import ReadExcel from "../../components/excel/ReadExcel";
import "./SetExam.css";
import AddQueToExam from "../../components/newQuestion/AddQueToExam";

const SetExam = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");

  const handleFileChange = async (file) => {
    try {
      const datas = await ReadExcel(file);
      const filteredData = datas
        .filter((item) => Array.isArray(item) && item[0])
        .slice(1); // Remove the first item (header row)

      console.log(filteredData);

      // Check for any incomplete questions
      const incompleteQuestions = filteredData.some((item) => item.length < 6);
      if (incompleteQuestions) {
        alert("One or more questions are incomplete.");
        return; // Stop further processing if any item is incomplete
      }

      const allQuestion = filteredData.map((item, index) => {
        console.log(`Processing item ${index}:`, item);
        const questionObject = {
          question: item[0],
          options: Object.values(item)
            .slice(1, 5)
            .map((value) => value.toString().trim()),
          correctAnswer: item[5].toString().trim(),
        };
        return questionObject;
      });

      setQuestions(allQuestion);
    } catch (error) {
      console.error("Error reading the Excel file:", error);
    }
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  return (
    <>
      <div className="setexam-container">
        <FileInput onFileChange={handleFileChange} />
        <AddQueToExam
          selectedSubject={selectedSubject}
          newQuestions={questions}
          handleSubjectChange={handleSubjectChange}
          setQuestions={setQuestions}
        />
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
            </tr>
          </thead>
          <tbody>
            {questions &&
              questions.map((question, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{question.question}</td>
                  {question.options.map((option, optionIndex) => (
                    <td key={optionIndex}>{option}</td>
                  ))}
                  <td>{question.correctAnswer}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default SetExam;
