import * as azfs from './azfs';
import * as WebSocket from "ws";
import { IncomingMessage } from 'http';
import { MessageEvent, Data } from 'ws';
const channel_container_prefix = "ch"
const channel_participant_file_prefix = 'ccp'

export class Channel {
    static loadChannel = async function (name) {
        const c = new Channel(name);
        return await c.load();
    }
    name: string;
    members: any[];
    _db: any;
    info: any;
    track: any;
    server: Server;
    constructor(name) {
        this.name = name;
    }
    load() {
        this._db = azfs.getContainer(this.name);
        Promise.all([
            azfs.fopen(this.name + "/ch_info.json")
                .then(fd => fd.getContent())
                .then(data => {
                    console.log('data got')
                    this.info = JSON.parse(data);
                }),

            azfs.fopen(this.name + "/ch_members.json")
                .then(fd => fd.getContent())
                .then(data => {
                    console.log('data got')
                    this.info = JSON.parse(data);
                }),
            azfs.fopen(this.name + "/ch_score.json")
                .then(fd => fd.getContent())
                .then(data => {
                    console.log('data got')
                    this.info = JSON.parse(data);
                })
        ]);
    }

    static async listChannels() {
        return await azfs.listContainers(channel_container_prefix).catch(err => console.error(err));
    }

    async lstParticipants(refresh = false) {
        if (refresh)
        {
            await this.load();
        }
        return this.members;
    }
    async sendToChannel(from: Participant, messaage: Data) {
        this.members.filter(m => m != from).forEach(m => Server.send(m, messaage));
    }
    async onPersonJoin(person) {
        //zfs.fopen(this.name + "/ch_members.json").append(person.toString());
        this.sendToChannel(person, person.displayName + " joined the channel");
        if (person.dsp)
        {
            this.sendToChannel(person, JSON.stringify({ sdp: person.sdp }));

        }
    }

    onPersonLeft(left) {

    }
    componseNote(from, message: JSON) {
        this.sendToChannel(from, message.toString());
        //azfs.fopen(this.name + "_ch_sore.json").append(Buffer.from(JSON.stringify(message)));
    }
}


export class Participant {
    udid: any;
    info: { ip: any; dsp: any; vlocation: any; };
    connection: WebSocket;
    currentChannel: Channel;
    sdp: string;

    constructor(connection: WebSocket, requestHeaders) {
        this.udid = generateUUID();
        this.info = {
            ip: requestHeaders['remote-address'],
            dsp: null,
            vlocation: null, //type room   
            ...requestHeaders
        }
    }
    joinChannel(channel: Channel) {
        if (this.currentChannel) this.currentChannel.onPersonLeft(this);
        channel.onPersonJoin(this);;
        this.currentChannel = channel;

    }
    say(message: string) {

    }
    shoud(message: string) {

    }
}
function generateUUID() { // Public Domain/MIT
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
export class Server {
    channels: any;
    wss: any;
    participants: any;
    config: any;
    port: any;
    static k;

    constructor(port, config: WebSocket.ServerOptions) {
        this.config = config;
        this.port = port;
    }
    async start() {
        this.channels = await Channel.listChannels();
        // Channel.loadChannel("lobby");
        this.wss = new WebSocket.Server({
            ...this.config,
            port: this.port
        });
        this.participants = [];
        this.wss.on("connection", (server, connection, request: IncomingMessage) => {
            const participant = new Participant(connection, request.rawHeaders);
            //            participant.info.merge
            this.participants[participant.udid] = participant;
            connection.onmessage = (message) => this.handleMessage(participant, message);
        }) //("connection", this.handleConnection);
    }

    static send(to: Participant, message) {
        if (message instanceof Object)
        {
            message = JSON.stringify(message)
        }
        to.connection.send(message);
    }
    sendTo(udid, jsonObj) {
        let ws = this.participants[udid];
        ws.send(JSON.stringify(jsonObj));
    }
    handleMessage(participant: Participant, message: Data) {
        if (message instanceof ArrayBuffer)
        {
            //handle binary 
            return;
        }
        var data = JSON.parse(data.toString());
        switch (data.type)
        {
            case 'list':
                Server.send(participant, { type: data.type, data: this.channels, tid: data.tid });
                break;
            case 'offer':
            case 'answer':
            case 'candidate':
                data.from_udid = participant.udid;
                if (data.to_udid)
                {
                    this.sendTo(data.to_uuid, data);
                }
                break;
            case 'register_connection':
            case 'join_server':
                if (data.offer)
                {
                    participant.info.dsp = data.offer;
                }
                break;
            case 'register_stream':
            case 'create_channel':
            case "join":
            case 'watch_stream':
                const name = data.channel || data.name;

                if (!name)
                {
                    Server.send(participant, "channel is required");
                    return;
                }
                if (this.channels[name])
                {
                    this.channels[name].join(participant);
                } else
                {
                    const channel = new Channel(name);
                    channel.load();
                    channel.onPersonJoin(participant);
                    this.channels[name] = channel;
                }
                break;
            case "compose":
                participant.currentChannel.componseNote(participant, data);
                break;
            default:
                Server.send(participant, {
                    type: "error",
                    message: "Command not found: " + data.type
                });
                break;

        }
    }
}

