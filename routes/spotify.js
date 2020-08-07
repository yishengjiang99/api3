var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library
var querystring = require("querystring");
var cookieParser = require("cookie-parser");
const ReactDom = require("react-dom");

const axios = require("axios");
const API_DIR = "https://api.spotify.com/v1";
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

const app = express();
var router = express.Router();

var client_id = process.env.spotify_client_id;
var client_secret = process.env.spotify_secret;
var redirect_uri = "https://www.grepawk.com/spotify";

var stateKey = "spotify_auth_state";

router.get("/login", function (req, res) {
  var state ='13'
  res.cookie(stateKey, state);
  res.cookie("jshost", req.query.jshost || "");

  const scopes = [
    "user-read-email",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming",
    "app-remote-control",
    "user-library-read",
    "playlist-modify-private",
  ];
  // your routerlication requests authorization
  var scope = req.query.scope || scopes.join(",");

  res.redirect(
    "https://accounts.spotify.com/authorize?" +
      querystring.stringify({
        response_type: "code",
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: req.query.jshost,
      })
  );
});

router.get("/", function (req, res) {
  // your application requests refresh and access tokens
  // after checking the state parameter
  if (req.query.access_token) {
    SSRUI(req, res);
    return;
  } else if (req.query.code) {
    authAudRedirect(req, res);
    return;
  } else {
    res.render("welcome", { layout: "layout.html" }, (err, html) => {
      console.error(err);
      res.write(html); //"html")
    });
  }
});

const SSRUI = async function (req, res) {
  try {
    res.render("spotify_header")
    const sdk = _sdk(req.query.access_token);
    res.render(
      "welcome",
      {
        layout: "spotifylayout.html", 
        headerJs: "spotofy_window.js",
      access_token: req.query.access_token 
    },
      (err, html) => {
        err && console.error(err);
        res.write(html)
      }
    );

    const playlists = await sdk.fetchAPI("/me/playlists");
    if (!playlists.items || !playlists.items[0]) {
      return res.end("no play list found");
    }
    res.render(
      "listview",
      {
        list: playlists.items,
        onClick: console.log,
      },
      (err, html) => {
        err && console.error(err);
        console.log(html);
        res.write(html || ""); //"html")
        sdk
          .fetchAPI("/playlists/" + playlists.items[0].id + "/tracks")
          .then((tracks) => {
            console.log(tracks);
            res.render(
              "tracklist",
              {
                tracks: tracks.items,
                onClick: console.log,
              },
              (err, html) => {
                err && console.error(err);
                res.write(html); //"html")
                res.end(`  </main>
            <footer>          
          footer
            </footer></body></html>
          `);
              }
            );
          });
      }
    );

    // res.end(JSON.stringify(playlists.items))
  } catch (e) {
    console.log(e);
    res.end(e.message);
  }
  return;
};

const authAudRedirect = (req, res) => {
  var code = req.query.code || null;
  var jshost = req.query.state || null;

  if (false) {
    res.redirect(
      "/#" +
        querystring.stringify({
          error: "state_mismatch",
        })
    );
  } else {
    var authOptions = {
      url: "https://accounts.spotify.com/api/token",
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: "authorization_code",
      },
      headers: {
        Authorization:
          "Basic " +
          new Buffer(client_id + ":" + client_secret).toString("base64"),
      },
      json: true,
    };

    request.post(authOptions, function (error, response, body) {
      if (!error && response.statusCode === 200) {
        var { access_token, refresh_token, expires_in } = body;
        const uri = querystring.stringify({
          access_token,
          refresh_token,
          expiry: new Date().getTime() + expires_in * 1000,
        });

        if (jshost) {
          res.setHeader("content-type", "text/html");
          res.end(
            `<html>
            <head>
            <script>
            window.location.href='${jshost}#${uri}'
            </script></head></html>`
          );
        } else {
          res.redirect("/spotify?" + uri);
        }
        // we can also pass the token to the browser to make requests from there
      } else {
        res.redirect(
          "/#" +
            querystring.stringify({
              error: "invalid_token",
            })
        );
      }
    });
  }
};

router.get("/refresh_token", function (req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        new Buffer(client_id + ":" + client_secret).toString("base64"),
    },
    form: {
      grant_type: "refresh_token",
      refresh_token: refresh_token,
    },
    json: true,
  };

  request.post(authOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        access_token: access_token,
      });
    }
  });
});
module.exports = router;
