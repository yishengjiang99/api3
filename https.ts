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
import * as auth from "./routes/auth";
import yt from "./routes/yt";
import { stdinHandler } from "./src/stdin";
import {handleWsRequest}from'grep-wss';
import {Server as SignalServer}from'./src/signal';
const vhost=require("vhost");
const connect = require("connect");
const express = require("express");
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
	require("express-session")({
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
app.use("/piano", express.static("../piano/build"));
const httpsServer = https.createServer(httpsTLS, app);
const devnull = (a, b,c) => { };

handleWsRequest(httpsServer,(uri:string)=>{
	if(uri.match(/rtc/)){
		return  require("./lib/rtcsignal").rtcHandler;
	}else if(uri.match(/signal/)){
		const sigServer =  new SignalServer({}); 
		return sigServer.handleConnection;
	}else if(uri.match(/stdin/)){
		return stdinHandler;
	}else{
		return devnull;
	}
})
const port = process.argv[2] || 443;

httpsServer.listen(443);//"../sound.sock"); //process.argv[2] || 3000);
console.log("listening on " + port); //
