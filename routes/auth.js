/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

var express = require("express"); // Express web server framework
var request = require("request"); // "Request" library
var cors = require("cors");
var querystring = require("querystring");
var cookieParser = require("cookie-parser");

const app = express();
var router = express.Router();

var client_id = process.env.spotify_client_id;
var client_secret = process.env.spotify_secret;
var redirect_uri = "https://dsp.grepawk.com/api/spotify/cb";

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function (length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0;i < length;i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = "spotify_auth_state";

router
    .use(express.static(__dirname + "/public"))
    .use(cors())
    .use(cookieParser());

router.get("/", (req, res) => {
    var state = req.query.jshost || "https://www.grepawk.com/spotify";

    const scopes = [
        "user-top-read",
        "user-read-email",
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "streaming",
        "app-remote-control",
        "user-library-read",
        "playlist-modify-private",
    ];
    res.redirect("https://accounts.spotify.com/authorize?" +
        querystring.stringify({
            response_type: "code",
            client_id: client_id,
            scope: scopes.join(","),
            redirect_uri: redirect_uri,
            state: state,
        }));
})

router.get("/login", function (req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    res.cookie("jshost", req.query.jshost || "");
    const scopes = [
        "user-read-playback-state",
        "user-modify-playback-state",
        "user-read-currently-playing",
        "streaming",
        "app-remote-control",
    ];
    // your routerlication requests authorization
    var scope = req.query.scope || scopes.join(",");

    res.redirect(
        "https://accounts.spotify.com/authorize?" +
        querystring.stringify({
            response_type: "code",
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri
        })
    );
});

router.get("/cb", function (req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code;

    var jshost = req.query.state || ""

    var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: "authorization_code",
        },
        headers: {
            Authorization:
                "Basic " + new Buffer(client_id + ":" + client_secret).toString("base64"),
        },
        json: true,
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var {access_token, refresh_token, expires_in} = body;
            if (jshost) {
                res.redirect(jshost + "?" + querystring.stringify({
                    access_token,
                    refresh_token,
                    expiry: new Date().getTime() + expires_in * 1000,
                }))
            } else {
                res.redirect(
                    "/playback.html#" +
                    querystring.stringify({
                        access_token,
                        refresh_token,
                        expiry: new Date().getTime() + expires_in * 1000,
                    })
                );
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

});

router.get("/refresh_token", function (req, res) {
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: "https://accounts.spotify.com/api/token",
        headers: {
            Authorization:
                "Basic " + Buffer.from(client_id + ":" + client_secret).toString("base64"),
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
