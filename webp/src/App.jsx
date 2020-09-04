import React from 'react';
import ReactDOM from 'react-dom';
import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';

const names = "ABCD".split("");
const $ = React.createElement;
function Slider({ freq, _db }) {
    const [db, setDb] = React.useState(_db);
    const wrapStyle = {
        display: "inline-block",
        width: 20,
        height: 50,
        padding: 0,
    };
    const sstyle = {
        width: 79,
        height: 59,
        margin: 30,
        transformOrigin: "0 40",
        transform: "rotate(-90deg)",
    };

    return /*#__PURE__*/ $(
        "span",
        {
            className: "sliderWrapper",
            style: wrapStyle,
        },
        [
            $("input", {
                style: sstyle,
                type: "range",
                value: db,
                min: "0",
                max: "20",
                onInput: (e) => setDb(e.target.value),
            }),
            db,
        ]
    );
}



ReactDOM.render(
    $(
        "div",
        {
            className: "App",
            style: { display: "grid", gridTemplateColumns: "1fr 1fr" },
        },
        [0, 1, 2, 3].map((idx) => {
            return $("div", { className: "panel" }, [
                $("h3", {}, "Preset " + names[idx]),

                ...Object.keys(presets[idx])
                    .filter((k) => k.startsWith("BEQ"))
                    .map((key, frqidx) =>
                        $(Slider, { freq: frqidx, db: presets[idx][key] }, [])
                    ),
            ]);
        })
    ), document.querySelector("body"));