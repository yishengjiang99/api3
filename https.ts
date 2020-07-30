const fs = require("fs");
const express = require("express");
const https = require("https");
const db = require("./dist/db");
import { resolve } from 'path'
import { execSync } from 'child_process';
import { readFile, createReadStream } from "fs";
const cookieParser = require("cookie-parser");
const WebSocketServer = require("ws").Server;
import * as serveIndex from "serve-index";

import * as spotify from "./routes/spotify";
import { IncomingMessage } from "http";

var options = {
  key: fs.readFileSync(process.env.PRIV_KEYFILE),
  cert: fs.readFileSync(process.env.CERT_FILE),
};
const ssjs = fs.readFileSync("./simple-console.js");//path.resolve(__dirname, "simple-console.js"));
var app = express();
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT");
  res.header("Transfer-Encoding", "chunked");
  next();
});

app.get("/(:vid).mp3", require("./routes/yt").ytmp3);
app.use("/spotify", require("./routes/spotify"));
app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.get("/dbfs/:filename", (req, res) => createReadStream(resolve('dbfs/lobby', req.params.filename)).pipe(res));

app.use("/dbfs", (req, res) => {
  res.end("<pre>" + execSync("ls -lt", { cwd: "./dbfs/lobby" }) + "</pre>")
});
app.engine("jsx", require("./src/express-react-forked").createEngine({
  preloadJS: ['https://sdk.scdn.co/spotify-player.js'],
  templates: ['./views/layout.html']
}));

app.use(cookieParser());
app.get("/", (req, res) => {
  res.render("welcome", { host: req.headers.host, t: 's' });
});
app.get("/simple-console.js", (req: IncomingMessage, res) => {
  //res.writeHead("Content-Type: text/javascript");
  res.end(ssjs.toString());
});
app.get("/db", async (req, res) => {
  res.json(await db.dbMeta());
});

app.get("/db/:table/(:start?)(/:limit?)", async (req, res) => {
  res.json(
    await db.dbQuery(
      `select * from ${req.params.table} limit ${req.params.start} ${req.params.limit}`
    )
  );
});
app.get("/favicon.ico", require("./routes/favicon").favicon);

const httpsServer = https.createServer(options, app);

const signalServer = new (require("./src/signal").Server)();
const rtcServer = new WebSocketServer({ noServer: true });
const { rtcHandler } = require("./lib/rtcsignal");

rtcServer.on("connection", rtcHandler);

httpsServer.on("upgrade", function upgrade(request, socket, head) {
  const pathname = require("url").parse(request.url).pathname;
  if (pathname.match(/signal/)) {
    signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
      signalServer.wss.emit("connection", ws, request);
    });
  } else if (pathname.match(/rtc/)) {
    rtcServer.handleUpgrade(request, socket, head, function done(ws) {
      rtcServer.emit("connection", ws, request);
    });
  }
});

httpsServer.listen(process.argv[2] || 333);
console.log("listening on " + (process.argv[2] || 443));

const files = [];

// app.get("/ws_status", async (req, res) => {
//   res.json({ broadcasts, connections });
// });
