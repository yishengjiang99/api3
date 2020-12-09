#!/usr/bin/ts-node

import { resolve } from "path";
import { execSync } from "child_process";
import * as db from "./src/db";
import * as https from "https";
import * as auth from "./routes/auth";
import yt from "./routes/yt";
import { stdinHandler } from "./src/stdin";
import { handleWsRequest } from "grep-wss";
import { Server as SignalServer } from "./src/signal";
import * as session from "express-session";
import { existsSync } from "fs";
import * as fs from "fs";
import { createEngine } from "./src/express-react-forked";
const vhost = require("vhost");
const connect = require("connect");
const express = require("express");
const fss = require("./routes/fs");
const app = express();
const dspServer = connect();
const apiServer = connect();
app.use(vhost("api.grepawk.com", apiServer));
app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", dspServer));


app.use((req,res,next)=>{
 res.header("Access-Control-Allow-Origin","*");
 next()
});

dspServer.use("/api/spotify", auth);
dspServer.use("/v3", require('serve-index')("../grepaudio/"));
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
app.use("/chat", express.static("./views/chat"));
app.use("/yt", yt);
app.use("/db", require("./routes/db"));

app.use("/auth", auth);
app.use("/fs", require("./routes/fs"));
app.use("/views", express.static("./views"));
app.use("/dl", express.static("./music"));
app.get("/favicon.ico", require("./routes/favicon").favicon);
app.use("/app", express.static(__dirname + "/static"));
app.use("/spotify", require("./ssr/src/server"));

//app.use("/:dir/:file", fss);

app.use("/piano", express.static("../piano/build"));
app.use("/", (req, res) => {
	res.render("welcome.jsx", {
		layout: "layout.html",
		files: [
			{display:"piano",file:"https://www.grepawk.com"}, 
			{display:"dsp",	file:"dsp.piano.com"},
			{display:"db",files:"/db"}, 
			{display:"fs",url:"files"}, 
			{display:"spotify",file:"spotify"}
		],
	});
});
const httpsServer = https.createServer(require("./tls").httpsTLS, app);
const devnull = (a, b, c) => {};

handleWsRequest(httpsServer, (uri: string) => {
	if (uri.match(/rtc/)) {
		return require("./lib/rtcsignal").rtcHandler;
	} else if (uri.match(/signal/)) {
		const sigServer = new SignalServer({});
		return sigServer.handleConnection;
	} else if (uri.match(/stdin/)) {
		return stdinHandler;
	}  else if (uri.match(/rtmp/)) {
		return stdinHandler;
	} else if (uri.match(/proxy/)) {
		return stdinHandler;
	}else {
		return devnull;
	}
});

 
httpsServer.listen(443); 
