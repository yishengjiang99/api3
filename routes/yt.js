"use strict";
exports.__esModule = true;
var express = require("express");
var db = require("../src/db");
//const db = require("../src/db");
var app = express();
var router = express.Router();
var ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
var ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
var PassThrough = require("stream").PassThrough;
//https://www.youtube.com/watch?v=QFcv5Ma8u8k
router.get("/", function (req, res) {
    // res.writeHead(200, "one moemnt", {
    //   "Content-Type": "text/html"
    // });
    db.dbQuery("select id as vid, title,description from ytvid limit 11")
        .then(function (rows) {
        res.render("video.jsx", { videos: rows }, function (err, html) {
            if (err)
                res.end(err.message);
            res.write(html);
            res.end();
        });
    })["catch"](function (err) {
        console.log(err);
        res.end(err.message);
    });
});
router.get("/(:search)", function (req, res) {
    try {
        var youtube_api_key = process.env.google_key;
        var url = "https://www.googleapis.com/youtube/v3/search?type=video" +
            ("&part=snippet&maxResults=" + 10 + "&q=" + req.params.search + "&key=" + youtube_api_key);
        res.end(url + "\n\n");
        var format = req.params.format || ".mp3";
        db.queryYt(req.params.search, 1, function (items) {
            if (items[0]) {
                res.redirect("/yt/vid/" + items[0].id.videoId + ".mp3");
            }
            else {
                res.status(404);
            }
        });
    }
    catch (e) {
        res.statusMessage = e.message;
        res.statusCode = 500;
        res.end();
    }
});
router.get("/vid/(:vid).mp3", function (req, res) {
    try {
        var stream = ytdl("https://www.youtube.com/watch?v=" + req.params.vid, {
            filter: "audio"
        }).on("error", console.error);
        var ffm = ffmpeg(stream);
        var start = void 0;
        if (req.query.t)
            ffm.addOption("-ss " + ~~(start + 0 / 60) + ":" + start % 60);
        res.writeHead(200, {
            "Content-Type": "audio/mp3"
        });
        ffm.format("mp3").pipe(new PassThrough()).pipe(res);
    }
    catch (e) {
        console.log(e);
    }
});
router.get("/search/:query", function (req, res) {
    console.log(process.env.hostname);
    var query = req.params.query;
    db.queryYt(query, res);
});
// const test = function (query: string) {
//   const youtube_api_key = process.env.google_key
//   const url = `https://www.googleapis.com/youtube/v3/search?type=video`
//     + `&part=snippet&maxResults=10&q=${query}&key=${youtube_api_key}`;
//   Axios.get(url).then(resp => console.log(resp.data)).then(respp => response.res.data.error).catch(console.error);
// }
exports["default"] = router;
//module.exports = router;
