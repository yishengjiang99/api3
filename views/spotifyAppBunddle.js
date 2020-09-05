import React from 'react';
import ReactDOM from 'react-dom';

const SideNav = ({ children }) => {
    <div className='sidenav'>
        {children}
    </div>
}
export const PlayListMenu = ({ playlists }) => (
    <div>
        <ul>
            {
                playlists.map(playlist => <li><a href={`/spotify/list/${playlist.id}`}>{playlist.name}</a></li>)
            }
        </ul>
    </div>
)

export const TrackRow = ({ item }) => {
    const _item = item.track || item;
    console.log("======", _item)
    const artist = _item.artists.map(a => a.name).join(", ");

    const track = {
        imgURL: _item.album.images[0].url,
        name: _item.name,
        artist: artist,
        trackID: _item.id
    };
    console.log('trackrowwwww', track)
    return (<li>
        <div class="mui--text-light mui--text-title">{track.name}</div>

        <button class="mui-btn mui-btn--primary mui-btn--fab">+</button>
    </li>);
}


export function NowPlaying({ item }) {
    console.log(item);
    const _item = item.track || item;

    const track = {
        imgURL: _item.album.images[0].url,
        name: _item.name,
        artist: _item.artists.map(a => a.name).toString(),
        trackID: _item.id
    };
    return (
        <div className="nowplaying d-flex justify-content-center">
            <div className='card'>
                <img className='song-thumbnail' width={300} height={300} src={track.imgURL} />
                <div className="container">
                    <h4 className='song-name'>{track.name}</h4>
                    <div className="mui-divider"></div>
                    <p className='artist-name'>{track.artistName}</p>
                </div>
            </div>
        </div>
    )
}
export const AppBar = ({ onSearch, leftButton, rightButton, searchResultItems }) => {
    <React.Fragment>
        <div class="mui-appbar">
            <SearchBar onInput={} />
            <span id="welcome">{rightButton}</span>
        </div>
        <div class='search-result'>
            <ListView list={searchResultItem} />
        </div>
    </React.Fragment>
}
export const SpotifyFooter = () => (
    <div className="footer">
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
    </div>);


export const TrackList = ({ trackList }) =>
    <div className='trackList'>
        <ul>
            {trackList.map(trackItem => <TrackRow item={trackItem} />)}
            <TrackRow item={trackList[0]} />
            <TrackRow item={trackList[1]} />

        </ul>
    </div>

export const App = ({ playlists }) => {
    <div id='container'>
        <AppBar></AppBar>
        <SideNav>
            <PlayListMenu playlists={playlists}>
            </PlayListMenu>
            <NowPlaying>

            </NowPlaying>
            <TrackList>

            </TrackList>
        </SideNav>
    </div>
}
