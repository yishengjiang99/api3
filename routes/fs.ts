import {
	readdir,
	existsSync,
	statSync,
	createReadStream,
	readdirSync,
	exists,
} from "fs";
import { resolve } from "path";

var express = require("express");
var router = express.Router();

const rootdir = resolve(__dirname, "..", "public");

function renderDirectory(dir, res, cwd) {
	const nodes = readdirSync(dir);
	const links = nodes.map((n) => ({
		name: n,
		href: `${cwd}/${n}`,
	}));
	return res.render(
		"tracklist",
		{
			cwd: dir,
			tracks: links,
		},
		(err, html) => {
			res.end(html);
		}
	);
}
router.get("/", async (req, res) => {
	return renderDirectory(rootdir, res, req.baseUrl);
});
router.get("/:path", (req, res) => {
	const path = resolve(rootdir, req.params.path);
	console.log(path);
	if (existsSync(path) === false) {
		res.writeHead(404);
		res.end();
	} else if (statSync(path).isFile()) {
		res.sendFile(path);
	} else {
		return renderDirectory(path, res, req.baseUrl);
	}
});

module.exports = router;
