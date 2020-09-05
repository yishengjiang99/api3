#!/usr/bin/ts-node
"use strict";
exports.__esModule = true;
exports.httpsTLS = void 0;
var fs_1 = require("fs");
var https = require("https");
var express = require("express");
var auth = require("./routes/auth");
var yt_1 = require("./routes/yt");
var vpn_1 = require("./vpn");
var session = require("express-session");
//const session = require("express-session");
var connect = require("connect");
var app = express();
var dspServer = connect();
var apiServer = connect();
var vhost = require("vhost");
dspServer.use("/api/spotify", auth);
dspServer.use("/", express.static("../grepaudio"));
app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", dspServer));
app.use(vhost("api.grepawk.com", apiServer));
apiServer.use("/", function (req, res) {
    vpn_1.proxy_pass(res.socket, { host: "127.0.0.1", port: 3000 });
});
var cookieParser = require("cookie-parser");
app.use(session({
    genid: function () { return Math.random() * 42 + ""; },
    secret: "keyboard cat"
}));
app.use(cookieParser());
app.use("/spotify", require("./routes/spotify"));
app.use("/yt", yt_1["default"]);
app.use("/auth", auth);
app.use("/fs", require("./routes/fs"));
app.use("/views", express.static("./views"));
exports.httpsTLS = {
    key: fs_1.readFileSync(process.env.PRIV_KEYFILE),
    cert: fs_1.readFileSync(process.env.CERT_FILE),
    SNICallback: function (domain, cb) {
        if (!fs_1.existsSync("/etc/letsencrypt/live/" + domain)) {
            cb();
            return;
        }
        cb(null, require("tls").createSecureContext({
            key: fs_1.readFileSync("/etc/letsencrypt/live/" + domain + "/privkey.pem"),
            cert: fs_1.readFileSync("/etc/letsencrypt/live/" + domain + "/fullchain.pem")
        }));
    }
};
app.get("/favicon.ico", require("./routes/favicon").favicon);
app.use("/app", express.static(__dirname + "/static"));
var WebSocketServer = require("ws").Server;
var httpsServer = https.createServer(exports.httpsTLS, app);
var signalServer = new (require("./src/signal").Server)();
var rtcServer = new WebSocketServer({ noServer: true });
var rtcHandler = require("./lib/rtcsignal").rtcHandler;
rtcServer.on("connection", rtcHandler);
httpsServer.on("upgrade", function upgrade(request, socket, head) {
    var pathname = require("url").parse(request.url).pathname;
    if (pathname.match(/signal/)) {
        signalServer.wss.handleUpgrade(request, socket, head, function done(ws) {
            // // const dbuser = db.getOrCreateUser(request.headers["set-cookie"]);
            // signalServer.requestContext[
            //   request.headers["sec-websocket-key"]
            // ] = dbuser;
            signalServer.wss.emit("connection", ws, request);
        });
    }
    else if (pathname.match(/rtc/)) {
        rtcServer.handleUpgrade(request, socket, head, function done(ws) {
            rtcServer.emit("connection", ws, request);
        });
    }
});
httpsServer.on("connection", function connection(request, socket, head) { });
var port = process.argv[2] || 443;
httpsServer.listen(port); //process.argv[2] || 3000);
console.log("listening on " + port); //
