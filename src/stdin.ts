/*eslint-disable no-console*/
import azfs from "./azfs";
import * as url from "url";
import { runInThisContext } from "vm";

export const stdinHandler = (ws, request) => {
  let exitCode = 1;
  const xpath = url.parse(request.url).pathname.replace("/stdin/", "");
  const parts = xpath.split("/");

  const container = parts[0] ? parts[0] : "public_file";
  const blobname = parts[1] ? parts[1] : "new_file.txt";
  const fh = azfs.fopenw(xpath);

  fh.on("error", (err) => {
    ws.send("ERR:" + err.message);
  });

  ws.on("message", (message) => {
    if (message.trim() === "commit") {
      azfs.blobClient.createBlobSnapshot(container, blobname, (err, resul) => {
        if (err) ws.send(err.message);
        else ws.send(JSON.stringify(resul));
      });
    } else if (message.trim() === "url") {
      const url = azfs.blobClient.getUrl(container, blobname);
      ws.send(url);
    } else if (message.trim() === "EOF") {
      fh.end();
      ws.send("writing to " + xpath);
      ws.close();
    } else {
      fh.write(message);
      ws.send(">" + message);
    }
  });

  ws.on("close", () => {
    console.log("closed on code " + exitCode);
  });
};
