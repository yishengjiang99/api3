export const linkMain = (mainapp) => {
  const HttpProxyRules = require("http-proxy-rules");
  var proxyRules = new HttpProxyRules({
    rules: {
      "/bach(.*?)": "http://localhost:8081$1",
    },
  });

  var proxy = require("http-proxy").createProxy();
  mainapp.use(function (req, res, next) {
    try {
      var target = proxyRules.match(req);
      if (target) {
        console.log("TARGET", target, req.url);
        return proxy.web(
          req,
          res,
          {
            target: target,
          },
          function (e) {
            console.log("PROXY ERR", e);
          }
        );
      } else {
        next();
      }
    } catch (e) {
      console.trace(e);
      res.sendStatus(500);
    }
  });
};
