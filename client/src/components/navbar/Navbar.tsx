import React, { useState } from "react";
import {
  FaBook,
  FaClipboardCheck,
  FaFileImport,
  FaPowerOff,
} from "react-icons/fa";
import { FcClock } from "react-icons/fc";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaPersonCircleQuestion } from "react-icons/fa6";
import { PiUsersFourThin } from "react-icons/pi";
import { IoPersonAddSharp } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import Dialog from "../others/Dialog"; // Adjust the path as needed

import "./Navbar.css";
import { MdAdminPanelSettings } from "react-icons/md";

const Navbar = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const lastSegment = `/${pathname.split("/").filter(Boolean).pop()}`;
  const navigate = useNavigate();

  const [openDialog, setOpenDialog] = useState(false);

  const handleLogout = () => {
    setOpenDialog(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("loggedInStudent");
    setOpenDialog(false);
    navigate("/");
  };

  const links = [
    {
      icon: <IoPersonAddSharp fontSize={25} />,
      name: "Register",
      route: "/register",
    },
    // { icon: <CgLogIn fontSize={25} />, name: "Login", route: "/login" },
    { icon: <FcClock fontSize={25} />, name: "Exam", route: "/exam" },

    {
      icon: <FaPersonCircleQuestion fontSize={25} />,
      name: "Exam History",
      route: "/ExamHistory",
    },
    {
      icon: <PiUsersFourThin fontSize={25} />,
      name: "AllStudents",
      route: "/studentlist",
    },
    {
      icon: <IoIosCheckmarkCircle fontSize={25} />,
      name: "Exam Score",
      route: "/score",
    },
    // {
    //   icon: <FcManager fontSize={25} />,
    //   name: "OnlineData",
    //   route: "/OnlineData",
    // },
    {
      icon: <FaClipboardCheck fontSize={25} />,
      name: "All Exam",
      route: "/allExam",
    },
    {
      icon: <FaFileImport fontSize={25} />,
      name: "Import Exam",
      route: "/setexam",
    },
    {
      icon: <FaBook fontSize={25} />,
      name: "Subject",
      route: "/subject",
    },
    {
      icon: <MdAdminPanelSettings fontSize={25} />,
      name: "Admin",
      route: "/admin",
    },
    {
      icon: <FaPowerOff fontSize={25} />,
      name: "Logout",
      route: "#",
      onClick: handleLogout,
    },
  ];

  return (
    <>
      {openDialog && (
        <Dialog
          message="Are you sure you want to log out?"
          action={confirmLogout}
          setOpenDialog={setOpenDialog}
        />
      )}
      <div
        className={
          lastSegment == "/undefined" || lastSegment == "/login"
            ? "notDisplay"
            : "meneItems"
        }
      >
        <ul>
          {links.map((link) => (
            <li key={link.route}>
              {link.route === "#" ? (
                <span className="link" onClick={link.onClick}>
                  {link.icon} {link.name}
                </span>
              ) : (
                <Link
                  className={`link ${
                    link.route === lastSegment ? "selected" : "notselected"
                  }`}
                  to={link.route}
                >
                  {link.icon} {link.name}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};

export default Navbar;
