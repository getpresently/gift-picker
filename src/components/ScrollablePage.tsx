import React, { Component } from 'react';


interface PropTypes {
    childComp?: React.ReactNode; 
}

const ScrollablePage: React.FC<PropTypes> = (props) => {

    const {childComp} = props;

    return (
        <div>
             {childComp}       
        </div>

    );
}

export default ScrollablePage;