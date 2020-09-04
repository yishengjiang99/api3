import { createElement as h } from 'react';
const playTrack = (id) => { };
const queueTrack = (id) => { }
export const PlatListMenu = ({ playlists }) =>
    h("ul",
        { style: { maxHeight: 300, 'overscrollY': 'scroll' } },
        playlists.items.map((playlist) => {
            return h(
                "li",
                {
                    key: playlist.id,
                },
                playlist.name
            );
        })
    );

export const TrackRow = ({ track }) =>
    h("li", {}, [
        h("span", null, track.name),
        h("br"),
        h(
            "button",
            {
                onClick: () => playTrack(track.id),
            },
            "play"
        ),
        h(
            "button",
            {
                onClick: () => queueTrack(track.id),
            },
            "queue"
        ),
    ]);
