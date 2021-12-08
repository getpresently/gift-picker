import React from 'react';
import Popup from 'reactjs-popup';
import "./Modal.css";
import { useEffect, useState } from "react";
import { Form, Button} from 'react-bootstrap';

function Modal() {
    return (
        <Popup trigger={<button className="button"> 💬 </button>} modal>
            <div id="container">
        
            </div>
            <div id="content">
                    <p>Give Us Feedback!</p>
                    
            </div>
        </Popup>
    );
}

export default Modal;