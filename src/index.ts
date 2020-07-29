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


const favicon = fs.readFileSync("./favicon.jpg");

const server = http.createServer(
  (req, res) => {
    const urlparts = req.url.split("/");
    res.writeHead(200);
    const parts = req.url.split("/");

    switch (parts[1]) {
      case "checkin":
        checkinUser(req).then((jsonResp) => {
          res.writeHead(200, "one moemnt", { "Content-Type": "application/json" });
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
        checkinUser(req).then(resp => res.end(JSON.stringify(resp))).catch(e => {
          res.end(e.message);
        });
        break;
    }

  }
);
async function checkinUser(req) {
  try {
    const user = {};//await linfs.getOrCreateUser(req);

    return {
      user: user,
      shared: azfs.listFiles("sounds")
    };
  } catch (e) {
    throw e;
  }

};
const stdin = new WebSocket.Server({ noServer: true });
const stdout = new WebSocket.Server({ noServer: true });
stdin.on("connection", stdinHandler);
stdout.on("connection", stdoutHandler);

server.on("upgrade", function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  console.log(pathname);
  if (pathname.startsWith("/stdin")) {
    stdin.handleUpgrade(request, socket, head, function done(ws: any) {
      stdin.emit("connection", ws, request);
    });
  } else if (pathname.startsWith("/stdout")) {
    stdout.handleUpgrade(request, socket, head, function done(ws: any) {
      stdout.emit("connection", ws, request);
    });
  } else {
    //    socket.destroy();
  }
});
const hashCheckAuthLogin = async (username: any) => {
  require("exec").exec(
    `md5 -s '${username}${process.env.secret_md5_salt || "welcome"}'`,
    (err: any, stdout: { toString: () => any; }, stderr: any) => {
      if (err) throw err;
      return stdout.toString();
    }
  );
};
server.listen(4400);
