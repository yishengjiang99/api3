var express = require("express");
var router = express.Router();
import * as fs from "fs";
import { resolve } from "path";
import * as linfs from "../src/linfs";
import * as serveIndex from "serve-index";

router.get("/", serveIndex(linfs.rootdir));

router.get("/read/:path", (req, res) => {
	const path = resolve(linfs.rootdir, req.params.path);
	fs.createReadStream(path).pipe(res);
});
module.exports = router;
