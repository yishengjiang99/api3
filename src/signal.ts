import * as linfs from "./linfs";
import * as WebSocket from "ws";
import { IncomingHttpHeaders, IncomingMessage } from "http";
import { Data } from "ws";
import * as db from "./db";
import { fopen } from "./azfs";
import { PassThrough } from "stream";
import { eventNames } from "process";
import { EventEmitter } from "events";
const url = require("url");

export class Server extends EventEmitter {
  channels: any;
  wss: WebSocket.Server;
  participants: any;
  config: any;
  port: any;
  static k;

  constructor(config: WebSocket.ServerOptions) {
    super();
    this.participants = {};
    this.channels = [new Channel("lobby")];
    this.config = config;
    this.wss = new WebSocket.Server({ noServer: true });
    this.wss.on("connection", this.handleConnection);
  }

  async start() {
    this.wss.on("upgrade", (connection) => {
      console.log("u[g");
    });

    this.wss.on("connection", this.handleConnection).bind(this);
  }

  handleConnection = async (connection, request) => {
    const uri = require("url").parse(request.url).query;
    const queries = require("querystring").parse(uri);
    const { udid, channel } = queries;
    const username = udid || generateUUID();
    const dbuser = await db.getOrCreateUser(username); //"user", { username: udid });
    const participant = new Participant(connection, dbuser);
    this.participants[participant.udid] = participant;
    participant.joinChannel(this.channels[0]);
    connection.send(
      JSON.stringify({
        udid: participant.udid,
        channel: participant.currentChannel,
        participants: Object.keys(this.participants),
        channels: this.channels,
      })
    );
    connection.onmessage = (message) => {
      try {
        this.handleMessage(message, participant);
      } catch (e) {
        //don't crash
        console.error(e);
        connection.send(e.message);
      }
    };
  };

  handleMessage(message, participant) {
    const fromSocket = message.target;
    const type = "mesage";
    let msg_str: string = message.data;

    console.log(msg_str);
    if (msg_str === "ping") fromSocket.send("pong");
    let data;
    try {
      data =
        msg_str.charAt(0) == "{" || msg_str.charAt(0) == "["
          ? JSON.parse(msg_str)
          : {
              cmd: msg_str.split(" ")[0],
              arg1: msg_str.split(" ")[1],
            };
    } catch (e) {
      fromSocket.send("could not parse msg");
      return;
    }

    switch (data.cmd) {
      case "list":
        Server.send(participant, {
          type: "channelList",
          data: Channel.listChannels(),
        });
        Server.send(participant, {
          type: "fileList",
          data: linfs.listFiles("lobby"),
        });
        break;
      case "offer":
        if (data.offer && data.offer.dsp) {
          this.emit("dsp", participant, data.offer.dsp);
          db.dbInsert("sdp", {
            socketId: participant.username,
            sdp: data.offer.sdp,
            created_at: new Date(),
          });
        }
        break;
      case "answer":
      case "candidate":
        data.from_udid = participant.udid;
        if (data.to_udid) {
          this.sendTo(data.to_uuid, data);
        }
        break;
      case "add_stream":
        break;
      case "join_channel":
        const name = data.channel || data.name || data.argv1;
        if (!name) {
          Server.send(participant, "channel is required");
          return;
        }
        const tracks = data.tracks;
        db.dbInsert("room_participants", {
          roomname: name,
          participant_id: participant.udid,
          tracks: JSON.stringify(data.tracks),
        })
          .then((result) => {
            fromSocket.send("joined " + name);
          })
          .catch((err) => {
            fromSocket.send(err.message);
          });

        this.channels[name] = this.channels[name] || new Channel(name);
        console.log(this.channels);
        this.channels[name].load().then((info) => {
          participant.joinChannel(this.channels[name], tracks);
          Server.send(
            participant,
            JSON.stringify({
              room: name,
              participants: db.dbQuery(
                "select * from room_participants where roomname=?",
                [name]
              ),
            })
          );
          participant.connection.send(JSON.stringify(info));
        });
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

["sdp", "answser", "ice"].forEach((method) => {
  Object.defineProperty(Server.prototype, `on${method}`, {
    get() {},
    set(listener) {
      this.addEventListener(method, listener);
    },
  });
});

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
  dbrow: any;
  fds: linfs.FileDriver[];
  constructor(name) {
    this.name = name;
    this.members = [];
    this.folder = name;
    this.tracks = [];
  }
  async load() {
    this.members = [];
    this.folder = "ch_" + this.name;
    this.dbrow =
      (await db.dbRow("select * from room where name = ?", [this.name])) ||
      (await db.dbInsert("room", {
        name: this.name,
      }));

    const members = await db.dbQuery(
      "select * from room_participants where roomname = ?",
      [this.name]
    );
    return members;

    //this.members = linfs.fopen(this.name + "/info").getContent();
    // this.info = linfs.fopen(this.name + "/info").getContent();
    // this.tracks = linfs.fopen((this.tracks = "tracks")).getContent();
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
    this.members
      .filter((m) => m != from)
      .forEach((m) => Server.send(m, { cmd: "joined", udid: from.udid }));
  }

  onPersonJoin(person) {
    //zfs.fopen(this.name + "/ch_members.json").append(person.toString());
    db.dbInsert("room_participants", {
      roomname: this.name,
      participant_id: person.udid, //.username,
    });
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

  constructor(connection: WebSocket, dbuser) {
    console.log(dbuser);
    this.udid = dbuser.username;
    this.connection = connection;
  }
  joinChannel(channel: Channel) {
    this.currentChannel = channel;
    channel.onPersonJoin(this);
  }
  compose() {
    const now = new Date();
    const now_h = `${now.getDate()}_${now.getHours()}_${now.getMinutes()}`;

    const stdin = new PassThrough();

    const fd = linfs.fopen(`${this.currentChannel.folder}/track_${now_h}`); // now.getDate()}_${now.getHours()}_${now.getMinutes()}`);
    this.connection.onmessage = ({ data }) =>
      (data !== "EOF" && stdin.write(data)) || stdin.end();
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
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
