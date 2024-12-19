/* eslint-disable react/prop-types */
import { useState } from "react";
import "./FormInput.css";

export const FormInput = ({
  label,
  errMes,
  required,
  placeholder,
  value,
  type,
  pattern,
  nameRef,
  name,
  onChange,
}) => {
  const [focus, setFocus] = useState(false);
  const handleFocus = () => {
    setFocus(true);
  };
  return (
    <div className="allInput">
      <label>{label} </label>
      <input
        className={`each-input ${focus && "focused"}`}
        value={value}
        required={required}
        name={name}
        autoComplete="off"
        ref={nameRef}
        type={type}
        pattern={pattern}
        onChange={onChange}
        placeholder={placeholder}
        onBlur={handleFocus}
        onFocus={() => name === "confirmPassword" && setFocus(true)}
      />
      <span>{errMes}</span>
    </div>
  );
};
