import { render } from "react-dom";
import Axios, { AxiosResponse } from "axios";
import * as express from "express";
import { createEngine } from "../src/express-react-forked";
import { fs } from "memfs";
import { spawn } from "child_process";
//const db = require("../src/db");
const app = express();
const router: express.Router = express.Router();

const ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");

const PassThrough = require("stream").PassThrough;
const vds = JSON.parse(fs.readFileSync("./roues").toString());

router.get("/", (req, res) => {
	res.render("video.jsx", { videos: vds }, (err, html) => {
		if (err) res.end(err.message);
		res.write(html);
		res.end();
	});
});
router.get("/vid/(:vid).mp3", (req, res) => {
	try {
		const shx = (str: TemplateStringsArray) => spawn(str[0], str.slice(0));
		const stream = spawn(
			"youtube-dl",
			`--extracyoutube-dl -f 251 https://www.youtube.com/watch?v=${req.params.vid} -o -`.split(
				" "
			)
		);
		res.writeHead(200, {
			"Content-Type": "audio/mp3",
		});
		const ffmpeg = shx`ffmpeg -i pipe:0 -f mp3 -`;
		stream.stdout.pipe(ffmpeg.stdin);
		ffmpeg.stdout.pipe(new PassThrough()).pipe(res);
	} catch (e) {
		console.log(e);
	}
});

export default router;

//module.exports = router;
