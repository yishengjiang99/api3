import * as azfs from "./azfs";
import * as url from "url";
import { Stream } from "stream";

export const stdoutHandler = async (ws, request) => {
  var exitCode = 1;
  const xpath = url.parse(request.url).pathname.replace("/stdout/", "");
  const reader = await azfs.fopenr(xpath);

  reader.on("data", (data) => ws.send(data));
  reader.on("error", (e) => {
    ws.send("read error error " + e.message);
  });

  reader.on("end", () => {
    ws.write("eof for now");
  });

  ws.on("close", () => {
    console.log("closed on code " + exitCode);
  });
};
//stdoutHandlermodule.exports = ;

