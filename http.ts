const fs = require("fs");
const express = require("express");
const http = require("http");
const db = require("./dist/db");
const cookieParser = require("cookie-parser");
const WebSocketServer = require("ws").Server;
/*
var options = {
  key: fs.readFileSync(process.env.PRIV_KEYFILE),
  cert: fs.readFileSync(process.env.CERT_FILE),
};
*/
var app = express();
app.get("/(:vid).mp3", require("./routes/yt").ytmp3);

app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine("jsx", require("express-react-forked").createEngine());
app.use(cookieParser());
app.get("/", (req, res) => {
  res.end("welcome");
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

const httpServer = http.createServer(app);
const signalServer = new (require("./dist/signal").Server)();
const rtcServer = new WebSocketServer({ noServer: true });
const { rtcHandler } = require("./lib/rtcsignal");

rtcServer.on("connection", rtcHandler);

httpServer.on("upgrade", function upgrade(request, socket, head) {
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

httpServer.listen(80);
console.log("80")
const files = [];

// app.get("/ws_status", async (req, res) => {
//   res.json({ broadcasts, connections });
// });
