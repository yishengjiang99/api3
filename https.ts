#!/usr/bin/ts-node

import { resolve } from "path";
import { execSync } from "child_process";
import {
	readFile,
	readFileSync,
	existsSync,
	createReadStream,
	exists,
} from "fs";
import * as db from "./src/db";
import * as https from "https";
import * as express from "express";
import * as auth from "./routes/auth";
import yt from "./routes/yt";
import { proxy_pass } from "./vpn";
import * as session from "express-session";
import { stdinHandler } from "./src/stdin";
//const session = require("express-session");
const connect = require("connect");
const app = express();
const dspServer = connect();
const apiServer = connect();
var vhost = require("vhost");
dspServer.use("/api/spotify", auth);
dspServer.use("/", express.static("../grepaudio"));
app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", dspServer));
var cookieParser = require("cookie-parser");
app.use(
	session({
		genid: () => Math.random() * 42 + "",
		secret: "keyboard cat",
	})
);

[1, 2, 3, 4, 5, 12, 33, 25, 55].forEach(idx => {
	if (!existsSync(`./shared/${idx}`)) execSync(`mkfifo ./shared/${idx}`);
})
app.get("/sound/:streamid", (request, response) => {
	createReadStream("./shared/" + request.params.streamid).pipe(response);
	// request.pipe("./shared/1");
});
app.use(cookieParser());

app.use("/yt", yt);
app.use("/auth", auth);
app.use("/fs", require("./routes/fs"));
app.use("/views", express.static("./views"));
app.use("/download/:filename", (req, res) => {
	if (resolve("shared", req.params.filename))
	{
		res.download(resolve("shared", req.params.filename));
	}
});

export const httpsTLS = {
	key: readFileSync(process.env.PRIV_KEYFILE),
	cert: readFileSync(process.env.CERT_FILE),
	SNICallback: function (domain, cb) {
		if (!existsSync(`/etc/letsencrypt/live/${domain}`))
		{
			cb();
			return;
		}
		cb(
			null,
			require("tls").createSecureContext({
				key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
				cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
			})
		);
	},
};

app.get("/favicon.ico", require("./routes/favicon").favicon);
app.use("/app", express.static(__dirname + "/static"));

app.use("/spotify", require("./ssr/src/server"));

const WebSocketServer = require("ws").Server;

const httpsServer = https.createServer(httpsTLS, app);

const signalServer = new (require("./src/signal").Server)();
const rtcServer = new WebSocketServer({ noServer: true });
const { rtcHandler } = require("./lib/rtcsignal");

const stdinServer = new WebSocketServer({ noServer: true });
stdinServer.on("connection", stdinHandler);

rtcServer.on("connection", rtcHandler);
app.use("/", express.static("../piano/build"));

httpsServer.on("upgrade", function upgrade(request, socket, head) {
	const pathname = require("url").parse(request.url).pathname;
	if (pathname.match(/signal/))
	{
		signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
			// // const dbuser = db.getOrCreateUser(request.headers["set-cookie"]);
			// signalServer.requestContext[
			//   request.headers["sec-websocket-key"]
			// ] = dbuser;
			signalServer.wss.emit("connection", ws, request);
		});
	} else if (pathname.match(/rtc/))
	{
		rtcServer.handleUpgrade(request, socket, head, function done(ws) {
			rtcServer.emit("connection", ws, request);
		});
	} else if (pathname.match(/stdin/))
	{
		stdinServer.handleUpgrade(request, socket, head, function done(ws) {
			ws._socket.pipe(require("fs").createWriteStream("./shared/1"));
		});
	}
});

httpsServer.on("connection", function connection(request, socket, head) { });
const port = process.argv[2] || 443;
httpsServer.listen(port); //process.argv[2] || 3000);
console.log("listening on " + port); //
const devnull = (req, res) => { };
const http = require("http").createServer((req, res) => { });
http.on("connection", function connection(req, socket, head) {
	proxy_pass(socket, {
		port: 443,
		host: "www.grepawk.com"
	})
}).listen(80)