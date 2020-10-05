"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
exports.__esModule = true;
var express = require("express");
var child_process_1 = require("child_process");
//const db = require("../src/db");
var app = express();
var router = express.Router();
var ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
var PassThrough = require("stream").PassThrough;
var vds = JSON.parse(require('fs').readFileSync("./roues").toString());
router.get("/", function (req, res) {
    res.render("video.jsx", { videos: vds }, function (err, html) {
        if (err)
            res.end(err.message);
        res.write(html);
        res.end();
    });
});
router.get("/vid/(:vid).mp3", function (req, res) {
    try {
        var shx = function (str) { return child_process_1.spawn(str[0], str.slice(0)); };
        var stream = child_process_1.spawn("youtube-dl", ("--extracyoutube-dl -f 251 https://www.youtube.com/watch?v=" + req.params.vid + " -o -").split(" "));
        res.writeHead(200, {
            "Content-Type": "audio/mp3"
        });
        var ffmpeg = shx(templateObject_1 || (templateObject_1 = __makeTemplateObject(["ffmpeg -i pipe:0 -f mp3 -"], ["ffmpeg -i pipe:0 -f mp3 -"])));
        stream.stdout.pipe(ffmpeg.stdin);
        ffmpeg.stdout.pipe(new PassThrough()).pipe(res);
    }
    catch (e) {
        console.log(e);
    }
});
exports["default"] = router;
var templateObject_1;
//module.exports = router;
