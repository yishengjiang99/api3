import Axios, { AxiosResponse, AxiosError } from "axios";
import { Writable } from "stream";
import { stringify } from "querystring";

const API_DIR = "https://api.spotify.com/v1";
const redirect_uri = "https://www.grepawk.com/spotify";

const client_id = process.env.spotify_client_id;
const client_secret = process.env.spotify_secret;

declare interface ISdkProp {
  accessToken?: string;
  code?: string;
  stderr?: Writable;
  stdout?: Writable;
}

export const loginUrl = (jwt) =>
  `https://accounts.spotify.com/authorize?${stringify({
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
    ].join(""),
    redirect_uri: redirect_uri,
    state: jwt,
  })}`;

export const SDK = (props?: ISdkProp) => {
  const { code, accessToken, stdout, stderr } = props || {};
  const fetchAPI = (uri) => {
    console.log(uri);
    return Axios.get(API_DIR + uri, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
    })
      .then((response: AxiosResponse) => response.data)
      .catch((e: AxiosError) => {
        if (stderr) {
          stderr.end(e.message);
        }
      });
  };

  const fetchAPIPut = (uri, body) =>
    Axios.put(
      API_DIR + uri,
      { body: JSON.stringify(body) },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    ).catch((err) => console.error(err));
  return {
    accessToken,
    fetchAPIPut,
    fetchAPI,
  };
};

export const authTokenFromCode = (code: string) => {
  Axios.post(
    "https://accounts.spotify.com/api/token",
    {
      code: code,
      grant_type: "authorization_code",
    },
    {
      headers: {
        Accept: "applicatoin/json",
        "Content-Type": "form/multipart",
        Authorization: `Basic ${Buffer.from(
          client_id + ":" + client_secret
        ).toString("base64")}`,
      },
    }
  ).then((resp) => {
    return resp?.data?.accessToken;
  });
};
