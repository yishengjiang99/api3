const WebSocketServer = require('ws').Server;;

const azfs, { listContainers, createContainer } = require("./azfs.js");


class Channel {
    static loadChannel = function (name) {
        const c = new Channel(name);
        return await c.init();
    }
    constructor(name) {
        this.name = name;
        this.participants = [];

    }
    async init() {
        this._db = azfs.getContainer(this.name);
        this.info = await azfs.file_get_contents(this.info + "_info.json");
        this.participants = await lstParticipants();
        return {
            info: this.info,
            participants: this.participants
        }

    }
    static listChannels() {
        return await azfs.listContainers(channel_container_prefix).catch(err => console.error(err));
    }
    async lstParticipants() {
        return await azfs.listFiles(name, channel_participant_file_prefix).catch(err => console.error(err))
    }
    async join(person) {
        const p = azfs.createBlob(channel, channel_participant_file_prefix + person.ip + ".json", {
            ip: person.ip,
            joined: new Date(),
            lastActive: new Date(),
            sdp: person.sdp,
        }).catch(err => console.error(err));
        this.participants.push(person);
    }
}
class Participant {
    constructor(connection) {
        this.udid = generateUUID();
        this.info = {
            ip: connection.remoteIpAddress,
            dsp: null,
            vlocation: null, //type room   
        }
    }
}

class Server {
    constructor(port, config) {
        const Ws = require('ws').Server;
    }
    async load() {
        this.channels = await Channels.listChannels();
        Channels.load("lobby");
        Channels.load("afk room");
        this.wss = new Ws({
            ...config,
            port: port
        });
        this.wss.addListener("connection", hanndleConnection);
    }

    handleConnection(connection) {
        const p = new Participant(connection);
        this.parcipants[p.udid] = p;
        connection.onmessage = this.handleMessage(connection, message);
    }
    hanndleMessage(connection, message) {

    }
}
connection.uuid = generateUUID();
connections[connection.uuid] = connection;
connection.on('message', function (message) {

    const data = JSON.parse(message);
    const to_connection = data.to_uuid ? connections[data.to_uuid] : null;
    console.log(data.type);
    switch (data.type) {
        case 'list':
            sendTo(connection, { type: data.type, data: broadcasts, tid: data.tid });
            break;
        case 'offer':
        case 'answer':
        case 'candidate':
            data.client_uuid = data.client_uuid || connection.uuid;
            console.log("to uuid", data.to_uuid);
            if (to_connection) {
                sendTo(to_connection, data);
            }
            break;
        case 'register_connection':
            if (data.offer) {
                var node = { id: nodes.length, sdp: offer };
                nodes.push(node);
            }
            break;
        case 'register_stream':
            if (!data.channel) {
                sendError(connection, "channel is required");
                return;
            }
            const channelName = data.channel;
            broadcasts[channelName] = {
                name: channelName,
                host_uuid: connection.uuid,
                peer_connections: []
            }
            sendTo(connection, {
                type: "registered",
                host_uuid: connection.uuid
            });
            if (nodes.length) {
                sendTo(connection, {
                    type: "available_nodes",
                    nodes: nodes
                });
            }
            console.log(broadcasts);
            break;

        case 'watch_stream':
            if (!data.channel) {
                sendError(connection, "channel name not attached");
                return;
            }
            if (!broadcasts[data.channel]) {
                sendError(connection, "channel not streaming");
                return;
            }
            var host_uuid = broadcasts[data.channel].host_uuid;
            var hostConnection = connections[host_uuid];
            sendTo(hostConnection, {
                type: "user_joined",
                client_uuid: connection.uuid
            })
            broadcasts[data.channel].peer_connections.push(connection.uuid);
            break;
        default:
            sendTo(connection, {
                type: "error",
                message: "Command not found: " + data.type
            });

            break;
    }
    connection.on("close", function () {
        if (connection.uuid) {
            delete connections[connection.uuid];
            delete broadcasts[connection.channel];
        }
    });

}
console.log("Got message from a user:", message);