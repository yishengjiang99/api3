import { render } from "react-dom";
import Axios, { AxiosResponse } from "axios";
import * as express from "express";
import * as db from "../src/db";
import { createEngine } from "../src/express-react-forked";
//const db = require("../src/db");

const router: express.Router = express.Router();
router.use(
	express.urlencoded({
		extended: false,
	})
);

const ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const PassThrough = require("stream").PassThrough;
//https://www.youtube.com/watch?v=QFcv5Ma8u8k

router.get("/", (req, res) => {
	db.dbQuery(
		`select id as vid, title,description from ytvid where title !='222' limit 11`
	)
		.then((rows) => {
			return res.render("video", { videos: rows });
		})
		.catch((err) => {
			console.log(err);
			return res.end(err.message);
		});
	// res.end("dd");
});
router.post("/", (req, res) => {
	// const query = req.body;
	// return res.end(JSON.stringify(req.body));
	// db.queryYt(query, (items) => {
	// 	return res.render("video", { videos: items });
	// });
	// console.log(req.body.query);
	// res.end(req.body.query);
	db.queryYt(req.body.query, (items) => {
		return res.render("video", { videos: items });
	});
});
router.get("/(:vid).mp3", (req, res) => {
	try {
		const stream = ytdl(`https://www.youtube.com/watch?v=${req.params.vid}`, {
			filter: "audio",
		}).on("error", console.error);

		const ffm = ffmpeg(stream);
		let start;
		if (req.query.t) ffm.addOption(`-ss ${~~(start + 0 / 60)}:${start % 60}`);

		res.writeHead(200, {
			"Content-Type": "audio/mp3",
		});
		ffm.format("mp3").pipe(new PassThrough()).pipe(res);
	} catch (e) {
		console.log(e);
	}
});
router.get("/search/:query", (req, res) => {
	console.log(process.env.hostname);

	const query = req.params.query;
	db.queryYt(query, (items) => res.json(items));
});

export default router;

//module.exports = router;
