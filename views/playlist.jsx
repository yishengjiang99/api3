import React from "react";

export default function ({ playlists, t }) {

    return (
        <>
            {playlists.map(p => <p>{JSON.stringify(p)}</p>)}
        </>
    );
}
