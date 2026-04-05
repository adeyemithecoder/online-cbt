/* eslint-disable react/prop-types */
import { AiFillFileExcel } from "react-icons/ai";
import "./FileInput.css";

const FileInput = ({ onFileChange }) => {
  const handleFileChange = (event) => {
    const fileList = event.target.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      onFileChange(file);
    }
  };

  return (
    <div className="exam-container">
      <div className="fileinput-container">
        <label htmlFor="file" className="shareOption">
          <AiFillFileExcel fontSize={30} className="icon" />
          <span className="shareOptionText">Import Exam</span>
          <input
            style={{ display: "none" }}
            type="file"
            id="file"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

export default FileInput;
