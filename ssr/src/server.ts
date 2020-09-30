import { resolve } from "path";
import { readFileSync } from "fs";
import * as express from "express";
import axios from "axios";
import { createElement as h } from 'react';
import { renderToString as rts, renderToNodeStream } from 'react-dom/server';

const page = readFileSync(resolve(__dirname, "views/spotifylayout.html"))
	.toString()
	.split("<!--BREAK-->");
const critcss = readFileSync(resolve(__dirname, "views/critic.css"));
const critjs = readFileSync(resolve(__dirname, "../dist/bundle.js"));
const browserJS = readFileSync(resolve(__dirname, "./client/jquery.jk.js"))
require("@babel/register")(JSON.parse(readFileSync("./.babelrc").toString()));
const { NowPlaying, PlayListMenu, SpotifyFooter, TrackList } = require("./client/"); //.jsack");

const { Readable } = require("stream");
var cookieParser = require("cookie-parser");

var router = express.Router();

const mockStdk = require("./staticMocks");
const writeStreamSync = (stream, content) =>
	new Promise((resolve) => {
		stream.write(content, () => resolve(true));
	});

const renderElement = (response, element) =>
	new Promise((resolve, reject) => {
		const stream = renderToNodeStream(element);
		stream.pipe(response);
		stream.on("end", resolve);
		stream.on("error", (e) => {
			console.log("======", e);
			reject(e);
		});
	});
router.use(cookieParser());

router.get("/bundle.js", (req,res)=>{
	res.sendFile(resolve(__dirname,"../dist/bundle.js"));
});
router.get("(/list/)?(:listId)?", async function (req, res) {
	const API_DIR = "https://api.spotify.com/v1";
	const access_token = checkAuth(req, res);
	const apiRequestHeaders = {
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + access_token,
		},
	}
	res.writeHead(200, "welcome", { "Content-Type": "text/html" });
	let listId = req.params.listId || "1ZSGautkUpYJTOo6TfHoXi" /*best rap music*/;
	const part1Wrote = writeStreamSync(res, page[0]); //

	const trackListGot = axios.get(API_DIR + "/playlists/" + listId + "/tracks", apiRequestHeaders);
	const playListGot = axios.get(API_DIR + "/me/playlists", apiRequestHeaders);

	await part1Wrote;
	await writeStreamSync(res, `<div id="root" class="mui-container">`);

	const trackList = await trackListGot.then(resp => resp.data);

	const sanitizedTrackList = (trackList.tracks || trackList.items || []).map(item => {
		const _item = item.track || item;
		return {
			imgURL: [].concat(_item.album && _item.album.images)[0].url,
			name: _item.name,
			artist: [].concat(_item.artists).map(a => a.name).join(", "),
			id: _item.id
		}
	});
	await renderElement(res, NowPlaying({ item: sanitizedTrackList[0] }));
	await renderElement(res, TrackList({ trackList: sanitizedTrackList || [] }));
	const playlists = await playListGot.then(resp => resp.data);
	const playlistsSanitied = playlists.items.map(p => {
		return {
			id: p.id,
			name: p.name
		}
	})
	await writeStreamSync(
		res,
		rts(PlayListMenu({ playlists: playlistsSanitied }))
	);
	await renderElement(res, SpotifyFooter());
	await writeStreamSync(res, `<script>
	window.access_token='${access_token}';
	 	${browserJS} 
	 </script>`);
	await writeStreamSync(res, "</div>"); //end of root container;

	await writeStreamSync(res, `<span id='datarepo' style='display:none'>${JSON.stringify(sanitizedTrackList)}</span>`);
	await writeStreamSync(res, `
	<script>
	window.access_token='${access_token}';
	window.reactHydrate();
	</script>`);
	await writeStreamSync(res, page[1]);
	res.end();

});
function checkAuth(req, res) {
	if (req.query.access_token && req.query.expiry)
	{

		res.cookie('access_token', req.query.access_token);
		res.cookie('refresh_token', req.query.refresh_token);
		res.cookie('expiry', req.query.expiry);

	}
	const access_token = req.query.access_token || req.cookies['access_token'];
	const expiry = req.query.expiry || req.cookies['expiry'];
	if (expiry && expiry < new Date().getTime())
	{
		res.cookie("access_token", null);
		res.cookie("expiry", null);
		res.redirect("/auth");
	}
	if (!access_token)
	{
		res.redirect("/auth");
	}
	return access_token;

}

router.get("/event/:event", (req, res) => {
	//res.end("ok");
	console.log(req.session.id, req.params.event);
	res.end("ok");
});


if (require.main === module)
{
	const app = express();
	app.use(require("expre"));
	app.use("/spotify", router);
	app.listen(3000);
}
module.exports = router;
