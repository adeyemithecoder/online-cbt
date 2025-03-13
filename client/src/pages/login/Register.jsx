import { useEffect, useRef, useState } from "react";
import "./Login.css";
import { FormInput } from "../../components/form/FormInput";
import axios from "axios";
import { getError } from "../../components/others/getError";
import { apiUrl } from "../../utils";

const Register = () => {
  const [loading, setLoading] = useState(false);
  const initialValues = {
    level: "",
    password: "",
    confirmPassword: "",
    name: "",
    username: "",
    surname: "",
  };
  const [values, setValues] = useState(initialValues);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value.trim(),
    });
  };
  const schoolId = JSON.parse(
    localStorage.getItem("loggedInStudent")
  )?.schoolId;
  const handleAddStudent = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${apiUrl}/api/students/create-student`, {
        level: values.level,
        password: values.password,
        name: values.name,
        username: values.username,
        surname: values.surname,
        schoolId: schoolId,
      });
      alert("Student registered successfully");
      setValues(initialValues);
    } catch (error) {
      console.log(getError(error));
      alert(getError(error));
    }
    setLoading(false);
  };

  const nameRef = useRef(null);

  useEffect(() => {
    nameRef?.current?.focus();
  }, []);
  return (
    <div className="register ">
      <form className="form-control" onSubmit={handleAddStudent}>
        {" "}
        <h1>Register Here</h1>
        <FormInput
          label=""
          type="text"
          nameRef={nameRef}
          placeholder="Surname"
          name="surname"
          required={true}
          // pattern="^[A-Za-z0-9]{3,16}$"
          value={values.surname}
          onChange={handleInputChange}
        />
        <FormInput
          // errMes="Name should be 3-16 characters and must not include any
          // special character  or space!"
          label=""
          type="text"
          placeholder="Name"
          name="name"
          required={true}
          // pattern="^[A-Za-z0-9]{3,16}$"
          value={values.name}
          onChange={handleInputChange}
        />
        <FormInput
          errMes="Username should be 3-16 characters and must not include any 
          special character  or space!"
          label=""
          type="text"
          placeholder="Username"
          name="username"
          required={true}
          pattern="^[A-Za-z0-9]{3,16}$"
          value={values.username}
          onChange={handleInputChange}
        />
        <FormInput
          label=""
          errMes="Password should be 8-20 characters and include atleast 1 number, 1 letter."
          type="text"
          placeholder="Password"
          name="password"
          required={true}
          pattern="^(?=.*[0-9])(?=.*[a-zA-Z]).{8,20}$"
          value={values.password}
          onChange={handleInputChange}
        />
        {/* <FormInput
          errMes="Please let Passwords match"
          label=""
          type="password"
          placeholder="Confirm Passwoed"
          name="confirmPassword"
          required={true}
          pattern={values.password}
          value={values.confirmPassword}
          onChange={handleInputChange}
        /> */}
        <div className="select-container">
          <select
            value={values.level}
            onChange={handleInputChange}
            name="level"
            id="level"
            required
            placeholder="What Class Are You?"
          >
            <option value="" disabled selected hidden>
              Select class
            </option>
            <option value="js1">js1</option>
            <option value="js2">js2</option>
            <option value="js3">js3</option>
            <option value="ss1">ss1</option>
            <option value="ss2">ss2</option>
            <option value="ss3">ss3</option>
          </select>
        </div>
        <button className={loading ? "disable" : ""}>
          {loading ? "Loading..." : "Register"}{" "}
        </button>
      </form>
    </div>
  );
};

export default Register;
