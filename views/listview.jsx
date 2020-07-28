import React from "react";

export default function ({ list, onClick }) {
    return (
        <ul>
            {list.map((playlist, idx) => {
                return React.createElement(
                    "li",
                    {
                        key: playlist.id || idx,
                        onClick: () => getTracks(token, playlist, "tracklist"),
                    },
                    playlist.name
                );
            })
            }
        </ul>
    );
}
