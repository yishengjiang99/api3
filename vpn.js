"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.proxy_pass = exports.esponseType = void 0;
var fs = require("fs");
var net_1 = require("net");
var esponseType;
(function (esponseType) {
    esponseType[esponseType["PASSTHROUGH"] = -1] = "PASSTHROUGH";
    esponseType[esponseType["RESPONSE404"] = -404] = "RESPONSE404";
    esponseType[esponseType["DISCONNECT"] = -402] = "DISCONNECT";
})(esponseType = exports.esponseType || (exports.esponseType = {}));
var keys = {
    key: fs.readFileSync(process.env.PRIV_KEYFILE),
    cert: fs.readFileSync(process.env.CERT_FILE)
};
exports.proxy_pass = function (clientSocket, destination) {
    var host = destination.host, port = destination.port, path = destination.path;
    var proxyPass = net_1.connect(__assign({
        host: "127.0.0.1",
        port: 300,
        path: "/"
    }, {
        host: host, port: port, path: path
    }));
    proxyPass.on("error", function (evt) { return clientSocket.end("HTTP/1.1 500 rekt"); });
    proxyPass.on("end", function () { return clientSocket.end("e"); });
    clientSocket.on("end", function () { return proxyPass.end("2"); });
    clientSocket.on("connect", function () {
        clientSocket.write("HTTP/1.1 200 YOU GOT MAIL!! \r\n" +
            "Proxy-agent: Yisheng Jiang" +
            "\r\n\r\n");
    });
};
