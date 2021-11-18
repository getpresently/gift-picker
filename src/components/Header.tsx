import { Link } from 'react-router-dom';
import React, { useState, useEffect } from "react";
function Header() {
  const [header, setHeader] = useState("Header");
  const listenScrollEvent = () => {
    if (window.scrollY < 103) {
      return setHeader("Header");
    } else if (window.scrollY > 100) {
      return setHeader("Header2");
    }
  };
  useEffect(() => {
    window.addEventListener("scroll", listenScrollEvent);

    return () => window.removeEventListener("scroll", listenScrollEvent);
  }, []);
  return (
    <div id={header}>
      <a href="HomePage">
      <Link to="/home">

        <button type="button">
          <img
            id="HeaderLogoButton"
            src="./headerLogo.svg"
            alt="logo button"
          ></img>
        </button>
        </Link>
      </a>
    </div>
  );
}

export default Header;
