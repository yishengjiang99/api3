import { Transform } from "stream";
import { listContainerFiles } from "./list-blobs";
import { tty } from "tty";
require("http")
  .createServer((req, res) => {
    res.writeHead(200);
    res.write(`<html><body><pre>`);
    const f = listContainerFiles("pcm");
    f.pipe(pttt);

    const g = listContainerFiles("midi");
    g.pipe(pttt).pipe(res);
    g.on("end", () => {
      res.end("</pre></body></html>");
    });
  })
  .listen(3002);
const pttt = new Transform({
  objectMode: true,
  transform: (
    { name, properties: { url, contentLength, blobType } },
    _,
    cb
  ) => {
    cb(null, "\n" + [name, url, contentLength, blobType]);
  },
});
