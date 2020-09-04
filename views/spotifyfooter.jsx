import React from 'react';

export function NowPlayingDiv({ imgURL, name, artistName }) {
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
export const SpotifyFooter = () => (<div className="footer">
    <div id="player" className="container song-player-container">

        <div className="sliderr">
            <span className='position'></span>
            <span><input type="range" id='progress' min={0} max={100}></input></span>
            <span className='duration'></span>
        </div>

        <div className="song-controls">
            <button id="rewind" className="rewind">
                <i className="fa fa-backward"> </i>
            </button>
            <button id="play" className="play-btn" >
                <i className="fa fa-play"> </i>
            </button>

            <button id="stop" className="pause-btn">
                <i className="fa fa-stop" aria-hidden="true"> </i>
            </button>


            <button id="forward" className="next-song" >
                <i className="fa fa-step-forward forward" aria-hidden="true"></i>
            </button>
        </div>
        <div id='nexttracks' >
        </div>
    </div>
</div >)