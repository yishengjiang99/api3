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

interface DestinationProp {
  host?: string,
  port?: number,
  path?: string
}

export const proxy_pass = (clientSocket, destination: DestinationProp) => {
  const { host, port, path } = destination;

  const proxyPass = connect({
    ...{
      host: "127.0.0.1",
      port: 300,
      path: "/"
    },
    ...{
      host, port, path
    }
  });
  proxyPass.on("error", (evt) => clientSocket.end(`HTTP/1.1 500 rekt`));
  proxyPass.on("end", () => clientSocket.end("e"));
  clientSocket.on("end", () => proxyPass.end("2"));
  clientSocket.on("connect", () => {
    clientSocket.write(
      `HTTP/1.1 200 YOU GOT MAIL!! \r\n` +
      "Proxy-agent: Yisheng Jiang" +
      "\r\n\r\n"
    );
  });
}
