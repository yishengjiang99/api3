import React, {useState} from 'react';
import {makeStyles} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/core/Slider';

const useStyles = makeStyles((theme) => ({
    root: {
        width: 50, height: 150
    },
    margin: {
        height: theme.spacing(3),
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(16, 1fr)"
    }
}));

const marks = [0, 4, 8, 12, 16, 20].map(n => ({
    value: n,
    label: n + " +dB"
}))

function valuetext(value) {
    return `${value} dB`;
}

export function VerticalSlider({value}) {
    const classes = useStyles();
    const [v, setV] = useState(value || 0);
    return (
        <div className={classes.root}>
            <Typography id="discrete-slider-always" gutterBottom>
                {v} dB SPL gain
            </Typography>
            <Slider
                height={300}
                orientation="vertical"
                defaultValue={value}
                max={20}
                min={-2}
                getAriaValueText={valuetext}
                aria-labelledby="discrete-slider-always"
                step={1}
                value={v}
                onChange={(evt, v) => setV(v)}
                marks={marks}
                valueLabelDisplay="auto"
            />
        </div>
    );
}

export function SliderGroup({beq}) {

    const classes = useStyles();

    return (
        <div className={classes.grid}>
            {Object.values(beq).map((b, idx) =>
                <VerticalSlider key={idx} value={b}
                />)}
        </div>
    )
}