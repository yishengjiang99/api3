import React from "react";

export default function ({ host, t }) {
  const login = function () {
    window.location.href = "/spotify/login";
  };
  return (
    <>
      <h1>welcome</h1>
      <button>
        {t}
        <a href={"/spotify/login?jshost=" + host}>Login with Spotify Premium</a>
      </button>
    </>
  );
}
