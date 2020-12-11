var HttpProxyRules = require("http-proxy-rules");
var proxyRules = new HttpProxyRules({
  rules: {
    "media.grepawk.com/app": "http://localhost:8081/snow/build",
    ".*/bach": "http://localhost:8081/bach",
    ".*/pcm/*": "http://localhost:8081/list",
    ".*/upload/*": "ws://localhost:5150",
    ".*/tty": "ws://localhost:8080",
  },
});
var proxy = require("http-proxy").createProxy();

export const linkMain = (mainapp) =>
  mainapp.use(function (req, res, next) {
    try {
      if (req.url.substr(0, 18).indexOf("socket.io") > -1) {
        //console.log("SOCKET.IO", req.url)
        return proxy.web(
          req,
          res,
          { target: "wss://localhost:4567", ws: true },
          function (e) {
            //console.log('PROXY ERR',e)
          }
        );
      } else {
        var target = proxyRules.match(req);
        if (target) {
          //console.log("TARGET", target, req.url)
          return proxy.web(
            req,
            res,
            {
              target: target,
            },
            function (e) {
              //console.log('PROXY ERR',e)
            }
          );
        } else {
          next();
        }
      }
    } catch (e) {
      res.sendStatus(500);
    }
  });
