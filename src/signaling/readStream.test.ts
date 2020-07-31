import * as WebSocket from "ws";
import { readFile } from './readFile';

async function initWss() {
    return new Promise((resolve, reject) => {
        const _wss = new WebSocket.Server({ port: 3544 });
        wss.on("connection", function connection(ws: WebSocket) {
            ws.on("message", function incoming(msg) {
                ws.send(msg);
            })
            resolve(_wss);
        });
    })
}

let wss, ws;
test('start server', async function () {
    wss = await initWss();
    expect(wss).toBeTruthy();
})

test("connects to server ", (done) => {
    ws = new WebSocket("ws://localhost:3544");
    ws.addEventListener("open", (event) => {
        done();
        ws.send("hi");
    })
})

afterAll(function () {
    wss.stop();
})