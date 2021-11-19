import React, {useEffect, useState} from 'react';
import { Link } from 'react-router-dom';
function Header() {
  const [header, setHeader] = useState('Header');
  const listenScrollEvent = () => {
    if (window.scrollY < 103) {
      return setHeader('Header');
    } else if (window.scrollY > 100) {
      return setHeader('Header2');
    }
  };
  useEffect(() => {
    window.addEventListener('scroll', listenScrollEvent);

    return () => window.removeEventListener('scroll', listenScrollEvent);
  }, []);
  return (
    <div>
      <div id={header}>
        <Link to="/home">
          <img
            style={{pointerEvents: 'none' }}
            id="HeaderLogoButton"
            src="./headerLogo.svg"  alt={'logo'}/>
        </Link>
      </div>
    </div>
  );
}

export default Header;
