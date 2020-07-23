"use strict";
const fs = require("fs");
var express = require("express");
var https = require("https");
const linfs = require("./dist/linfs");
const db = require("./dist/db");
const favicon = fs.readFileSync("./favicon.jpg");

const cookieParser = require("cookie-parser");

const channels = linfs.listContainers();

const SignalServer = require("./src/signal").Server;
var options = {
  key: fs.readFileSync(process.env.PRIV_KEYFILE),
  cert: fs.readFileSync(process.env.CERT_FILE),
};

var app = express();
app.use(cookieParser());
app.get("/ls", (req, res) => {
  res.json(linfs.listContainers());
});
app.get("/ls/:xpath", (req, res) => {
  res.json(linfs.listFiles(req.params.xpath));
});
app.use("/js", express.static("dist"));
app.get("/favicon.ico", function (req, res) {
  const username = req.cookies["username"] || uuidv4();
  console.log(username + " ");
  res.writeHead(200, "one moemnt", {
    "Content-Type": "image/jpeg",
    "set-cookie": "username=" + username,
  });
  res.write(favicon.slice(0, 18));
  db.getOrCreateUser().then((user) => {
    const bufferResp = Buffer.from(JSON.stringify(user));
    console.log(user);
    const respBufferLen = bufferResp.byteLength;
    res.write(respBufferLen + "");
    res.write(bufferResp);
    res.write(favicon.slice(18 + 1 + respBufferLen));
    res.end();
  });
});

app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine("jsx", require("express-react-views").createEngine());
app.use(express.static("views"));
const httpsServer = https.createServer(options, app);

const signalServer = new SignalServer();
httpsServer.on("upgrade", function upgrade(request, socket, head) {
  signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
    signalServer.wss.emit("connection", ws, request);
  });
});
httpsServer.listen(process.env.httpsPort || 443);
console.log("listening on " + (process.env.httpsPort || 443));
const files = [];
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
