import * as fs from "fs";
import * as http from "http";
import { createServer, Server } from "https";
import { connect, Socket } from "net";
import { parse } from "url";

export enum esponseType {
  PASSTHROUGH = -1,
  RESPONSE404 = -404,
  DISCONNECT = -402,
}
interface VpnOptions {
  httpsServer?: Server;
  map: (string) => number;
}
const keys = {
  key: fs.readFileSync(process.env.PRIV_KEYFILE),
  cert: fs.readFileSync(process.env.CERT_FILE),
};

export class VPN {
  server: Server;
  map: (string) => number | null;

  constructor(options) {
    this.server = options.httpsServer;

    this.map =
      options.map ||
      function (pathname) {
        return 3000;
      };

    this.server.on("connect", this._handleConnect);
  }

  _handleConnect(
    req: http.IncomingMessage,
    clientSocket: Socket,
    head: Buffer
  ) {
    const { path, hostname, pathname } = parse(req.url);
    const port = this.map(pathname);
console.log(path,hostname,pathname);
    if (!port) {
      clientSocket.end("HTTP/1.1 404 not found \r\n");
      return;
    }
    if (port == -1) {
      return; //passthrough
      //      this.server.handleConnect(req, clientSocket, head);
    }

    const proxyPass = connect({
      host: hostname,
      port: port,
      path: path,
    });

    proxyPass.on("error", (evt) => clientSocket.end(`HTTP/1.1 500 rekt`));
    proxyPass.on("end", () => clientSocket.end());
    clientSocket.on("end", () => proxyPass.end());
    clientSocket.on("connect", () => {
      clientSocket.write(
        `HTTP/1.1 200 YOU GOT MAIL!! \r\n` +
          "Proxy-agent: Yisheng Jiang" +
          "\r\n\r\n"
      );
    });
  }
}
