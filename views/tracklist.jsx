import React from "react";
import ReactDOMServer from 'react-dom/server';
export default function ({ tracks, onClick }) {
    console.log(tracks[0].track.video_thumbnail)
    return (
        <ul>
            {tracks.map((track, idx) =>
                <li key={idx}>
                    {trackRow(track)}
                </li>
            )}
        </ul>
    );
}


const trackRow = (item) => {
    const h = React.createElement;
    return h("li", {}, [
        h("span", null, item.track.name),
        h("br"),
        h(
            "button",
            {
                onClick: () => playTrack(item.track.id),
            },
            "play"
        ),
        h(
            "button",
            {
                onClick: () => queueTrack(item.track.id),
            },
            "queue"
        ),
    ])

};
