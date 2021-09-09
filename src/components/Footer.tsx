import React from 'react';

/* FOOTER */

function Footer() {
    
    return (
    <div className="footer">
        <div className="footer-logo">
            <img className="footerlogo" src="./App-logo.png" alt=""></img>
        </div>
        {/* contains all sections with headers and links */}
        <div className="footer-sections">
            {/* contains section for Presently info */}
            <div className="footer-section">
                <b><p>
                    PRESENTLY
                </p></b>
                <p> 
                    <a href="https://getpresently.com" 
                    target="_blank" 
                    rel="noreferrer"
                    >
                    Home
                    </a>
                </p>
                <p>
                    <a href="https://getpresently.com/about/" 
                    target="_blank" 
                    rel="noreferrer"
                    >
                    About
                    </a>
                </p>
                <p>
                    <a href="https://getpresently.com/go/set-up-your-group-gift/" 
                    target="_blank" 
                    rel="noreferrer"
                    >
                    Group Gifting
                    </a>
                </p>
            </div>
            {/* contains section for contact info */}
            <div className="footer-section">
                <b><p>
                    CONTACT US
                </p></b>
                <p>
                    Qali Langstaff
                </p>
                <p>
                    <a
                    href="mailto: qali@presently.fun"
                    target="_blank"
                    rel="noreferrer"
                    >
                    qali@presently.fun
                    </a>
                </p>
            </div>
            {/* contains section for social media info */}
            <div className="footer-section">
                <b><p>
                    FOLLOW US
                </p></b>
                <p>
                    <a href="https://www.instagram.com/giftpicker.io/?hl=en" 
                    target="_blank" 
                    rel="noreferrer"
                    >
                    <i className="fab fa-instagram fa-2x"></i>
                    </a>
                </p> 
            </div>
        </div>

        {/* contains section for copyright seperate from other sections */}
        <div className="footer-copyright">
            <p>
                Copyright © 2021 Presently
            </p>
        </div>
    </div>
    )
}

export default Footer;