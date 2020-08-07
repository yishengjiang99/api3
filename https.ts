#!/usr/bin/ts-node

import { resolve } from "path";
import { execSync } from "child_process";
import { readFile, createReadStream, exists } from "fs";
import * as db from "./src/db";
import * as https from "https";
import * as express from "express";
import * as fs from "fs";
import spotify from './routes/spotify';
import yt from './routes/yt';

const WebSocketServer = require("ws").Server;
export const ssl = {
  key: fs.readFileSync(process.env.PRIV_KEYFILE),
  cert: fs.readFileSync(process.env.CERT_FILE),
};
var options = ssl;

var app = express();
const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine("jsx", require("./src/express-react-forked").createEngine());


app.get("/", (req, res) => res.render("welcome", { layout: "layout.html" }));
app.use("/spotify", require("./routes/spotify"));
app.use("/yt", yt);


// app.use("/(:vid).mp3", require("./routes/yt").ytmp3);

app.use("/fs", require("./routes/fs"));
app.use("/", express.static("../piano/build"));
app.use("/views", express.static("./views"));
app.use(function(req,res,next){
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');
  next();
})
app.get("/api", (req, res) => {
  res.render("welcome", { host: req.headers.host, t: "s" });
});

app.get("/favicon.ico", require("./routes/favicon").favicon);
app.use("/app", express.static(__dirname + "/static"));

const httpsServer = https.createServer(options, app);

const signalServer = new (require("./src/signal").Server)();
const rtcServer = new WebSocketServer({ noServer: true });
const { rtcHandler } = require("./lib/rtcsignal");

rtcServer.on("connection", rtcHandler);

httpsServer.on("upgrade", function upgrade(request, socket, head) {
  const pathname = require("url").parse(request.url).pathname;
  if (pathname.match(/signal/)) {
    signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
      const dbuser = db.getOrCreateUser(request.headers["set-cookie"]);
      signalServer.requestContext[
        request.headers["sec-websocket-key"]
      ] = dbuser;
      signalServer.wss.emit("connection", ws, request);
    });
  } else if (pathname.match(/rtc/)) {
    rtcServer.handleUpgrade(request, socket, head, function done(ws) {
      rtcServer.emit("connection", ws, request);
    });
  }
});

httpsServer.listen(443); //process.argv[2] || 443);
console.log("listening on 443"); // + (process.argv[2] || 443));
// res.writeHead(200, "one moemnt", {
//   "Content-Type": "image/jpeg",
//   "set-cookie": "username=" + username,
// });
// r
