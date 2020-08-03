import * as linfs from "./linfs";
import * as WebSocket from "ws";
import * as fs from "fs";
import { IncomingHttpHeaders, IncomingMessage } from "http";
import { Data } from "ws";
import * as db from "./db";
import { getContainer, fopen } from "./linfs";

import { EventEmitter } from "events";
import { readFile } from "./signaling/readFile";
const url = require("url");
const formatDate = (now: Date) =>
  `${now.getMonth()}_${now.getDate()}_${now.getHours()}`;

export class Server extends EventEmitter {
  channels: any;
  wss: WebSocket.Server;
  participants: any;
  config: any;
  port: any;
  requestContext: {};
  static k;

  constructor(config: WebSocket.ServerOptions) {
    super();
    this.requestContext = {};
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

  handleConnection = (connection, request) => {
    const socketId = request.headers["sec-websocket-key"];
    const participant = new Participant(connection, socketId);
    participant.udid = socketId;
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
      try
      {
        this.handleMessage(message, participant);
      } catch (e)
      {
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
    console.log(typeof msg_str);
    console.log(msg_str);
    if (msg_str === "ping") fromSocket.send("pong");
    let data;
    if (msg_str.startsWith("csv:"))
    {
      msg_str = msg_str.substr(4);
      const cmd = msg_str.substr(0, msg_str.indexOf(","));
      data = { cmd, data: msg_str.substr(cmd.length + 1) };
    } else if (msg_str[0] === "[" || msg_str[0] === "{")
    {
      try
      {
        data = JSON.parse(msg_str);
      } catch (e)
      {
        console.error(e);
        return;
      }
    } else
    {
      data = {
        cmd: msg_str.split(" ")[0],
        arg1: msg_str.split(" ")[1] || "",
      };
    }
    const cmd = data.cmd;

    if (cmd === "read")
    {
      readFile(data.arg1, fromSocket);
    } else if (cmd === "list") {
      Server.send(participant, {
        type: "fileList",
        data: linfs.listFiles("drafts"),
      });
    } else if (cmd === "compose" || cmd === "keyboard")
    {
      console.log("before comp");
      const now = new Date();
      const filename = `drafts/${formatDate(now)}.csv`;
      fromSocket.send(filename);
      linfs.fopen(filename).append(data.data + "\n");

      for (const ws of this.wss.clients)
      {
        if (ws.id !== fromSocket.id)
        {
          ws.send("remote " + data.csv);
        }
      }
    } else
    {
      fromSocket.send("unknown cmd");
    }
  }
  static send(to: Participant, message) {
    if (message instanceof Object)
    {
      message = JSON.stringify(message);
    }
    to.connection.send(message);
  }
  sendTo(udid, jsonObj) {
    let ws = this.participants[udid];
    ws.send(JSON.stringify(jsonObj));
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
    if (refresh)
    {
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
    if (person.dsp)
    {
      this.sendToChannel(person, JSON.stringify({ sdp: person.sdp }));
    }
  }

  onPersonLeft(left) { }
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
  openFd: Number;
  constructor(connection: WebSocket, udid) {
    this.udid = udid;
    this.connection = connection;
  }
  joinChannel(channel: Channel) {
    this.currentChannel = channel;
    ///  channel.onPersonJoin(this);
  }

  say(message: string) { }
  shoud(message: string) { }
}
function generateUUID() {
  // Public Domain/MIT
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}
