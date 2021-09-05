import React from 'react';

interface SuggestionProps {
    title: string;
    brand: string;
    photo: string;
    link: string;
}

function Suggestion ({title, brand, photo, link}: SuggestionProps): JSX.Element {
    return (
        <div className="column">
            <img src={photo} alt="{photo}"/>
            <b><p>{title}</p></b>
            <p>By {brand}</p>
            <p>
            <a href={link} target="_blank" rel="noreferrer">Full Details</a>
            </p>
        </div>
    )
}

export default Suggestion;