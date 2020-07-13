import * as linfs from "./linfs";
import * as WebSocket from "ws";
import { IncomingHttpHeaders, IncomingMessage } from "http";
import { Data } from "ws";
import db from "./db";
import { fopen } from "./azfs";
import { PassThrough } from "stream";

export class Channel {
  static loadChannel = async function (name) {
    const c = new Channel(name);
    return await c.load();
  };
  name: string;
  members: [];
  folder: string;
  info: any;
  tracks: any;
  server: Server;
  fds: linfs.FileDriver[];
  constructor(name) {
    this.name = name;
    this.folder = "ch_" + this.name;
  }
  load() {
    this.members = [];
    this.folder = "ch_" + this.name;
    linfs.getContainer(this.folder);
    //this.members = linfs.fopen(this.name + "/info").getContent();
    this.info = linfs.fopen(this.name + "/info").getContent();
    this.tracks = linfs.fopen((this.tracks = "tracks")).getContent();
    return this;
  }
  static listChannels() {
    return linfs.listContainers();
  }

  async lstParticipants(refresh = false) {
    if (refresh) {
      await this.load();
    }
    return this.members;
  }
  async sendToChannel(from: Participant, messaage: Data) {
    this.members.filter((m) => m != from).forEach((m) => Server.send(m, messaage));
  }
  async onPersonJoin(person) {
    //zfs.fopen(this.name + "/ch_members.json").append(person.toString());
    this.sendToChannel(person, person.displayName + " joined the channel");
    if (person.dsp) {
      this.sendToChannel(person, JSON.stringify({ sdp: person.sdp }));
    }
  }

  onPersonLeft(left) {}
  componseNote(from, message: JSON) {
    this.sendToChannel(from, message.toString());
    //azfs.fopen(this.name + "_ch_sore.json").append(Buffer.from(JSON.stringify(message)));
  }
}

export class Participant {
  udid: string;
  info: Record<string, any>;
  connection: WebSocket;
  currentChannel: Channel;
  sdp: string;
  requestHeaders: IncomingHttpHeaders;
  userName: string | string[];

  constructor(connection: WebSocket, requestHeaders: IncomingHttpHeaders) {
    console.log(requestHeaders);
    this.udid = generateUUID();
    this.connection = connection;
    this.userName = requestHeaders["set-cookie:g-username"] || "user 5";

    this.info = {
      userName: requestHeaders["set-cookie"],
      dsp: null,
      vlocation: null,
    };
    this.requestHeaders = requestHeaders;
  }
  joinChannel(channel: Channel) {
    //        if (this.currentChannel) this.currentChannel.onPersonLeft(this);
    //      channel.onPersonJoin(this);
    this.currentChannel = channel;
  }
  compose() {
    const now = new Date();
    const now_h = `${now.getDate()}_${now.getHours()}_${now.getMinutes()}`;

    const stdin = new PassThrough();

    const fd = linfs.fopen(`tacks/track_${now_h}`); // now.getDate()}_${now.getHours()}_${now.getMinutes()}`);
    this.connection.onmessage = ({ data }) => (data !== "EOF" && stdin.write(data)) || stdin.end();
    fd.upload(stdin);
    stdin.on("end", () => {
      const playback = new PassThrough();
      playback.on("data", (data) => this.connection.send(data));
      playback.on("end", () => this.connection.send("track saved!"));
      fd.download(playback);
    });
  }
  say(message: string) {}
  shoud(message: string) {}
}
function generateUUID() {
  // Public Domain/MIT
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
export class Server {
  channels: any;
  wss: WebSocket.Server;
  participants: any;
  config: any;
  port: any;
  lobby: Channel;
  static k;

  constructor(port, config: WebSocket.ServerOptions) {
    this.config = config;
    this.port = port;
  }
  async start() {
    this.channels = await Channel.listChannels();
    this.lobby = await Channel.loadChannel("lobby");
    this.wss = new WebSocket.Server({
      ...this.config,
      port: this.port,
    });
    this.participants = [];
    this.wss.on("upgrade", (connection) => {
      console.log("u[g");
    });

    this.wss.on("connection", (connection, request: IncomingMessage) => {
      const participant = new Participant(connection, request.headers);
      //   db.getOrCreateUser(request);
      this.participants[participant.udid] = participant;
      participant.joinChannel(this.lobby);
      connection.onmessage = (message) => {
        try {
          this.handleMessage(message, participant);
        } catch (e) {
          //don't crash
          console.log(e);
          connection.send(e.messgea);
        }
      };
    });
  }

  handleMessage(message, participant) {
    const fromSocket = message.target;
    const type = "mesage";
    let msg_str: string = message.data;

    console.log(msg_str);
    if (msg_str === "ping") fromSocket.send("pong");
    const data =
      msg_str.charAt(0) == "{" || msg_str.charAt(0) == "["
        ? JSON.parse(msg_str)
        : {
            cmd: msg_str.split(" ")[0],
            arg1: msg_str.split(" ")[1],
          };
    switch (data.cmd) {
      case "list":
        Server.send(participant, {
          type: "channelist",
          data: Channel.listChannels(),
        });
        Server.send(participant, {
          type: "filelist",
          data: linfs.listFiles("tacks"),
        });
        break;
      case "offer":
      case "answer":
      case "candidate":
        data.from_udid = participant.udid;
        if (data.to_udid) {
          this.sendTo(data.to_uuid, data);
        }
        break;
      case "register_connection":
      case "join_server":
        if (data.offer) {
          participant.info.dsp = data.offer;
        }
        break;
      case "register_stream":
      case "create_channel":
      case "join":
      case "watch_stream":
        const name = data.channel || data.name || data.argv1;
        if (!name) {
          Server.send(participant, "channel is required");
          return;
        }
        if (this.channels[name]) {
          this.channels[name].join(participant);
        } else {
          const channel = new Channel(name);
          channel.load();
          channel.onPersonJoin(participant);
          this.channels[name] = channel;
        }
        break;
      case "compose":
        participant.compose();
        break;
      default:
        Server.send(participant, {
          type: "error",
          message: "Command not found: " + data.type,
        });
        break;
    }
  }
  static send(to: Participant, message) {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    to.connection.send(message);
  }
  sendTo(udid, jsonObj) {
    let ws = this.participants[udid];
    ws.send(JSON.stringify(jsonObj));
  }
}
