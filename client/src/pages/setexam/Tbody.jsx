import { BiEditAlt } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import { Link } from "react-router-dom";
import React, { useEffect } from "react";
import axios from "axios";

const Tbody = ({ handleDelete, questions, examToFetch, setQuestions }) => {
  useEffect(() => {
    if (examToFetch === "") return;
    const result = async () => {
      console.log(examToFetch);
      const testDb = await axios
        .get(`http://localhost:8000/${examToFetch}`)
        .then((res) => res.data);
      console.log(testDb);
      setQuestions(testDb);
    };
    result();
  }, [setQuestions, examToFetch]);
  return (
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
            <td>
              <Link to={`/editexam/${examToFetch}/${question.id}`}>
                <BiEditAlt className='icon' />
              </Link>
            </td>
            <td>
              <MdDelete
                className='icon'
                onClick={() => handleDelete(`{${examToFetch}/${question.id}}`)}
              />
            </td>
          </tr>
        ))}
    </tbody>
  );
};

export default Tbody;
