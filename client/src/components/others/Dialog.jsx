/* eslint-disable react/prop-types */
// import React, { useState } from "react";
import { MdNotListedLocation } from "react-icons/md";
import "./Dialog.css";

const Dialog = ({ setOpenDialog, message, action, loading }) => {
  return (
    <div className="dialogContainer">
      {" "}
      <div className="DialogBackground">
        <div className="DialogContainer">
          <div className="CloseDialog">
            {" "}
            <button onClick={() => setOpenDialog(false)}>X</button>
          </div>
          <h1>{message} </h1>
          <h2>
            <MdNotListedLocation className="question" fontSize="large" />
          </h2>{" "}
          <div className="action">
            <button className="red" onClick={() => setOpenDialog(false)}>
              No
            </button>
            <button disabled={loading} className="yes" onClick={action}>
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dialog;
