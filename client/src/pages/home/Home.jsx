import { Link } from "react-router-dom";
import "./Home.css";
const Home = () => {
  return (
    <div className="home">
      <span className="overlay"></span>
      <div className="container">
        {" "}
        <h1>
          Welcome to Crystal Brains School CBT. <br />
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
