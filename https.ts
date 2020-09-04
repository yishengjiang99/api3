#!/usr/bin/ts-node

import { resolve } from "path";
import { execSync } from "child_process";
import { readFile, readFileSync, existsSync, createReadStream, exists } from "fs";
import * as db from "./src/db";
import * as https from "https";
import * as express from "express";
import * as auth from './routes/auth'
import yt from "./routes/yt";
import { proxy_pass } from './vpn';
import * as session from 'express-session';
//const session = require("express-session");
const connect = require('connect')
const app = express();
const dspServer = connect();
const apiServer = connect();
var vhost = require("vhost");
dspServer.use("/api/spotify", auth);
dspServer.use("/", express.static("../grepaudio"));

app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", dspServer));
app.use(vhost("api.grepawk.com", apiServer));

apiServer.use("/", (req, res) => {
  proxy_pass(res.socket, { host: "127.0.0.1", port: 3000 })
});

const cookieParser = require("cookie-parser");
app.use(session({
  genid: () => (Math.random() * 42) + "",
  secret: 'keyboard cat'
}))
app.use(cookieParser());
app.use("/spotify", require("./routes/spotify"));
app.use("/yt", yt);
app.use("/auth", auth);
app.use("/fs", require("./routes/fs"));
app.use("/", express.static("../piano/build"));
app.use("/views", express.static("./views"));

export const httpsTLS = {
  key: readFileSync(process.env.PRIV_KEYFILE),
  cert: readFileSync(process.env.CERT_FILE),
  SNICallback: function (domain, cb) {
    if (!existsSync(`/etc/letsencrypt/live/${domain}`)) {
      cb();
    }
    cb(null, require('tls').createSecureContext({
      key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
      cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
    }));
  },
};

app.get("/favicon.ico", require("./routes/favicon").favicon);
app.use("/app", express.static(__dirname + "/static"));
const WebSocketServer = require("ws").Server;

const httpsServer = https.createServer(httpsTLS, app);

const signalServer = new (require("./src/signal").Server)();
const rtcServer = new WebSocketServer({ noServer: true });
const { rtcHandler } = require("./lib/rtcsignal");

rtcServer.on("connection", rtcHandler);

httpsServer.on("upgrade", function upgrade(request, socket, head) {
  const pathname = require("url").parse(request.url).pathname;
  if (pathname.match(/signal/)) {
    signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
      // // const dbuser = db.getOrCreateUser(request.headers["set-cookie"]);
      // signalServer.requestContext[
      //   request.headers["sec-websocket-key"]
      // ] = dbuser;
      signalServer.wss.emit("connection", ws, request);
    });
  } else if (pathname.match(/rtc/)) {
    rtcServer.handleUpgrade(request, socket, head, function done(ws) {
      rtcServer.emit("connection", ws, request);
    });
  }
});

httpsServer.on("connection", function connection(request, socket, head) {

})
const port = process.argv[2] || 443;
httpsServer.listen(port); //process.argv[2] || 3000);
console.log("listening on " + port); //

