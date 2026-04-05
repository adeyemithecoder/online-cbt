import { useState } from "react";
import axios from "axios";
import { useApp } from "../../context/AppContext";

export default function CreateUserPage() {
  const { accountingAuth } = useApp();
  const { schoolId } = accountingAuth;
  const [form, setForm] = useState({
    username: "",
    password: "",
    name: "",
    gender: "",
  });

  const handleSubmit = async () => {
    try {
      await axios.post("http://localhost:5000/api/users/create-user", {
        ...form,
        schoolId,
      });

      alert("User created");
    } catch (err: any) {
      alert(err.response?.data?.message);
    }
  };

  return (
    <div>
      <h1>Create User</h1>
      <input
        placeholder="Username"
        onChange={(e) => setForm({ ...form, username: e.target.value })}
      />
      <input
        placeholder="Password"
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />
      <button onClick={handleSubmit}>Create</button>
    </div>
  );
}
