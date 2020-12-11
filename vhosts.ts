import { readFile, readFileSync, existsSync } from "fs";
import * as express from "express";
import * as tls from 'tls';
import {httpsTLS}from'./tls';
const vhost = require("vhost");
const app = express();



app.use(vhost("piano.grepawk.com", express.static("../piano/build")));
app.use(vhost("dsp.grepawk.com", express.static("../grepaudio")));
app.use(vhost("api.grepawk.com", app.search("/:library", (req, res, next) => {
  res.end("may you find lib " + req.params.library);
})