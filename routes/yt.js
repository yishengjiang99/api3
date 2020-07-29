"use strict";
exports.__esModule = true;
exports.ytmp3 = void 0;
var ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
var ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
var ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
var PassThrough = require("stream").PassThrough;
function ytmp3(req, res) {
    try {
        var stream = ytdl("https://www.youtube.com/watch?v=" + req.params.vid, {
            filter: "audio"
        }).on("error", console.error);
        var ffm = ffmpeg(stream);
        var start = void 0;
        if (req.query.t && (start = parseInt(req.query.t)))
            ffm.addOption("-ss " + ~~(start / 60) + ":" + start % 60);
        res.writeHead(200, {
            "Content-Type": "audio/mp3"
        });
        ffm.format("mp3").pipe(new PassThrough()).pipe(res);
    }
    catch (e) {
        console.log(e);
    }
}
exports.ytmp3 = ytmp3;
//module.exports = router;
