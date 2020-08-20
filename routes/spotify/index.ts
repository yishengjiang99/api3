const Path = require("path");
import React, {useState} from 'react';
import {renderToString} from "react-dom/server";
import * as fs from "fs";
import * as babelRegister from "@babel/register";
import { loginUrl, SDK } from "./sdk";
import transformReactJsx from '@babel/plugin-transform-react-jsx/lib';
import {TagTemplate, createTemplateTags,Token, TokenInvoke, TagRenderer} from '@xarc/tag-renderer';
import { exec } from "child_process";
babelRegister({
  presets: ["@babel/preset-react", "@babel/preset-env"],
});
const { LeftNav, PlayListMenu, SongList, AppBarTop, NowPlaying} = require("./spotify-components");


require('http').createServer((req,res)=>{
  new TagRenderer({
    tokenHandlers: [
      function jsx(str: string){
        return renderToString(transformReactJsx(str))
      }
    ],
    templateTags: createTemplateTags``

    
  })
})

const critcss = [
  fs.readFileSync(Path.resolve(__dirname, "mui.min.css")),
  fs.readFileSync(Path.resolve(__dirname, "template.css")),
].join("")

const handlers={
  "(.*?)": (jsx) => {
    return renderToString(transformReactJsx(jsx))
  },

  "{.*?}": (js) => {
    return eval(js)
  },

  "\<?php ?\>": (php) => {
    return require('child_process').execSync(`php -e '${php}'`)
  }
}


export const templateTags = createTemplateTags/*html*/ `
  <!DOCTYPE html>
    <html>${Token("INITIALIZE", {access_token: ""})}
      <head>
      <style>${critcss}</style>
     </head>
     <body>
     ( <AppBarTop></AppBarTop> )
         
     </body>
     <script type='module'>

     </script>
    </html>
   `;


const onHttpRequest = (req, res)=>{
let accessToken = req.query.access_token;
  if (!accessToken && req.query.code) {
    accessToken = SDK().authTokenFromCode(req.query.code);
  }
  res.write(`
    <html>
    <head>
        <title>Spotify Premium Player</title>
        <style>`);
  res.write(css[0]);
  res.write(css[1]);
  res.write(`
        </style>
    </head>
    <body>
<div id=container>
    <div class=sidenav id='playlist'>`);
  if (!accessToken) {
    res.end(`
    <button> <a href='${loginUrl(42)}'>Login</a></button>
    </div></div></body></html>`);
    return;
  }

  const playlists = await sdk.fetchAPI("/me/playlists");
  const rcstream = ReactDOMServer.renderToNodeStream(
    React.createElement(PlayListMenu, {
      playlists: [].concat(playlists && playlists.items),
    })
  );
  rcstream.pipe(res);
  rcstream.on("end", function () {
    res.write("</div>");
  });

  const tracklist = await sdk.fetchAPI(
    "/playlists/" + playlists.items[0].id + "/tracks"
  );
  console.log(tracklist);
  const tracksout = ReactDOMServer.renderToNodeStream(
    SongList,
    {
      songs: tracklist,
      songId: tracklist[0].track.id,
      songPlaying: null,
    },
    []
  );
  tracksout.pipe(res);
  tracksout.on("end", () => {
    res.end("</div></div></body></html>");
  });
});
// res.end(JSON.stringify(playlists.items)
const express = require("express"); // Express web server framework
const router = express.Router();
module.exports = router;
