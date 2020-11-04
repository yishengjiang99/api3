"use strict";
exports.__esModule = true;
exports.proxy_pass = void 0;
var net_1 = require("net");
exports.proxy_pass = function (clientSocket, destination) {
    var proxyPass = net_1.createConnection({ port: destination.port }, function () {
        proxyPass.on("connect", function (evt) {
            clientSocket.write("HTTP/1.1 200 OK \r\n");
        });
        proxyPass.on("error", function (evt) { return clientSocket.end("HTTP/1.1 500 " + evt.message); });
        proxyPass.on("end", function () { return clientSocket.write("\r\n\r\n"); });
        proxyPass.on("data", function (d) { return clientSocket.write(d); });
    });
};
