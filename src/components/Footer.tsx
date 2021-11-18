import { useEffect, useState } from 'react';
import logo from '../footer_logo.png'
import signature from '../presently_word.png'

function Footer() {

  const [isMobile, setMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 450) {
      setMobile(true);
    }
  }, []);

  const about = (
    <div className="text-white text-xs text-center sm:text-left flex px-4 md:p-10">
      <div className="m-auto">
        <p className="font-bold">About GiftPicker</p>
        <p>GiftPicker is a quick quiz that recommends amazing presents from our database of 1,000+ high-quality gifts!</p>
      </div>
    </div>
  )

  return (
    <footer className="text-gray-600 w-screen body-font" id="footer">
      <div id="footer-content" className="bg-deepBlack grid grid-cols-1 gap-y-2 md:grid-cols-3">
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
              <img className="m-auto w-20 h-20 object-scale-down" src={logo} alt="Footer_Logo"></img>
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
            <a href="https://www.instagram.com/giftpicker.io/" className="text-gray-500 text-3xl">
              <i className="fab fa-instagram" ></i>
            </a>
            <a href="https://twitter.com/giftpicker_io" className="text-3xl">
              <i className="fab fa-twitter" style={{ color: "white" }}></i>
            </a>
            <a href="https://www.tiktok.com/@thebestgifts?" className="text-3xl text-white">
              <i className="fab fab fa-tiktok" style={{ color: "white" }}></i>
            </a>
          </span>
          <p className="font-bold text-sm text-white flex flex-row gap-2 justify-center pt-2">Powered by <img alt="presently" src={signature} className="w-16 h-6 object-scale-down"></img>
          </p>

        </div>
      </div >
    </footer >
  );
}

export default Footer;
