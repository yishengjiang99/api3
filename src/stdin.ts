/*eslint-disable no-console*/
import { BlobService, createBlobService, ErrorOrResult } from "azure-storage";
import * as url from "url";

const blobService: BlobService = createBlobService();

export const stdinHandler = async (ws, request) => {
  debugger;
  let exitCode = 1;
  console.log("on connection  ")
  const xpath = url.parse(request.url).pathname.replace("/stdin/", "");
  const parts = xpath.split("/");

  const container = "sounds";
  const blobname = parts.join("-");

  const fh = blobService.createWriteStreamToBlockBlob(container, blobname, (err, result, response) => {
    if (err) ws.write("err:  " + err.message);
    ws.write("writing to ");
    ws.write(blobService.getUrl(container, blobname));
  });

  fh.on("error", (err) => {
    ws.send("ERR:" + err.message);
  });
  ws.on("message", (message) => {

    if (message.trim() === "url") {
      const url = blobService.getUrl(container, blobname);
      ws.send(url);
    } else if (message.trim() === "EOF") {
      fh.end();
      ws.send("writing to " + xpath);
      ws.close();
    } else {
      fh.write(message);
      ws.send("> ");
    }
  });

  ws.on("close", () => {
    console.log("closed on code " + exitCode);
  });

  console.log(parts, container);


};
