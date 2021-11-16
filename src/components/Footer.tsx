import { useEffect, useState } from 'react';
import logo from '../footer_logo.png'
import signature from '../presently_word.png'

function Footer() {

  const [isMobile, setMobile] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 414) {
      setMobile(true);
    }
  }, []);

  const about = (
    <div className={`text-white text-xs text-center sm:text-left flex ${isMobile ? 'px-4' : 'p-10'}`}>
      <div className="m-auto">
        <p className="font-bold">About GiftPicker</p>
        <p>GiftPicker is a quick quiz that recommends amazing presents from our database of 1,000+ high-quality gifts!</p>
      </div>
    </div>
  )

  return (
    <footer className="text-gray-600 w-screen body-font">
      <div className={`bg-footer grid ${isMobile ? 'grid-cols-1 gap-y-2' : 'grid-cols-3'}`}>
        {isMobile ?
          <>
            <div className="flex">
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
        <div className={`flex grid grid-cols-1 ${isMobile ? '' : 'p-10'}`}>
          <span
            className="
              inline-flex
              gap-x-5
              justify-center
            "
          >
            <a href="https://www.instagram.com/getpresently/" className="text-gray-500">
              <i className="fab fa-instagram"></i>
            </a>
            <a href="https://www.facebook.com/GetPresently/" className="text-gray-500">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="https://www.tiktok.com/@thebestgifts?" className="text-gray-500">
              <i className="fab fab fa-tiktok"></i>
            </a>
          </span>
          <p className="font-bold text-sm text-white flex flex-row gap-2 justify-center">Powered by <img alt="presently" src={signature} className="w-16 h-6 object-scale-down"></img>
          </p>

        </div>
      </div>
    </footer>
  );
}

export default Footer;
