var express = require("express");
var router = express.Router();
import * as fs from "fs";
import { resolve } from "path";
import * as linfs from "../src/linfs";
router.get("/:path", (req, res) => {
  const path = resolve(linfs.rootdir, req.params.path);
  (fs.existsSync(path) === false && res.status(404) && res.end("404")) ||
    (fs.statSync(path).isFile() && fs.createReadStream(path).pipe(res)) ||
    fs.readdir(path, (err, output) => {
      res.end(require("serve-index")(path).html);
    });
});
router.get("/read/:path", (req, res) => {
  const path = resolve(linfs.rootdir, req.params.path);
  fs.createReadStream(path).pipe(res);
});
module.exports = router;
