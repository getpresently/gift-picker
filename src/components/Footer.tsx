import {useEffect, useState} from 'react';
import logo from '../footer_logo.svg';
import signature from '../presently_word.png';
import {Link} from 'react-router-dom';

function Footer() {

  const [isMobile, setMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 450) {
      setMobile(true);
    }
  }, []);

  const about = (
    <div className="text-white text-base text-center sm:text-left flex p-4 md:pl-20">
      <div className="m-auto">
        <h4 className="pb-5">About GiftPicker</h4>
        <p>GiftPicker is a quick quiz that recommends actually good gifts from a curated database of gifts</p>
      </div>
    </div>
  );

  return (
    <footer className="text-gray-600 w-screen body-font" id="footer">
      <div id="footer-content" className="bg-deepBlack grid grid-cols-1 gap-y-2 md:grid-cols-3 p-4" >
        {isMobile ?
          <>
            <div className="flex p-3">
              <img className="m-auto w-20 h-20 object-scale-down" src={logo} alt="Footer_Logo"></img>
            </div>
            {about}
          </> :
          <>
            {about}
            <div className="flex">
              <Link to="/home" className="m-auto">
                <img className="m-auto w-20 h-20 object-scale-down" style={{pointerEvents: 'none'}} src={logo} alt={'logo bottom'}/>
              </Link>
            </div>
          </>}
        <div className="flex grid grid-cols-1 p-3 md:p-10">
          <span
            className="
              inline-flex
              gap-x-10
              justify-center
            "
          >
            <a href="https://www.instagram.com/giftpicker.io/" target="_blank" className="text-gray-500 text-3xl">
              <i className="fab fa-instagram" style={{color: 'white'}}/>
            </a>
            <a href="https://twitter.com/giftpicker_io" target="_blank" className="text-3xl">
              <i className="fab fa-twitter" style={{color: 'white'}}/>
            </a>
            <a href="https://www.tiktok.com/@thebestgifts?" target="_blank" className="text-3xl text-white">
              <i className="fab fab fa-tiktok" style={{color: 'white'}}/>
            </a>
          </span>
          <p className="font-bold text-sm text-white flex flex-row gap-2 justify-center pt-2">Powered by
            <a href="https://getpresently.com/" target="_blank">
              <img style={{pointerEvents: 'none'}} src={signature} className="w-16 h-6 object-scale-down" alt={'logo'}/>
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
