import * as React from 'react';
import * as ReactDOM from 'react-dom';

export const SideNav = ({ children }) => {
    <div className='sidenav'>
        {children}
    </div>
}
export const PlayListMenu = ({ playlists }) => (
    <div className='sidenav'>
        <ul>
            {
                playlists.map(playlist => <li><a href={`/spotify/list/${playlist.id}`}>{playlist.name}</a></li>)
            }
        </ul>
    </div>
)

export const TrackRow = ({ track }) => {

    return (<li>
        <div className="mui--text-light mui--text-title">{track.name}</div>

        <button className="mui-btn">+</button>
    </li>);
}
export const ListView = ({ children }) => <ul>{children}</ul>

export function NowPlaying({ item }) {
    try {

        return (
            <div className="nowplaying d-flex justify-content-center">
                <div className='card'>
                    <img className='song-thumbnail' width={300} height={300} src={item.imgURL} />
                    <div className="container">
                        <h4 className='song-name'>{item.name}</h4>
                        <div className="mui-divider"></div>
                        <p className='artist-name'>{item.artist}</p>
                    </div>
                </div>
            </div>
        )
    } catch (e) {
        console.error(e);
        return null;
    }

}
const Button = (props) => <button className='mui-btn'>{props.text}</button>

export const AppBar = ({ loginUrl = "", onSearch, leftButton, rightButton, searchResultItems = [] }) =>
    <React.Fragment>
        <div className="mui-appbar">
            <a target='_blank' href={loginUrl}><Button text="Login"></Button></a>
        </div>
        <div className='search-result'>
            <ListView list={searchResultItems} />
        </div>
    </React.Fragment>

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
    <div className='main'>
        <ul>
            {trackList.map(trackItem => <TrackRow track={trackItem} />)}


        </ul>
    </div>

export const App = ({ nowPlaying, playlists, trackList, loginUrl }) => {
    <React.Fragment>
        <AppBar loginUrl={loginUrl}></AppBar>
        <SideNav>
            <NowPlaying item={nowPlaying}>

            </NowPlaying>

            <TrackList trackList={trackList}>

            </TrackList>
            <PlayListMenu playlists={playlists}>
            </PlayListMenu>

        </SideNav>
    </React.Fragment>
}
