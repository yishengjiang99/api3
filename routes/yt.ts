import { render} from "react-dom";
import Axios, { AxiosResponse } from "axios";
import * as express from 'express';

const app = express();
const router: express.Router = express.Router();
router.search("/search/:query", [function(req,res){

}]);

const ytdl = require("ytdl-core");
// const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);
const PassThrough = require("stream").PassThrough;

//https://www.youtube.com/watch?v=QFcv5Ma8u8k

router.get("/", (req,res)=>{
  res.render("video.jsx",{
    vid:'QFcv5Ma8u8k', 
  layout:"layout.html"},
  (err,html)=>{
    if(err){
      res.end(err.message);
    }
  })

  
})

router.get("/(:vid).mp3", (req,res)=>{
  try {
    const stream = ytdl(`https://www.youtube.com/watch?v=${req.params.vid}`, {
      filter: "audio",
    }).on("error", console.error);

    const ffm = ffmpeg(stream);
    let start;
    if (req.query.t)
      ffm.addOption(`-ss ${~~(start+0 / 60)}:${start % 60}`);

    res.writeHead(200, {
      "Content-Type": "audio/mp3",
    });
    ffm.format("mp3").pipe(new PassThrough()).pipe(res);
  } catch (e) {
    console.log(e);
  }
})

router.get("/search/:query", (req,res)=>{
  if(process.env.hostname!=='www.grepawk.com'){
    return 
  }
  const query = req.params.query;
  const youtube_api_key = process.env.google_key
  const url = `https://www.googleapis.com/youtube/v3/search?type=video\
  &part=snippet&maxResults=10&q=${query}&key=${youtube_api_key}`;
  Axios.get(url).then(function(resp:AxiosResponse){
    console.log(resp);
    res.json(resp);
  }).catch(console.error);
});

export default router;

//module.exports = router;
