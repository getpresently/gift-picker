import React from 'react';
import Popup from 'reactjs-popup';
import "./Modal.css";
import { useEffect, useState } from "react";
import { Form, Button, Row, Col, FloatingLabel } from 'react-bootstrap';

function Modal() {
    return (
        <Popup trigger={<button className="button"> 💬 </button>} modal>
            <div id="container">

            </div>
            <div id="content">
                <p>Give Us Feedback!</p>
                <FloatingLabel controlId="floatingSelect" label="Works with selects">
                    <Form.Select aria-label="Floating label select example">
                        <option>Open this select menu</option>
                        <option value="1">One</option>
                        <option value="2">Two</option>
                        <option value="3">Three</option>
                    </Form.Select>
                </FloatingLabel>

                <FloatingLabel controlId="floatingTextarea" label="Comments" className="mb-3">
                    <Form.Control as="textarea" placeholder="Leave a comment here" />
                </FloatingLabel>
            </div>
        </Popup>
    );
}

export default Modal;