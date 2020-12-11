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

const rootdir = resolve(__dirname, "..", "public/ftp");

function renderDirectory(dir, res, cwd) {
	const nodes = readdirSync(dir,{
		withFileTypes:true
	});
	console.log(nodes);
	const links = nodes.map((n) => ({
		name: n.name,
		href: `${cwd}/${n.name}`,
		type: n.isBlockDevice
		
	}));
	return res.render("tracklist.jsx",
		{
			layout:"lay.html",
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
router.get("/:file", async (req, res) => {
	res.header("content-type",require("mime-types").lookup(req.params.file));
createReadStream(resolve(rootdir,req.params.file)).pipe(res);

});

module.exports = router;
