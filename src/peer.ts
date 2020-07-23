import EventEmitter = require("events");
import { emit } from "process";
import React from "react";
import { render } from "react-dom";

export class Peer {
  pc: RTCPeerConnection;
  signald: WebSocket;
  localTracks: MediaStreamTrack[];
  udid: string;
  peers: Map<string, RTCPeerConnection>;
  constructor(myUdid: string, signald: WebSocket) {
    this.signald = signald;
    this.udid = myUdid;
    this.peers = new Map<string, RTCPeerConnection>();
    const toSignal = (json) => signald.send(JSON.stringify(json));
    signald.onmessage = async (evt) => {
      const data = JSON.parse(evt.data);
      if (!data.fromUdid) {
        console.log("handle !udid");
        return;
      }

      const pc = this.getOrInitiatePeer(data.from_udid);

      switch (data.cmd) {
        case "anwser":
          pc.setRemoteDescription(data.anwser);
          break;
        case "offer":
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(answer);
          toSignal({
            cmd: "answer",
            answer: answer,
            to_udid: data.from_udid,
          });
          break;
        case "candidate":
          const candidate = data.candidate;
          pc.addIceCandidate(candidate);
          break;
      }
    };
  }

  getOrInitiatePeer(peerUdid: string) {
    if (!this.peers[peerUdid]) {
      this.peers[peerUdid] = new RTCPeerConnection();
      this.peers[peerUdid].onicecandidate = ({ candidate }) => {
        this.signald.send(
          JSON.stringify({
            to_udid: peerUdid,
            cmd: "candidate",
            candidate: candidate,
          })
        );
      };
      this.peers[peerUdid].onTrack((track) => {
        console.log("got track");
      });
    }
    return this.peers[peerUdid];
  }
  joinChannel(name, withAudio) {}
  renderPeerView(container: HTMLElement): void {
    const el = React.createElement(
      "div",
      {},
      Reflect.ownKeys(this.pc).map((prop, idx) => {
        React.createElement("div", {}, [
          prop.toString() + ":" + Reflect.get(this.pc, prop),
        ]);
      })
    );
    render(el, container);
  }
}
