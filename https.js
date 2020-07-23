"use strict";
const fs = require("fs");
var express = require("express");
var https = require("https");
const linfs = require("./dist/linfs");
const { getOrCreateUser } = require("./dist/db");
const { AsyncResource } = require("async_hooks");

const channels = linfs.listContainers();

const SignalServer = require("./dist/signal").Server;
var options = {
  key: fs.readFileSync(process.env.PRIV_KEYFILE),
  cert: fs.readFileSync(process.env.CERT_FILE),
};

var app = express();
app.use("/", async function (req, res, next) {
  req.user = await getOrCreateUser(req);
  res.setHeader("set-cookie", "g-username=" + req.user.username);
  next();
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
httpsServer.listen(8080);
