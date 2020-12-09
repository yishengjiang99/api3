import { createServer } from 'http';
import { resolve } from 'path';
import { openSync, readSync, readFileSync, createReadStream } from 'fs';
module.exports = () => {
  const idnex = resolve(__dirname, 'index.html');
  createServer(async (req, res) => {
    // if (req.url === 'favicon.ico') {
    //   res.write(Buffer.alloc(2700).fill(0xff)) && res.end();
    //   return;
    // }
    if (req.method === 'GET') {
      createReadStream(resolve(__dirname, 'index.html')).pipe(res);
      return;
    }
    const fd = openSync('/Applications/Hearthstone/Data/OSX/f32be-ac2-44100.PCM', 'r');
    let offset = 0;
    let size = 4 * 512 * 300; //seconds;
    let ob = Buffer.alloc(size);
    let ob2 = Buffer.alloc(size);
    let read = readSync(fd, ob, 0, size, offset);
    offset += size;
    let read2;
    let p2;
    while (true) {
      res.write(ob);
      const p1 = new Promise(resolve => {
        req.on('data', d => {
          resolve();
        })
      });
      await p1;
      read2 = readSync(fd, ob2, 0, size, offset);

      p2 = new Promise(resolve => {
        req.on('data', d => {
          resolve();
        });
      });
      read = readSync(fd, ob, 0, size, offset);
      await p2;
    }
  }).listen(3333);

}