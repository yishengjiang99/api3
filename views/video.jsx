import React from "react";
import {useState,useEffect,useRef} from 'react';

const useAnimationFrame = callback => {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = React.useRef();
  const previousTimeRef = React.useRef();
  const animate = time => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime)
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }
  
  React.useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); // Make sure the effect runs only once
}


const Video = (props) => {
  const hudRef = useRef();
  const [t, setT] = useState(0);
  useAnimationFrame(deltaTime => {
    // Pass on a function to the setter of the state
    // to make sure we always have the latest state
    setT(prevCount => (prevCount + deltaTime * 0.01) % 100);
  });
  return (
    <>
      <h1>{t}</h1>
      <canvas width={100} height={20} ref={hudRef}></canvas>
      <video src={props.videoSource}></video>
    </>
  );
};

export default Video;
