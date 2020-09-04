import React from "react";

export default function NowPlayingDiv({ imgURL, name, artistName }) {
    return (
        <div className='nowplaying' className="nowPlaying d-flex justify-content-center">
            <div className='card'>
                <img className='song-thumbnail' width={300} height={300} src={imgURL} />
                <div className="container">
                    <h4 className='song-name'>{name}</h4>
                    <div className="mui-divider"></div>
                    <p className='artist-name'>{artistName}</p>
                </div>
            </div>
        </div>
    )
}