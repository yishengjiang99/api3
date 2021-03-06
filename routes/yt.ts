import { render } from "react-dom";
import Axios, { AxiosResponse } from "axios";
import * as express from "express";
import { spawn, execSync } from "child_process";
const app = express();
const router: express.Router = express.Router();


const ffpath = execSync("which ffmpeg").toString();
const PassThrough = require("stream").PassThrough;
const vds = JSON.parse(require('fs').readFileSync("./roues").toString());

router.get("/", (req, res) => {
	res.render("video.jsx", { videos: vds }, (err, html) => {
		if (err) res.end(err.message);
		res.write(html);
		res.end();
	});
});
router.get("/vid/(:vid).mp3", (req, res) => {
	try
	{
		const stream = spawn(
			"youtube-dl",
			`--extracyoutube-dl -f 251 https://www.youtube.com/watch?v=${req.params.vid} -o -`.split(
				" "
			)
		);
		res.writeHead(200, {
			"Content-Type": "audio/mp3",
		});
		const ffmpeg = spawn(`${ffpath}`, `-i pipe:0 -f mp3 -`.split(" "));
		stream.stdout.pipe(ffmpeg.stdin);
		ffmpeg.stdout.pipe(new PassThrough()).pipe(res);
	} catch (e)
	{
		console.log(e);
	}
});

export default router;

//module.exports = router;
