import * as fs from "fs";
import * as http from "http";
import { createServer, Server } from "https";
import { connect, Socket, createConnection } from "net";

interface DestinationProp {
	host: string;
	port: number;
	path: string;
}

export const proxy_pass = (clientSocket, destination: DestinationProp) => {
	const proxyPass = createConnection({ port: destination.port }, () => {
		proxyPass.on("connect", (evt) => {
			clientSocket.write("HTTP/1.1 200 OK \r\n");
		});
		proxyPass.on("error", (evt) =>
			clientSocket.end(`HTTP/1.1 500 ${evt.message}`)
		);
		proxyPass.on("end", () => clientSocket.write("\r\n\r\n"));
		proxyPass.on("data", (d) => clientSocket.write(d));
	});
};
