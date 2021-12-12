import React from 'react';
import Popup from 'reactjs-popup';
import "./Modal.css";
import { useEffect, useState } from "react";
import { Form, Button, Row, Col, FloatingLabel } from 'react-bootstrap';
import gif from '../loading_gif.gif'


function Modal() {
    return (
        <Popup trigger={<button className="button"> 💬 </button>} lockScroll={false} modal>
            <div id="load_form">
                <img className="footerlogo" id="loadingResults" src={gif} alt=""></img>
                <p className="text-gray-400 text-sm pt-6">LOADING...</p>
            </div>
            <iframe className="airtable-embed-feedback"
                src="https://airtable.com/embed/shreNMgLcVFokWDJC?backgroundColor=cyan"
                frameBorder="0" width="100%" height="533"
                style={{ background: "transparent", border: "1px" }}></iframe>
        </Popup>
    );
}

export default Modal;