import { WebSocket } from 'ws';
import { resolve } from 'path';
import { createReadStream } from 'fs';
import { ReadStream } from 'tty';

const rootDir = resolve(process.env.HOME, 'api3/dbfs');

export const readFile = function (filename: string, ws: WebSocket) {

    let rs = createReadStream(resolve(rootDir, filename), { autoClose: true })
    rs.on("open", () => {
        console.log('open')
    })

    rs.on('data', (data) => {
        ws.send(data);
    })


}