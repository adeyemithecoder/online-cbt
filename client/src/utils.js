/* eslint-disable react/prop-types */

export const apiUrl =
  import.meta.env.MODE == "development"
    ? "http://localhost:8000"
    : "https://blog-app-jenc.onrender.com";

export const getError = (error) => {
  return error.response && error.response.data.message
    ? error.response.data.message
    : error.message;
};

// import { Navigate } from "react-router-dom";

// const ProtectedRoute = ({ children }) => {
//   const storedObject = JSON.parse(localStorage.getItem("loggedInStudent"));

//   if (!storedObject) {
//     return <Navigate to="/login" />;
//   }

//   return children;
// };

// export default ProtectedRoute;
