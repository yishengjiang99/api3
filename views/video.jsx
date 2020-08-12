import React from 'react';
import SearchBar from './searchBar';
const videopage = ({ videos }) =>
  <div>
    <searchBar></searchBar>
    {videos.map(v =>
      <span>
        <h3>{v.title}</h3>
        <img src={`https://i.ytimg.com/vi/${v.vid}/default.jpg`}></img>
        <audio controls src={`https://www.grepawk.com/yt/${v.vid}.mp3`}></audio>
        <div>{v.description}</div>
      </span>)}
  </div>

export default videopage;
