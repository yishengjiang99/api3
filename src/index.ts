import * as fs from "fs";
import * as https from "https";
import * as WebSocket from "ws";
import { stdoutHandler } from "./stdout";
import { stdinHandler } from "./stdin";
import * as url from "url";
import { resolve } from "path";
import * as azfs from "./azfs";
import * as db from "./db";
import * as http from "http";
import * as SignalServer from "./signal";
// import * as http from "./httpServer";

new SignalServer.Server({ port: 3001 }).start();

const favicon = fs.readFileSync("./favicon.jpg");

const server = http.createServer((req, res) => {
  const urlparts = req.url.split("/");
  res.writeHead(200);
  const parts = req.url.split("/");

  switch (parts[1]) {
    case "checkin":
      checkinUser(req).then((jsonResp) => {
        res.writeHead(200, "one moemnt", {
          "Content-Type": "application/json",
        });
        res.end(JSON.stringify(jsonResp));
      });

      break;
    case "favicon.ico":
    case "favicon.jpg":
      res.writeHead(200, "one moemnt", { "Content-Type": "image/jpeg" });
      res.write(favicon.slice(0, 18));

      checkinUser(req).then((jsonResp) => {
        const bufferResp = Buffer.from(JSON.stringify(jsonResp));
        const respBufferLen = bufferResp.byteLength;
        res.write(respBufferLen + "");
        res.write(bufferResp);
        res.write(favicon.slice(18 + 1 + respBufferLen));
        res.end();
      });
      break;
    default:
      res.end("welcome");
      break;
  }
});
const checkinUser = async (req) => {
  const jsonResp = {
    shared: azfs.listFiles("sounds"),
  };
  return jsonResp;
};

const signal = new SignalServer.Server({});

const stdin = new WebSocket.Server({ noServer: true });
const stdout = new WebSocket.Server({ noServer: true });
stdin.on("connection", stdinHandler);
stdout.on("connection", stdoutHandler);

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  console.log(pathname);
  if (pathname.startsWith("/stdin")) {
    stdin.handleUpgrade(request, socket, head, function done(ws) {
      stdin.emit("connection", ws, request);
    });
  } else if (pathname.startsWith("/stdout")) {
    stdout.handleUpgrade(request, socket, head, function done(ws) {
      stdout.emit("connection", ws, request);
    });
  } else {
    //    socket.destroy();
  }
});
const hashCheckAuthLogin = async (username) => {
  require("exec").exec(
    `md5 -s '${username}${process.env.secret_md5_salt || "welcome"}'`,
    (err, stdout, stderr) => {
      if (err) throw err;
      return stdout.toString();
    }
  );
};
server.listen(3333);
