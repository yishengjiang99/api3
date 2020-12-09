import * as linfs from "./linfs";
import * as fs from "fs";
import { IncomingHttpHeaders, IncomingMessage } from "http";
import { Data } from "ws";
import * as db from "./db";

import { EventEmitter } from "events";
import { WsServer, WsSocket } from "grep-wss";
const url = require("url");
const formatDate = (now: Date) =>(new Date()).toDateString();

export class Server extends EventEmitter {
  channels: any;
  wss: WsServer; //.Server;
  participants: {[key:string]:Participant};
  config: any;

  requestContext: {};
  static k;
  constructor(config ?:{}){
    super();
    this.channels = [new Channel("lobby")];
    this.config=config;
    this.participants={};
  }

  handleConnection = ( ws:WsSocket) => {
    const socketId = ws.headers["sec-websocket-key"];
    const participant = new Participant(ws, socketId);
    participant.udid = socketId;
    this.participants[participant.udid] = participant;
    participant.joinChannel(this.channels[0]);
    ws.write(
      JSON.stringify({
        udid: participant.udid,
        channel: participant.currentChannel,
        participants: Object.keys(this.participants),
        channels: this.channels,
      })
    );
    ws.on('data',  (message) => {
      try {
        this.handleMessage(message.toString(), participant);
      } catch (e) {
        //don't crash
        console.error(e);
        ws.write(e.message);
      }
    });
  };

  handleMessage(msg_str, participant) {
    const fromSocket: WsSocket = participant.connection;
    const type = "mesage";
    
    if (msg_str === "ping") fromSocket.write("pong");
    
    let data;
    if (msg_str.startsWith("csv:")) {
      msg_str = msg_str.substr(4);
      const cmd = msg_str.substr(0, msg_str.indexOf(","));
      data = { cmd, data: msg_str.substr(cmd.length + 1) };
    } else if (msg_str[0] === "[" || msg_str[0] === "{") {
      try {
        data = JSON.parse(msg_str);
      } catch (e) {
        console.error(e);
        return;
      }
    } else {
      data = {
        cmd: msg_str.split(" ")[0],
        arg1: msg_str.split(" ")[1] || "",
      };
    }
    const cmd = data.cmd || data.type;

    if (cmd === "read") {
      const content = linfs.fopen("drafts/" + data.arg1).getContent();

      fromSocket.write("filecontent\n"+content);
    } else if (cmd === "list") {
      Server.send(participant, {
        type: "fileList",
        data: linfs.listFiles("drafts"),
      });
    } else if (cmd === "compose" || cmd === "keyboard") {
      console.log("before comp");
      const now = new Date();
      const filename = `drafts/${formatDate(now)}.csv`;
      fromSocket.write(filename);
      linfs.fopen(filename).append(data.data + "\n");

      for (const ws of Object.values(this.participants)){ //}.map(c=>c.connection)) {
        if (ws.udid !== participant.id) {
          ws.connection.write("remote " + data.csv);
        }
      }
    } else {
      fromSocket.write("unknown cmd"+cmd);
    }
  }
  static send(to: Participant, message) {
    if (message instanceof Object) {
      message = JSON.stringify(message);
    }
    to.connection.write(message);
  }
  sendTo(udid, jsonObj) {
    let ws = this.participants[udid];
    ws.connection.write(JSON.stringify(jsonObj));
  }
}

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
  connection: WsSocket;
  currentChannel: Channel;
  sdp: string;
  requestHeaders: IncomingHttpHeaders;
  userName: string | string[];
  openFd: Number;
  constructor(connection: WsSocket, udid) {
    this.udid = udid;
    this.connection = connection;
  }
  joinChannel(channel: Channel) {
    this.currentChannel = channel;
    ///  channel.onPersonJoin(this);
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
