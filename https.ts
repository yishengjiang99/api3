#!/usr/bin/ts-node

import { resolve } from "path";
import { execSync } from "child_process";
import { readFile, readFileSync, existsSync, createReadStream, exists } from "fs";
import * as db from "./src/db";
import * as https from "https";
import * as express from "express";
import * as fs from "fs";
import * as spotify from "./routes/spotify";
import * as auth from './routes/auth'
import yt from "./routes/yt";

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


const cookieParser = require("cookie-parser");
app.use(cookieParser());
app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine("jsx", require("./src/express-react-forked").createEngine());

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
     return;
    }
    cb(null, require('tls').createSecureContext({
      key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
      cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
    }));
  },
};
app.get("/auth", app.use(auth));

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
const port = process.argv[2] || 443;
httpsServer.listen(port); //process.argv[2] || 3000);
console.log("listening on " + port); //

