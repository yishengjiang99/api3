import React from "react";

const Index = (props) => {
  return (
    <html>
      <head>
        <title>Server rendered</title>
      </head>
      <body>
        <h1>{props.channel}</h1>
        <input type="text" id="channel" size={20}></input>
        <button>btnOpenRoom</button>
        <div id="myaudio"></div>
        <audio id="myaudio" controls autoplay="false"></audio>
        <div id="console"></div>
        <button>Start</button>
      </body>
    </html>
  );
};

export default Index;
