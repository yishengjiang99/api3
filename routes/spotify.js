const express = require("express"); // Express web server framework
const React = require("react");
const Path = require("path");
const execSync = require("child_process").execSync;
const ReactDOMServer = require("react-dom/server");
const babelRegister = require("@babel/register");
const fs = require('fs');
babelRegister({
  presets: ["@babel/preset-react", "@babel/preset-env"]
});
const { PlayListMenu, TrackList, NowPlaying, AppBarTop, SongList } = require("./spotify-components");
const templateCss = fs.readFileSync(Path.resolve(__dirname, "template.css"));
const axios = require("axios");
const API_DIR = "https://api.spotify.com/v1";
const router = express.Router();
const client_id = process.env.spotify_client_id;
const client_secret = process.env.spotify_secret;
const redirect_uri = "https://www.grepawk.com/spotify";
const loginUrl = "https://accounts.spotify.com/authorize?" +
  require("querystring").stringify({
    response_type: "code",
    client_id: client_id,
    scope: [
      "user-read-email",
      "user-read-playback-state",
      "user-modify-playback-state",
      "user-read-currently-playing",
      "streaming",
      "app-remote-control",
      "user-library-read",
      "playlist-modify-private",
    ],
    redirect_uri: redirect_uri,
    state: 42
  });

var stateKey = "spotify_auth_state";
const _sdk = (access_token, _refresh = "") => {
  let authToken = access_token,
    refresh = _refresh;
  const fetchAPI = (uri, method = "GET") => {
    console.log(uri);
    return axios
      .get(API_DIR + uri, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + authToken,
        },
      })
      .then((response) => response.data);
    //console.log(response.data));// && return response.data)
  };

  const fetchAPIPut = (uri, body) =>
    axios(API_DIR + uri, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    }).catch((err) => console.error(err));
  return {
    fetchAPIPut,
    fetchAPI,
  };
};


router.get("/", async function (req, res) {
  const nodeEvents = [];
  nodeEvents.push(['ssr init', new Date()]);
  const accessToken = req.query.access_token
  if (req.query.access_token) {

  } else if (req.query.code) {
    const curll = `curl 'https://accounts.spotify.com/api/token'\
    -H 'Authorization: Basic ${Buffer.from(client_id + ":" + client_secret).toString("base64")}'\
    -H 'Content-Type: application/json'
    -d 'code=${req.query.code}&grant_type=authorization_code'`;
    const output = execSync(curll);
    console.log(output, curll);
  }

  if (req.query.login) {
    res.redirect(loginUrl);
    return;
  }
  res.write(`
    <html>
    <head>
        <title>Spotify Premium Player</title>
        <script>
          window.loadEvents=["init js", new Date()];
         </script>
    </head>
    <body>
<style>${fs.readFileSync(Path.resolve(__dirname, "mui.min.css"))} ${templateCss}</style>
<div id=container>
    <div class=sidenav id='playlist'>`);

  if (!accessToken) {
    res.end(`
    <button> <a href='${loginUrl}'>Login</a></button>
    </div></div></body></html>`)
    return;
  }
  const sdk = _sdk(accessToken);

  const playlists = await sdk.fetchAPI("/me/playlists");
  const rcstream = ReactDOMServer.renderToNodeStream(
    React.createElement(PlayListMenu, { playlists: [].concat(playlists && playlists.items) })
  );
  rcstream.pipe(res);
  rcstream.on("end", function () {
    res.write("</div>");
  });

  const tracklist = await sdk.fetchAPI("/playlists/" + playlists.items[0].id + "/tracks");
  console.log(tracklist);
  const tracksout = ReactDOMServer.renderToNodeStream(SongList, {
    songs: tracklist,
    songId: tracklist[0].track.id,
    songPlaying: null
  }, []);
  tracksout.pipe(res);
  tracksout.on("end", () => {
    res.end("</div></div></body></html>")
  });
});
// res.end(JSON.stringify(playlists.items)



module.exports = router;
