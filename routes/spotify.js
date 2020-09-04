
const { readFileSync, createReadStream } = require('fs');
const { checkAuth, refreshToken, instantiateSDK } = require("../middlewares/checkauth");
var express = require("express"); // Express web server framework
const React = require("react");
const ReactDom = require("react-dom/server");
const crit1 = readFileSync("./views/spotifylayout.html");
const critcss = readFileSync("./static/critic.css");
const crit2 = readFileSync("./views/spotifyfooter.html")
const { PlatListMenu, TrackRow, } = require("../views/misc-components");
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
const { NowPlayingDiv, SpotifyFooter } = require("../views/spotifyfooter");
const { Readable } = require('stream');

var router = express.Router();
const h = React.createElement;
const rts = ReactDom.renderToString;

router.use("/", [checkAuth, instantiateSDK]);

const writeStreamSync = (stream, content) => new Promise(resolve => {
  stream.write(content, () => resolve())
});
router.get("/bundle.css", (req, res) => Readable.from(critcss).pipe("res"));

router.get("/", async function (req, res) {
  try {
    res.writeHead(200, "welcome", {
      "Content-Type": "text/html"
    });
    res.write(crit1);
    const { fetchAPI, fetchAPIPut } = req.session.sdk;
    const playlists = await fetchAPI("/me/playlists");

    const playlistMenu = PlatListMenu({ playlists });
    res.write("<div class='sidenav'>")
    const html = rts(playlistMenu);

    res.write(html);
    const playlistID = req.params.playlist_id || playlists.items[0].id
    const playlist_name = req.params.playlist_name || playlists.items[0].name

    const trackList = await fetchAPI("/me/tracks");
    await writeStreamSync(res, rts(
      h("div", {}, [
        h('div', null, [
          "your tracks",
          h('button', { onClick: () => queueTracks(trackList) }, 'Play')
        ]),
        h(
          "ul",
          { style: { maxHeight: 300, 'overscrollY': 'scroll' } },
          trackList.items.map((item) => {
            const track = {
              imgURL: item.track.album.images[0].url,
              name: item.track.name,
              artist: item.track.artists.map(a => a.name).join(", "),
              trackID: item.track.id
            }
            return TrackRow({ track })
          })
        )
      ]
      )));
    res.write("</div>")

    const track = trackList.items[0].track;

    console.log(track);
    await writeStreamSync(res, rts(NowPlayingDiv({
      imgURL: track.album.images[0].url,
      name: track.name,
      artist: track.artists.map(a => a.name).join(", "),
      trackID: track.id
    })));
    writeStreamSync(res, rts(SpotifyFooter()));
    res.end(crit2)
    // console.log("before")
    // await printCritCssPromise;
    // console.log("print")
    // playlists = await playlistPromise;
    // console.log("rendering")
    // res.render("listview", { list: playlists.items }, (err, html) => err && console.error(err) || res.write(html));
    // const trackList = await sdk.fetchAPI("/playlists/" + playlists.items[0].id + "/tracks");
    // res.render("listview", { list: trackList.items }, (err, html) => err && console.error(err) || res.write(html));
    // res.end(crit2);
  } catch (e) {
    console.error(e);
  }
});

router.use("/bundle", (req, res) => {
  proxy_pass(res.socket, { path: "spotify", host: "127.0.0.1", port: 3000 })
})

router.get("/refresh_token", refreshToken);

module.exports = router;
