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
import * as session from "express-session";
import { stdinHandler } from "./src/stdin";
import { wavHeader } from "./src/wavheader";
import * as vhost from "vhost";
import * as net from 'net';


import { IncomingMessage } from "http";
var serveStatic = require('serve-static')
var serveIndex = require('serve-index')

// const rtc = require("./routes/rtc");
//const session = require("express-session");
const connect = require("connect");
const app = express();

const dspServer = connect();
dspServer.use("/api/spotify", auth);
dspServer.use("/", express.static("../hearing-radar/public"));

const apiServer = connect();
apiServer.use("/",(req,res)=>res.end("api"));
app.use(vhost("api.grepawk.com", apiServer));
app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", dspServer));
app.set('views', __dirname + '/views');
app.set('view engine', 'jsx');
app.engine('jsx', require('./src/express-react-forked').createEngine());

var cookieParser = require("cookie-parser");

app.use(
	session({
		genid: () => Math.random() * 42 + "",
		secret: "keyboard cat",
	})
);

app.use(cookieParser());
app.use("/",  express.static("./views"));
app.use("/yt", yt);
app.use("/auth", auth);
app.use("/fs", require("./routes/fs"));
app.use("/views", express.static("./views"));
app.use("/dl", express.static("./music"));

app.use("/download", (req, res) => {
	require("fs").readdir("../share", (files) => {
		res.end(files[Math.random() * 30]);
	});
});
app.use("/download/:filename", (req, res) => {
	//execSync(`ls ../share |grep ${req.params.filename}`).toString().split("\n");
	res.end(execSync(`ls ../share`).toString().split("\n"));
});
export const httpsTLS = {
	key: readFileSync(process.env.PRIV_KEYFILE),
	cert: readFileSync(process.env.CERT_FILE),
	SNICallback: function (domain, cb) {
		if (!existsSync(`/etc/letsencrypt/live/${domain}`)) {
			cb();
			return;
		}
		console.log('..',domain,'sni')
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
app.use("/piano", express.static("../piano/build"));

const forward ={
	'radar':{
		port: 4000,
		path:"/"
	},
	'quick':3333,
	'proxy':5150,
	'v2': 8080
}
import {proxy_pass} from'./vpn';

Object.keys(forward).map(key=>{
	app.use("/"+key,(req,res)=>{
		proxy_pass(req.socket,forward[key])
	})
})
httpsServer.on("request", function connection(request:IncomingMessage,res) {
	console.log(request.url)	;
	Object.keys(forward).map(key=>{
		if(request.url==="/"+key){
			proxy_pass(request.socket,forward[key])
		}
	})

	// if (request.url === '/quick') {
	// 	require("./vpn").proxy_pass(request.socket, {
	// 		port: 3333
	// 	})
	// }
	// if (request.url === '/proxy') {
	// 	require("./vpn").proxy_pass(request.socket, {
	// 		port: 5150
	// 	})
	// }
});

httpsServer.on("upgrade", function upgrade(request, socket, head) {

	const pathname = require("url").parse(request.url).pathname;
	if (pathname.match(/signal/)) {
		signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
			signalServer.wss.emit("connection", ws, request);
		});
	} else if (pathname.match(/rtc1/)) {
		rtcServer.handleUpgrade(request, socket, head, function done(ws) {
			rtcServer.emit("connection", ws, request);
		});
	} else if (pathname.match(/stdin/)) {
		stdinServer.handleUpgrade(request, socket, head, function done(ws) {
			ws._socket.pipe(require("fs").createWriteStream("./shared/1"));
		});
	}
});

const port = process.argv[2] || 443;

httpsServer.listen(443);//"../sound.sock"); //process.argv[2] || 3000);
console.log("listening on " + port); //
const devnull = (req, res) => { };
