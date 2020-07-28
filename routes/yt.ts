const ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const PassThrough = require("stream").PassThrough;

export function ytmp3(req, res) {
  try {
    const stream = ytdl(`https://www.youtube.com/watch?v=${req.params.vid}`, {
      filter: "audio",
    }).on("error", console.error);

    const ffm = ffmpeg(stream);
    let start;
    if (req.query.t && (start = parseInt(req.query.t)))
      ffm.addOption(`-ss ${~~(start / 60)}:${start % 60}`);

    res.writeHead(200, {
      "Content-Type": "audio/mp3",
    });
    ffm.format("mp3").pipe(new PassThrough()).pipe(res);
  } catch (e) {
    console.log(e);
  }
}

//module.exports = router;
