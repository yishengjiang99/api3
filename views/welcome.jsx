import React from "react";

export default function ({ host, access_token }) {
  return (
    <>
      <h1>welcome</h1>
      {!access_token ? (
        <button>
          <a href={"/spotify/login"}>Login with Spotify Premium</a>
        </button>
      ) : null}
    </>
  );
}
