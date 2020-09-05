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

function hello() {
    const [db, setDB] = useState(3);
    return /*#__PURE__*/ React.createElement(
        "input",
        {
            type: "range",
            value: db,
            onInput: (e) => {
                setDB(e.target.value);
            },
        },
        "Hello world!"
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
                sliderGroup
            ]);
        })
    ));