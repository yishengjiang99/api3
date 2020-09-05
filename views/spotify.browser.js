function loadSpotifyPremium(token) {
    if (window.webplayer &&
        window.spotifyDeviceId) return window.webplayer; return new Promise((resolve,
            reject) => {
            window.onSpotifyWebPlaybackSDKReady = () => {
                log("loading");
                window.webplayer = new Spotify.Player({
                    name: "Wgr", getOAuthToken: (cb) =>
                        cb(token),
                }); window.webplayer.addListener("initialization_error", ({ message
                }) => { log(message); reject(new Error("initialization_error " + message)); });
                window.webplayer.addListener("not_ready", (e) => { log("not read"); });
                window.webplayer.addListener("ready", (e) => {
                    window.spotifyDeviceId =
                        e.device_id; document.getElementById("play").style.display = "block";
                    window.webplayer.addListener("initialization_error", (e) => reject(e));
                    window.webplayer.addListener("account_error", (e) => log("account not prenium")
                        && reject(e)); window.webplayer.connect(); controls.play.onclick = () =>
                            window.webplayer.resume(); controls.stop.onclick = () =>
                                window.webplayer.pause(); controls.ff.onclick = () =>
                                    window.webplayer.nextTrack(); controls.rewind.onclick = () =>
                                        window.webplayer.previousTrack(); resolve();
                });
                window.webplayer.addListener("player_state_changed", (e) => {
                    console.log(e); if
                        (e.track_window.current_track) {
                        currentTrackId =
                            e.track_window.current_track.id;
                        renderNowPlaying(e.track_window.current_track.album.images[0].url, [],
                            e.track_window.current_track.name, e.track_window.current_track.artists.map((a)
                                => a.name).join(", "));
                    } if (e.track_window.next_tracks) {
                        $("#nexttracks").innerHTML = e.track_window.next_tracks.map(track => "
                            < li > " + track.name + "</li >
                        " ).join(""); } let timer; if (e.paused === false) { if (timer)
cancelAnimationFrame(timer); var startedAt = e.position; var start = new Date();
                        controls.play.style.display = "none"; controls.stop.style.display = "block";
                        const positionUI = $("#player .position"); const durationUI = $("#player
                            .duration"); const progress = document.getElementById("progress");
durationUI.innerHTML = ms_to_mm_ss(e.duration); progress.max = e.duration;
                        function updateTimer() {
                            var elapsed = new Date().getTime() - start.getTime();
                            positionUI.innerHTML = ms_to_mm_ss(e.position + elapsed); var played = startedAt
                                + elapsed; progress.value = played; timer = requestAnimationFrame(updateTimer);
                        } updateTimer();
                    } else {
                        if (timer !== null) {
                            cancelAnimationFrame(timer);
                            timer = null;
                        } controls.play.style.display = "block";
                        controls.stop.style.display = "none";
                    }
                }); window.webplayer.connect();
            }; var
                script = document.createElement("script"); script.type = "text/javascript";
            script.src = "https://sdk.scdn.co/spotify-player.js";
            document.getElementsByTagName("head")[0].appendChild(script);
        });
}
function queueTracks(tracks) {
    fetchAPIPut("/me/player/play?device_id=" +
        window.spotifyDeviceId, {
        uris: tracks.map(item => "spotify:track:" +
            item.track.id),
    }).then((resp) => {
        log(resp); //"loaded") }) .catch((e) => {
        log(e);
    });
}

const playTrack = async function (trackId) {
    await
        loadSpotifyPremium(authToken); fetchAPIPut("/me/player/play?device_id=" +
            window.spotifyDeviceId, { uris: ["spotify:track:" + trackId], }).then((resp) => {
                log(resp); //"loaded") }) .catch((e) => { log(e); }); }; export const
                queueTrack = async function (trackId) {
                    await loadSpotifyPremium(authToken);
                    fetchAPI("/me/player/queue?uri=spotify:track:" + trackId, "POST");
                };
                Number.prototype.lpad = function (n, str) {
                    return ((this < 0 ? "-" : "") +
                        Array(n - String(Math.abs(this)).length + 1).join(str || "0") + Math.abs(this)
                    );
                }; function ms_to_mm_ss(ms) {
                    const secondst = ms / 1000; const minutes =
                        ~~(secondst / 60); const seconds = Math.floor(secondst - minutes * 60); return
                    `${minutes < 10 ? "0" + minutes : minutes} : ${seconds < 10 ? "0" + seconds :
                        seconds}`;
                } function log(msg) {
                    if (typeof msg === "object") {
                        log(JSON.stringify(msg, null, "\t")); return;
                    }
                    document.getElementById("debug").innerHTML = msg;
                }
