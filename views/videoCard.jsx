import React from 'react';
const videoCard = ({ vid, title, description = '' }) => {
    <span>
        <h3>{title}</h3>
        <img src={`https://i.ytimg.com/vi/${vid}/default.jpg`}></img>
        <div>{description}</div>
    </span>
}

export default videoCard;
