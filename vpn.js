function proxy_pass(https, pathname, port) {
  debugger;
  https.on("connect", (req, clientSocket, header) => {
    const { _pathname } = require("parse-url").parse(req.url);
    if (_pathname != pathname) pathname = "/";

    const proxy = require("net").connect({
      host: "127.0.0.1",
      port: port,
    });
    debugger;
    proxy.on("close", () => clientSocket.close());
    proxy.on("error", (error) => clientSocket.end("HTTP/1.1 500 rekt \r\n"));
    clientSocket.on("close", () => proxy.close());
    clientSocket.on("connect", function () {
      clientSocket.write(
        "HTTP/1.1 200 YOU GOT MAIL!! \r\n" +
          "Proxy-agent: Yisheng Jiang" +
          "\r\n\r\n"
      );
    });
  });
}
module.exports = {
  proxy_pass,
};
function test() {
  const fs = require("fs");
  var server = require("https").createServer(
    {
      key: fs.readFileSync(process.env.PRIV_KEYFILE),
      cert: fs.readFileSync(process.env.CERT_FILE),
    },
    (req, res) => {
      res.end("sss");
    }
  );
  module.exports.proxy_pass(server, "/", 3000);
  server.listen(443);
}

test();
