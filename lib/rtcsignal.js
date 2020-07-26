'use strict';

function sendTo(connection, message) {
  if (!connection) {
    return;
  }
  connection.send(JSON.stringify(message));
}

function sendError(connection, msg) {
  console.log("send error ", msg);
  connection.send(
    JSON.stringify({
      type: "error",
      message: msg,
    })
  );
}

var broadcasts = {};
var connections = {};
var nodes = [];
var node_edge_stats = {}; //hashmap of arrays with node idx being key

function generateUUID() {
  // Public Domain/MIT
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}


async function rtcHandler(connection) {
  connection.udid = generateUUID();
  connections[connection.udid] = connection;
  connection.on("message", function (message) {
    let data;
    try {
      data = JSON.parse(message);
    } catch (e) {
      console.error(e);
    }
    const to_connection = data.to_udid ? connections[data.to_udid] : null;
    console.log(data.type);
    switch (data.type) {
      case "list":
        sendTo(connection, {
          type: data.type,
          data: broadcasts,
          tid: data.tid,
        });
        break;
      case "offer":
        console.log(data.payload);
        data.payload.sdp.split("\r\n").forEach((l) => console.log(l));
      case "answer":
      case "candidate":
        data.client_udid = data.client_udid || connection.udid;
        if (to_connection) {
          sendTo(to_connection, data);
        } else {
          sendTo(connection, data.to_udid + "not online");
        }
        break;

      case "channel":
        if (!data.channel) {
          sendError(connection, "channel is required");
          return;
        }
        const channelName = data.channel;
        if (
          !!broadcasts[channelName] &&
          !!connections[broadcasts[data.channel].host_udid]
        ) {
          var host_udid = broadcasts[data.channel].host_udid;
          var hostConnection = connections[host_udid];
          sendTo(hostConnection, {
            type: "user_joined",
            client_udid: connection.udid,
            args: data.args,
          });
          broadcasts[data.channel].peer_connections.push(connection.udid);
        } else {
          broadcasts[channelName] = {
            name: channelName,
            host_udid: connection.udid,
            peer_connections: [],
          };
          sendTo(connection, {
            type: "channelStarted",
            host_udid: connection.udid,
          });
        }
        break;
      default:
        sendTo(connection, {
          type: "error",
          message: "Command not found: " + data.type,
        });

        break;
    }
    connection.on("close", function () {
      if (connection.udid) {
        delete connections[connection.udid];
        if (connection.otherudid) {
          console.log("Disconnecting from ", connection.otherudid);
          var conn = users[connection.otherudid];
          conn.otherudid = null;
        }
        delete broadcasts[connection.channel];
      }
    });
  });
  sendTo(connection, {type: "connected"});
}

module.exports = {
  rtcHandler
}