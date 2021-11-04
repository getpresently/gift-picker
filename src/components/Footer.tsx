/* FOOTER */

function Footer() {
  return (
    <div id="Footer">
      <div id="FooterColumns">
        <div id="footerPresentlyCol">
          <p> Presently </p>
          <ol>
            <li>Coffee</li>
            <li>Tea</li>
            <li>Milk</li>
          </ol>
        </div>
        <div id="contactUsCol">
          <p> Contact Us</p>
        </div>
        <div id="contactUsCol">
          <p> Follow Us</p>
          <ol id="socialMediaLogos">
            <a
              href="https://www.instagram.com/giftpicker.io/?hl=en"
              target="_blank"
              rel="noreferrer"
            />
            <i className="fab fa-instagram fa-2x"></i>
          </ol>
        </div>
      </div>
      <div className="footer-copyright">
        <p>Copyright © 2021 Presently</p>
      </div>
      </div>
  );
}

export default Footer;
