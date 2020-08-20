"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SongList = exports.NowPlaying = exports.AppBarTop = exports.TrackList = exports.PlayListMenu = void 0;
const react_1 = require("react");
require("./SongList.css");
exports.PlayListMenu = ({ playlists }) => {
    return (<>
            {playlists.map(p => <p>{JSON.stringify(p)}</p>)}
        </>);
};
exports.TrackList = ({ trackName, trackId }) => {
    <div>{trackName}{trackId}</div>;
};
exports.AppBarTop = ({ accessToken, loginUrl }) => {
    return (<div class="mui-appbar">
            app
        </div>);
};
exports.NowPlaying = () => <div>Now Playing</div>;
exports.SongList = ({ songs }) => {
    function msToMinutesAndSeconds(ms) {
        const minutes = Math.floor(ms / 60000);
        const seconds = ((ms % 60000) / 1000).toFixed(0);
        return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
    }
    function renderSongs() {
        return songs.map((song, i) => {
            const buttonClass = song.track.id === props.songId && !props.songPaused
                ? "fa-pause-circle-o"
                : "fa-play-circle-o";
            return (<li className={song.track.id === props.songId
                ? "active user-song-item"
                : "user-song-item"} key={i}>
                    <div onClick={() => {
                song.track.id === props.songId &&
                    props.songPlaying &&
                    props.songPaused
                    ? props.resumeSong()
                    : props.songPlaying &&
                        !props.songPaused &&
                        song.track.id === props.songId
                        ? props.pauseSong()
                        : props.audioControl(song);
            }} className="play-song">
                        <i className={`fa ${buttonClass} play-btn`} aria-hidden="true"/>
                    </div>

                    {props.viewType !== "songs" && (<p className="add-song" onClick={() => {
                props.addSongToLibrary(props.token, song.track.id);
            }}>
                            {props.songAddedId === song.track.id ? (<i className="fa fa-check add-song" aria-hidden="true"/>) : (<i className="fa fa-plus add-song" aria-hidden="true"/>)}
                        </p>)}

                    {props.viewType === "songs" && (<p className="add-song">
                            <i className="fa fa-check" aria-hidden="true"/>
                        </p>)}

                    <div className="song-title">
                        <p>{song.track.name}</p>
                    </div>

                    <div className="song-artist">
                        <p>{song.track.artists[0].name}</p>
                    </div>

                    <div className="song-album">
                        <p>{song.track.album.name}</p>
                    </div>

                    <div className="song-added">
                        <p>{moment(song.added_at).format("YYYY-MM-DD")}</p>
                    </div>

                    <div className="song-length">
                        <p>{msToMinutesAndSeconds(song.track.duration_ms)}</p>
                    </div>
                </li>);
        });
    }
    return (<div>
            <div className="song-header-container">
                <div className="song-title-header">
                    <p>Title</p>
                </div>
                <div className="song-artist-header">
                    <p>Artist</p>
                </div>
                <div className="song-album-header">
                    <p>Album</p>
                </div>
                <div className="song-added-header">
                    <i className="fa fa-calendar-plus-o" aria-hidden="true"/>
                </div>
                <div className="song-length-header">
                    <p>
                        <i className="fa fa-clock-o" aria-hidden="true"/>
                    </p>
                </div>
            </div>
            {songs &&
        renderSongs()}
        </div>);
    exports.SongList.propTypes = {
        viewType: PropTypes.string,
        token: PropTypes.string,
        songAddedId: PropTypes.string,
        songId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        songs: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
        fetchSongsError: PropTypes.bool,
        fetchSongsPending: PropTypes.bool,
        fetchPlaylistSongsPending: PropTypes.bool,
        fetchSongs: PropTypes.func,
        audioControl: PropTypes.func,
        songPaused: PropTypes.bool,
        songPlaying: PropTypes.bool,
        resumeSong: PropTypes.func,
        pauseSong: PropTypes.func,
        addSongToLibrary: PropTypes.func,
    };
    export default exports.SongList;
};
//# sourceMappingURL=spotify-components.js.map