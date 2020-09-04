import React, { useState, useEffect } from 'react';

export default function useEQ() {
    const [ctx, setCtx] = useState();
    const [processor, setProcessor] = useState({
        loaded: false,
        node: null,
        inputSPL: null,
        outputSPL: null,
        responseBand: []
    });

    useEffect(() => {
        if (window && !ctx) {
            setCtx(new AudioContext());
        }
    }, [window, ctx]);

    useEffect(() => {
        if (ctx && ctx.audioWorklet && !processor.loaded) {
            ctx.audioWorklet.addModule("./audacity-eq-processor.js").then(() => {
                const node = new AudioWorkletNode(ctx, "audacity-eq-processor");
                setProcessor(state => ({
                    ...state,
                    loaded: true,
                    node: node
                }));
            })
        }
    }, [ctx, processor.loaded])

    useEffect(() => {
        if (processor.node && processor.node.port) {
            node.port.onmessage = ({ data }) => {
                if (data.gainupdates_processed) {
                    setProcessor(state => ({
                        ...state,
                        responseBand: data.gainupdates_processed
                    }))
                }
                else if (data.inputSPL) {
                    setProcessor(state => ({
                        ...state,
                        inputSPL: data.inputSPL
                    }))
                }
                else if (data.outputSPL) {
                    setProcessor(state => ({
                        ...state,
                        outputSPL: data.outputSPL
                    }))
                }
            }
        }
    }, [processor.node])

    function updateGains([{ index, gain }]) {
        process.node.port.postMessage({
            gainUpdates: [{
                index, value: gain
            }]
        })
    }

    function updateGain(index, gain) {
        process.node.port.postMessage({
            gainUpdate: {
                index, value: gain
            }
        })
    }
    return [processor, { updateGains, updateGain }];
}