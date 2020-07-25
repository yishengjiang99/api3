import { Peer } from "./peer.js";
import { getMicrophone, getCam, random_noise } from "./audio_source.js";
const btnOpenRoom = document.getElementsByTagName("button")[0];
const console = document.getElementById("console");
const shareVideo = document.getElementById("shareVideo");
const shareAudio = document.getElementById("shareAudio");
const log = (txt) =>
  (typeof txt === "object" && log(JSON.stringify(txt))) ||
  (console.innerHTML += "<br>" + txt);
const logError = (txt) => log("<font color=red>" + txt + "</font>");
const myAudio = document.getElementsByTagName("audio")[0];
const myVideo = document.getElementsByTagName("video")[0];
const theirAudio = document.getElementsByTagName("audio")[0];
const theirVideo = document.getElementsByTagName("video")[0];
const usernameInput = document.getElementById("usernameInput");
const channelInput = document.getElementById("channelInput");

const udid = localStorage.getItem("udid") || "Yisheng";
const signal = new WebSocket("wss://localhost:443/signal?udid=" + udid);

let peer;
const joinServer = function (udid, previewVideo) {
  return new Promise((resolve, reject) => {
    log("joining as " + udid);
    const signal = new WebSocket("wss://localhost:443/signal?udid=" + udid);
    signal.onmessage = ({ data }) => {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = data;
      }
      if (data.udid) {
        localStorage.setItem("udid", data.udid);
      }
      log(data);
      peer = new Peer(data.udid, signal, log, previewVideo, theirVideo);
      peer.joinChannel(channelInput.value);
      resolve();
    };
  });
};

btnOpenRoom.onclick = async () => {
  try {
    await joinServer(userNameInput.value, myVideo);
    await joinServer(userNameInput.value + "mirror", myVideo2);
  } catch (e) {
    logError(e.message);
  }
};
setInterval(() => {
  if (peer) {
    peer.renderPeerView(peerView);
  }
}, 1000);

const toSignal = (json) => signal.send(JSON.stringify(json));
