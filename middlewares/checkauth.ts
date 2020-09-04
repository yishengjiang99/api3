import * as Express from 'express';
import * as querystring from 'querystring';
import * as request from 'request';
import * as session from 'express-session';
import axios from 'axios';

export const sdk = (props) => {
  const API_DIR = "https://api.spotify.com/v1";
  const { access_token, refresh_token, exiry } = props

  const fetchAPI = (uri, method = "GET") => {
    console.log(uri);
    return axios
      .get(API_DIR + uri, {
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + access_token,
        },
      })
      .then((response) => response.data).catch(e => console.error(e));
    //console.log(response.data));// && return response.data)
  };

  const fetchAPIPut = (uri, body) =>
    axios(API_DIR + uri, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      data: JSON.stringify(body)
    }).catch((err) => console.error(err));
  return {
    fetchAPIPut,
    fetchAPI,
  };
};

const client_id = process.env.spotify_client_id;
const client_secret = process.env.spotify_secret;
const redirect_uri = "https://www.grepawk.com/spotify";
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
const loginURL = "https://accounts.spotify.com/authorize?" +
  querystring.stringify({
    response_type: "code",
    client_id: client_id,
    scope: scopes.join(","),
    redirect_uri: redirect_uri
  });


export function checkAuth(req: Express.Request, res: Express.Response, next: Express.NextFunction) {
  if (req.query.access_token) {
    req.session.auth = {
      access_token: req.query.access_token,
      refresh: req.query?.refresh_token,
      expiry: req.query?.expiry
    }
    next();
  } else if (req.session.auth) {
    if (req.session.auth.access_token && req.session.auth.expiry > (new Date()).getUTCMilliseconds()) {
      next();
    } else {
      req.session.auth = null;
      res.redirect(loginURL);
    }
  }
  else if (req.query.code) {
    authAudRedirect(req, res);
  } else {
    // res.redirect("/login")
    res.redirect(loginURL);
  }
}
export function instantiateSDK(req, res, next) {
  req.session.sdk = sdk(req.session.auth);
  next();
}
export function refreshToken(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: "https://accounts.spotify.com/api/token",
    headers: {
      Authorization:
        "Basic " +
        Buffer.from(client_id + ":" + client_secret).toString("base64"),
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
}

const authAudRedirect = (req, res) => {
  var code = req.query.code || null;
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
      res.redirect("/spotify?" + uri);
    }
    else {
      res.end('540')
    }
  });

}