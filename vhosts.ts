import { readFile, readFileSync, existsSync } from "fs";
import * as express from "express";
import * as tls from 'tls';

const vhost = require("vhost");
const app = express();

export const httpsTLS = () => {
  key: readFileSync(process.env.PRIV_KEYFILE),
    cert: readFileSync(process.env.CERT_FILE),
      SNICallback: function (domain, cb) {
        if (!existsSync(`/etc/letsencrypt/live/${domain}`)) {
          cb();
        }
        cb(null, tls.createSecureContext({
          key: readFileSync(`/etc/letsencrypt/live/${domain}/privkey.pem`),
          cert: readFileSync(`/etc/letsencrypt/live/${domain}/fullchain.pem`),
        })

      }
}

app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", express.static("../grepaudio")));
app.use(vhost("api.grepawk.com", app.search("/:library", (req, res, next) => {
  res.end("may you find lib " + req.params.library);
})