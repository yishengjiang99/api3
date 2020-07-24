export class Peer {
  constructor(myUdid, signald, stdout) {
    this.signald = signald;
    this.udid = myUdid;
    this.peers = new Map();
    this.tracks = [];
    const toSignal = (json) => signald.send(JSON.stringify(json));
    signald.onmessage = async (evt) => {
      stdout(evt.data);
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

  joinChannel(name) {
    this.signald.send(
      JSON.stringify({
        cmd: "join_channel",
        channel: name,
        tracks: this.tracks.map((t) => t.id),
      })
    );
  }
  renderPeerView(container) {
    const el = react_1.default.createElement(
      "div",
      {},
      Reflect.ownKeys(this.pc).map((prop, idx) => {
        react_1.default.createElement("div", {}, [
          prop.toString() + ":" + Reflect.get(this.pc, prop),
        ]);
      })
    );
    react_dom_1.render(el, container);
  }
}
