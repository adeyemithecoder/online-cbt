import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  console.log("object");
  return (
    <div className="home">
      <img src="./img/stu3.jpg" alt="Background" className="background-img" />
      <span className="overlay"></span>
      <div className="container">
        <h1>
          Welcome to As Code Elevate CBT. <br />
          We wish you success in your examination.
        </h1>
        <Link className="link" to={"/login"}>
          User login
        </Link>
        <Link className="link" to={"/student-login"}>
          Student login
        </Link>
      </div>
    </div>
  );
};

export default Home;
