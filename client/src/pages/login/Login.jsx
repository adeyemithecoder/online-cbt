/* eslint-disable react/prop-types */
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import "./Login.css";
import { FormInput } from "../../components/form/FormInput";
import axios from "axios";
import { apiUrl, getError } from "../../utils";
import { IoIosEyeOff, IoMdEye } from "react-icons/io";

const Login = () => {
  const navigate = useNavigate();
  const initialValues = {
    class: "",
    password: "",
    confirmPassword: "",
    score: 0,
    username: "",
    surname: "",
    userId: "",
  };
  const [values, setValues] = useState(initialValues);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${apiUrl}/api/users/login-user`, {
        username: values.username,
        password: values.password,
      });
      setError("");
      console.log(data);
      localStorage.setItem("loggedInStudent", JSON.stringify(data.user));
      navigate("/exam");
    } catch (error) {
      console.error("Error fetching students:", error);
      setError(getError(error));
    }
    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value.trim(),
    });
  };

  const nameRef = useRef(null);
  useEffect(() => {
    const user = localStorage.getItem("loggedInStudent");
    if (user) {
      navigate("/exam");
    }
    nameRef?.current?.focus();
  }, [navigate]);

  return (
    <div style={{ marginTop: "120px" }}>
      <div className="register">
        <form className="form-control" onSubmit={handleLogin}>
          {" "}
          <h1>Admin Login</h1>
          <FormInput
            errMes="Username should be 3-16 characters and must not include any special character!"
            label=""
            type="text"
            placeholder="Username"
            name="username"
            required={true}
            nameRef={nameRef}
            pattern="^[A-Za-z0-9]{3,16}$"
            value={values.username}
            onChange={handleInputChange}
          />
          <FormInput
            label=""
            type="password"
            placeholder="Password"
            name="password"
            required={true}
            value={values.password}
            onChange={handleInputChange}
            eyeOpen={<IoMdEye />}
            eyeClose={<IoIosEyeOff />}
          />
          <button disabled={loading}>
            {" "}
            {loading ? "Submitting..." : "Submit"}
          </button>
          <Link className="link" to={"/"}>
            Go home
          </Link>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
