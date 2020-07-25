import { peerRTCConfig } from "./rtc.config.js";
import { getMicrophone, getCam, random_noise } from "./audio_source.js";

export class Peer {
  constructor(myUdid, signald, stdout, myVideo, remoteVideo) {
    this.signald = signald;
    this.udid = myUdid;
    this.peers = {};
    this.peerStreams = {}; // new Map();

    this.tracks = [];
    this.remoteTrakcs = [];
    this.stdout = stdout;
    this.remoteVideo = remoteVideo;
    const toSignal = (json) => signald.send(JSON.stringify(json));
    signald.onmessage = async (evt) => {
      const data = JSON.parse(evt.data);
      stdout(evt.data.type);
      const from_udid = data.client_udid || data.from_udid;
      let pc = this.getOrInitiatePeer(from_udid);
      switch (data.type) {
        case "user_joined":
          this.offerSequence(data.client_udid);
          break;
        case "offer":
          await pc
            .setRemoteDescription(new RTCSessionDescription(data.payload))
            .then(function () {
              return navigator.mediaDevices.getUserMedia({
                audio: true, // We want an audio track
                video: true, // ...and we want a video track
              });
            })
            .then(function (stream) {
              debugger;
              myVideo.srcObject = stream;
              stream.getTracks().forEach((track) => pc.addTrack(track, stream));
            })
            .then(() => {
              return pc.createAnswer();
            })
            .then((answer) => {
              pc.setLocalDescription(answer);
              return answer;
            })
            .then((answer) => {
              this.signald.send(
                JSON.stringify({
                  to_udid: from_udid,
                  type: "answer",
                  payload: answer,
                })
              );
            });
          break;
        case "answer":
          await pc.setRemoteDescription(data.payload);

          break;
        case "candidate":
          pc.addIceCandidate(data.payload);
          stdout("adding remote candidate");
          break;
      }
      if (!data.from_udid) {
        console.log("handle !udid");
        return;
      }
    };
  }

  async offerSequence(peerUdid) {
    let pc = this.getOrInitiatePeer(peerUdid);
    // this.tracks.forEach((t) => pc.addTrack(t));
    let offer = await pc.createOffer();
    await pc.setLocalDescription(new RTCSessionDescription(offer));
    this.signald.send(
      JSON.stringify({
        to_udid: peerUdid,
        type: "offer",
        from_udid: this.udid,
        payload: offer,
      })
    );
  }

  addStream(stream) {
    stream.getTracks().forEach((t) => this.tracks.push(t));
    // this.signald.send(
    //   JSON.stringify({
    //     udid: this.udid,
    //     cmd: "tracks",
    //   })
    // );
  }
  getOrInitiatePeer(peerUdid) {
    if (!this.peers[peerUdid]) {
      window.peers = this.peers;
      this.peers[peerUdid] = new RTCPeerConnection(peerRTCConfig);
      this.peers[peerUdid].onicecandidate = ({ candidate }) => {
        if (!candidate) {
          this.stdout("ice gather done");
          return;
        }
        this.stdout("have ice cans");

        // this.peers[peerUdid].addIceCandidate(candidate);
        this.signald.send(
          JSON.stringify({
            to_udid: peerUdid,
            from_udid: this.udid,
            type: "candidate",
            payload: candidate,
          })
        );
      };
      this.peers[peerUdid].addEventListener("statechange", (e) => {
        this.stdout("state ", this.state);
      });
      this.peers[peerUdid].ontrack = ({ track }) => {
        this.remoteTrakcs.push(track);
        this.remoteVideo.srcObject = new MediaStream(this.remoteTrakcs);
        this.remoteVideo.playsline = true;
        this.remoteVideo.autoplay = true;
      };
      this.peers[peerUdid].addEventListener("negotiationneeded", (e) => {
        this.stdout("onnegotiationneeded");
        this.offerSequence(peerUdid);
      });
    }
    return this.peers[peerUdid];
  }

  joinChannel(name) {
    this.signald.send(
      JSON.stringify({
        type: "channel",
        channel: name,
        udid: this.udid,
        tracks: this.tracks.map((t) => t.id),
      })
    );
  }
  renderPeerView(container) {
    container.innerHTML = "";
    Object.values(this.peers).forEach((pc) => {
      const el = document.createElement(
        "div",
        {},
        Reflect.ownKeys(pc).map((prop, idx) => {
          document.createElement("div", {}, [
            prop.toString() + ":" + Reflect.get(pc, prop),
          ]);
        })
      );
      container.append(el); //.render(el, container);
    });
  }
}
