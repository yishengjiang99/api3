import { render } from "react-dom";
import Axios, { AxiosResponse } from "axios";
import * as express from "express";
import * as db from "../src/db";
import { createEngine } from "../src/express-react-forked";
//const db = require("../src/db");
const app = express();
const router: express.Router = express.Router();

const ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const PassThrough = require("stream").PassThrough;
//https://www.youtube.com/watch?v=QFcv5Ma8u8k

router.get("/", (req, res) => {
  // res.writeHead(200, "one moemnt", {
  //   "Content-Type": "text/html"
  // });

  db.dbQuery(`select id as vid, title,description from ytvid limit 11`)
    .then((rows) => {
      res.render("video.jsx", { videos: rows }, (err, html) => {
        if (err) res.end(err.message);
        res.write(html);
        res.end();
      });
    })
    .catch((err) => {
      console.log(err);
      res.end(err.message);
    });
});
router.get("/vid/(:vid).mp3", (req, res) => {
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

router.get("/(:search)", (req, res) => {
  try {
    const youtube_api_key = process.env.google_key;
    const url =
      `https://www.googleapis.com/youtube/v3/search?type=video` +
      `&part=snippet&maxResults=${10}&q=${
      req.params.search
      }&key=${youtube_api_key}`;
    res.end(url + "\n\n");
    const format = req.params.format || ".mp3";
    db.queryYt(req.params.search, 1, function (items) {
      if (items[0]) {
        res.redirect(`/yt/vid/${items[0].id.videoId}.mp3`);
      } else {
        res.status(404);
      }
    });
  } catch (e) {
    res.statusMessage = e.message;
    res.statusCode = 500;
    res.end();
  }
});

router.get("/search/:query", (req, res) => {
  console.log(process.env.hostname);

  const query = req.params.query;
  db.queryYt(query, res);
});

// const test = function (query: string) {
//   const youtube_api_key = process.env.google_key
//   const url = `https://www.googleapis.com/youtube/v3/search?type=video`
//     + `&part=snippet&maxResults=10&q=${query}&key=${youtube_api_key}`;
//   Axios.get(url).then(resp => console.log(resp.data)).then(respp => response.res.data.error).catch(console.error);

// }
export default router;

//module.exports = router;
