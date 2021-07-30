import React from 'react';

interface SuggestionProps {
    title: string;
    brand: string;
    photo: string;
    link: string;
}

function Suggestion ({title, brand, photo, link}: SuggestionProps): JSX.Element {
    return (
        <div>
            <b><p>{title}</p></b>
            <p>By {brand}</p>
            <img src={photo} alt="{photo}"/>
            <p>
            <a href={link} target="_blank" rel="noreferrer">More Details</a>
            </p>
        </div>
    )
}

export default Suggestion;