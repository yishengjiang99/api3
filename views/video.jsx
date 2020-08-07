import React from "react";


const Video = (props) => {
  return (
    <>
      <h1>{props.vid}</h1>
      <video src={props.videoSource}></video>
    </>
  );
};

export default Video;
