/* eslint-disable react/prop-types */
import "./Dialog.css";

const AlertDialog = ({ setOpenAlert, message }) => {
  return (
    <div className='dialogContainer'>
      {" "}
      <div className='DialogBackground'>
        <div className='DialogContainer'>
          <div className='CloseDialog'>
            <button onClick={() => setOpenAlert(false)}>X</button>
          </div>
          <h1>{message}</h1>
          <div className='action'>
            <button className='red' onClick={() => setOpenAlert(false)}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;
