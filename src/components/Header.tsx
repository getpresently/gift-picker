import React, {useEffect, useState} from 'react';

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
      <embed
        id="HeaderLogoButton"
        src="./headerLogo.svg"
        // alt="logo button"
      />

      {/*<div id={header}>*/}
        {/*<a href="HomePage">*/}
        {/*<Link to="/home">*/}
        {/*<div>*/}
        {/*</div>*/}
        {/*</Link>*/}
        {/*</a>*/}
      {/*</div>*/}
    </div>
  );
}

export default Header;
