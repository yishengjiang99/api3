const h = require("http").createServer();
h.on("connection", (c) => {
  c.end("HTTP/1.1 302 https://www.grepawk.com \n\n");
});

h.listen(8082);
