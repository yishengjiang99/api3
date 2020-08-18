import React, { useState } from 'react';
const videopage = ({ videos }) =>
  <div>
    <form action='/yt' method='post'>
      <input name='query' type='text'></input>
      <inpput type='submit' value='search'></inpput>
    </form>
    {videos.map(v =>
      <span>
        <h3>{v.title}</h3>
        <img src={`https://i.ytimg.com/vi/${v.vid}/default.jpg`}></img>
        <audio controls src={`/yt/vid/${v.vid}.mp3`}></audio>
        <div>{v.description}</div>
      </span>)}
  </div>

export default videopage;