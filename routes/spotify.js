
const { readFileSync, createReadStream } = require('fs');
const { checkAuth, refreshToken, instantiateSDK } = require("../middlewares/checkauth");
var express = require("express"); // Express web server framework
const React = require("react");
const ReactDom = require("react-dom/server");
const page = readFileSync("./views/spotifylayout.html").toString().split("<!--BREAK-->");
const critjs = readFileSync("./views/spotifyfooter.html");
const critcss = readFileSync("./static/critic.css");

const { proxy_pass } = require('../vpn');

require("@babel/register")({
  presets: [
    "@babel/preset-react",
    [
      "@babel/preset-env",
      {
        targets: {
          node: "current",
        },
      },
    ],
  ],
  plugins: ["@babel/transform-flow-strip-types"],
});
const { NowPlaying, PlayListMenu, TrackRow, SpotifyFooter, TrackList, SideNav, App } = require("../views/spotifyAppBunddle")

const { Readable } = require('stream');
const { fs } = require('memfs');

var router = express.Router();
const h = React.createElement;
const rts = ReactDom.renderToString;
const mockStdk = require("./staticMocks");
router.use("/", [checkAuth]);

const writeStreamSync = (stream, content) => new Promise(resolve => {
  stream.write(content, () => resolve())
});
const renderElement = (response, element) => new Promise((resolve, reject) => {
  const stream = ReactDom.renderToNodeStream(element);
  stream.pipe(response);
  stream.on("end", resolve);
  stream.on("error", reject);
})

router.get("/bundle.css", (req, res) => Readable.from(critcss).pipe(res));

router.get("/", async function (req, res) {
  try {
    const { fetchAPI, fetchAPIPut } = req.session.sdk ? req.session.sdk : mockStdk;
    res.writeHead(200, "welcome", { "Content-Type": "text/html" });
    const part1Wrote = writeStreamSync(res, page[0]); //
    const trackListGot = fetchAPI("/me/player/recently-played");
    const playListGot = fetchAPI("/me/playlists");

    const trackList = await trackListGot;
    await part1Wrote;
    const tracks = (trackList.tracks || trackList.items)
    await renderElement(res, NowPlaying({ item: tracks[0] }));

    await writeStreamSync(res, page[1]);
    await renderElement(res, TrackList({ trackList: tracks || [] }));
    await writeStreamSync(res, page[2]);
    const playlists = await playListGot;
    await writeStreamSync(res, rts(PlayListMenu({ playlists: playlists.items })));
    await writeStreamSync(res, page[3]);
    res.end();
  } catch (e) {
    console.error(e);
    res.end(e.message)
  }
});


router.get("/refresh_token", refreshToken);

module.exports = router;
