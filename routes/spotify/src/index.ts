import { resolve } from "path";
import { createElement } from "react";
import { renderToNodeStream, renderToString } from "react-dom/server";
import { readFileSync } from "fs";
import { loginUrl, SDK, authTokenFromCode } from "./sdk";
import transformReactJsx from "@babel/plugin-transform-react-jsx/lib";
import {
  createTemplateTags,
  RegisterTokenIds,
  TagRenderer,
} from "@xarc/tag-renderer";

import {
  PlayListMenu,
  SongList,
  AppBarTop,
  NowPlaying,
} from "./spotify-components";
const critcss = [
  readFileSync(resolve(__dirname, "mui.min.css")),
  readFileSync(resolve(__dirname, "template.css")),
].join("");
const express = require("express"); // Express web server framework
const router = express.Router();

const onHttp = async function (req, res) {
  let accessToken =
    req.query.access_token ||
    (req.query.code && (await authTokenFromCode(req.query.code)));
  const sdk = SDK({ accessToken });
  let playlists;

  const tagrenderer: TagRenderer = new TagRenderer({
    templateTags: createTemplateTags/*html*/ `
    <!DOCTYPE html>
      <html>
        <head>
=        <style>${critcss}</style>
       </head>
       <body>
       ${renderToString(
         createElement(AppBarTop, {
           accessToken: accessToken,
           loginUrl: loginUrl(32),
         })
       )}
      <div id='sidenav'>
      ${async () => {
        sdk.fetchAPI("/me/playlists").then((_res) => {
          playlists = _res;
          const rcstream = renderToNodeStream(
            createElement(PlayListMenu, {
              playlists: [].concat(playlists && playlists.items),
            })
          );
          res.pipe(rcstream);
        });
      }}
      </div>
      <div id='main'>
      ${() => {
        sdk
          .fetchAPI("/playlists/" + playlists.items[0].id + "/tracks")
          .then((songs) => {
            const output = renderToNodeStream(
              createElement(SongList, { songs: songs }, [])
            );
            res.pipe(output);
          });
      }}
      </div>
      </body>
      </html>
      `,
  });
  tagrenderer.initializeRenderer();
  tagrenderer.render({});
};
require("http").createServer(onHttp).listen(8080);

module.exports = router;
