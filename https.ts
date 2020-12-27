#!/usr/bin/ts-node

import { resolve } from "path";
import { execSync } from "child_process";
import * as db from "./src/db";
import * as https from "https";
import * as auth from "./routes/auth";
import { stdinHandler } from "./src/stdin";
import { handleWsRequest } from "grep-wss";
import { Server as SignalServer } from "./src/signal";
import { httpsTLS } from "./tls";
import { linkMain } from "./reverseProxy";
import { createEngine } from "./src/express-react-forked";
const vhost = require("vhost");
const connect = require("connect");
const express = require("express");
const fss = require("./routes/fs");
const app = express();
const dspServer = connect();
const apiServer = connect();
linkMain(app);
app.use(vhost("api.grepawk.com", apiServer));
app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", dspServer));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});

dspServer.use("/api/spotify", auth);
dspServer.use("/v3", require("serve-index")("../grepaudio/v3"));

dspServer.use("/", express.static("../grepaudio/v1"));

apiServer.use("/", (req, res) => res.end("api"));
app.set("views", __dirname + "/views");
app.set("view engine", "jsx");
app.engine(
  "jsx",
  createEngine({
    layout: "layout.html",
  })
);

app.get("/js/:file", (req, res) => {
  res.end(req.params.file);
});
app.get("/sf/:note/(:instr)", (req, res) => {
  res.end(req.params.note);
});

app.use("/chat", (req, res) => {
  return res.render("chat.jsx", {
    layout: "layout.html",
  });
});
app.use("/db", require("./routes/db"));

app.use("/auth", auth);
app.use("/fs", fss);
app.use("/views", express.static("./views"));
app.get("/favicon.ico", require("./routes/favicon").favicon);
app.use("/spotify", require("./ssr/src/server"));
app.use("/static/", require("serve-index")("./static"));
app.use("/static", express.static("./static"));
app.use("/piano", express.static("../piano/build"));

const httpsServer = https.createServer(httpsTLS, app);

const devnull = (a, b, c) => {};

handleWsRequest(httpsServer, (uri: string) => {
  if (uri.match(/rtc/)) {
    return require("./lib/rtcsignal").rtcHandler;
  } else if (uri.match(/signal/)) {
    const sigServer = new SignalServer({});
    return sigServer.handleConnection;
  } else if (uri.match(/stdin/)) {
    return stdinHandler;
  } else if (uri.match(/rtmp/)) {
    return stdinHandler;
  } else if (uri.match(/proxy/)) {
    return stdinHandler;
  } else {
    return devnull;
  }
});
httpsServer.listen(443);









app.use("/",(req,res)=>{
    res.render("welcome.jsx", {
        layout: "layout.html",
        files: [
            {
                display: "fast audio play",
                file: "https://grep32bit.z22.web.core.windows.net/",
            },
            { display: "bach SSE", file: "https://www.grepawk.com/bach/rt" },
            {
                display: "wave form of instruments",
                file: "https://www.grepawk.com/bach/samples",
            },
            { display: "piano", file: "https://www.grepawk.com/piano" },
            { display: "dsp", file: "https://dsp.grepawk.com" },
            { display: "spotify", file: "https://www.grepawk.com/spotify" },
        ],
    });
});
