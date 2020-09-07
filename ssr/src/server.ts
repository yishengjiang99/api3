import { resolve } from "path";
import { readFileSync, write } from "fs";
import * as express from "express";
import axios from "axios";
const API_DIR = "https://api.spotify.com/v1";

const React = require("react");
const ReactDom = require("react-dom/server");
const page = readFileSync(resolve(__dirname, "views/spotifylayout.html"))
	.toString()
	.split("<!--BREAK-->");
const critcss = readFileSync(resolve(__dirname, "views/critic.css"));
const critjs = readFileSync(resolve(__dirname, "../dist/bundle.js"));
require("@babel/register")({
	presets: [
		"@babel/preset-react",
		[
			"@babel/preset-env",
			{
				targets: {
					node: "current",
				},
			},
		],
	],
	plugins: ["@babel/transform-flow-strip-types"],
});
const {
	NowPlaying,
	PlayListMenu,
	TrackRow,
	SpotifyFooter,
	TrackList,
	SideNav,
	AppBar,
	App,
} = require("./client/"); //.jsack");

const { Readable } = require("stream");
var cookieParser = require("cookie-parser");

var router = express.Router();
const h = React.createElement;
const rts = ReactDom.renderToString;
const mockStdk = require("./staticMocks");
const writeStreamSync = (stream, content) =>
	new Promise((resolve) => {
		stream.write(content, () => resolve(true));
	});

const renderElement = (response, element) =>
	new Promise((resolve, reject) => {
		const stream = ReactDom.renderToNodeStream(element);
		stream.pipe(response);
		stream.on("end", resolve);
		stream.on("error", (e) => {
			console.log("======", e);
			reject(e);
		});
	});
router

	.use(cookieParser());

router.get("/bundle.js", (req, res) => {
	res.headersSent || res.writeHead(200, { "Content-Type": "application/json" });
	Readable.from(critjs).pipe(res);

	//	res.end("console.log('ss')");
});

router.get("(/list/)?(:listId)?", async function (req, res) {
	const API_DIR = "https://api.spotify.com/v1";
	if (req.query.access_token)
	{
		res.cookie('access_token', req.query.access_token);
		res.cookie('refresh_token', req.query.refresh_token);
		res.cookie('expiry', req.query.expiry);

	}
	const access_token = req.query.access_token || req.cookies['access_token'];
	console.log(access_token);
	const headers = {
		headers: {
			"Content-Type": "application/json",
			Authorization: "Bearer " + access_token,
		},
	};
	if (!access_token)
	{
		res.end(JSON.stringify(req.cookies));
	}
	res.writeHead(200, "welcome", { "Content-Type": "text/html" });
	let listId = req.params.listId || "1ZSGautkUpYJTOo6TfHoXi";
	const part1Wrote = writeStreamSync(res, page[0]); //

	const trackListGot = axios.get(API_DIR + "/playlists/" + listId + "/tracks", headers);
	const playListGot = axios.get(API_DIR + "/me/playlists", headers);

	await part1Wrote;
	//await renderElement(res, AppBar({ loginUrl: "/auth" }));
	await writeStreamSync(res, `<div id="root" class="mui-container">`);

	const trackList = await trackListGot.then(resp => resp.data);

	const sanitizedTrackList = (trackList.tracks || trackList.items || []).map(item => {
		const _item = item.track || item;
		return {
			imgURL: [].concat(_item.album && _item.album.images)[0].url,
			name: _item.name,
			artist: [].concat(_item.artists).map(a => a.name).join(", "),
			trackID: _item.id
		}
	});
	// res.write(JSON.stringify(sanitizedTrackList[0]))
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
	await writeStreamSync(res, "</div>"); //end of root container;

	await writeStreamSync(res, `<span id='datarepo' style='display:none'>${JSON.stringify(sanitizedTrackList)}</span>`);
	await writeStreamSync(res, `<script>
	window.access_token='${access_token}';
	window.reactHydrate();
	</script>`);
	await writeStreamSync(res, page[1]);
	res.end();


});
// });

// res.write(JSON.stringify(req.session.auth));
// Error.stackTraceLimit = 10000;
// const { fetchAPI, fetchAPIPut } = req.session.sdk
// 	? req.session.sdk
// 	: mockStdk;
// res.writeHead(200, "welcome", { "Content-Type": "text/html" });
// console.log("-----------")

// const part1Wrote = writeStreamSync(res, page[0]); //
// let listId = req.params.listId || "1ZSGautkUpYJTOo6TfHoXi";
// console.log("-----------")

// const trackListGot = fetchAPI("/playlists/" + listId + "/tracks");
// console.log("-----------")
// const playListGot = fetchAPI("/me/playlists");
// console.log("-----------")

// await part1Wrote;
// console.log("-----------")

// await renderElement(res, AppBar({ loginUrl: loginURL }));
// const trackList = await trackListGot;
// console.log("-----------")

// const sanitizedTrackList = (trackList.tracks || trackList.items || []).map(item => {
// 	const _item = item.track || item;
// 	return {
// 		imgURL: _item.album.images[0].url,
// 		name: _item.name,
// 		artist: _item.artists.map(a => a.name).join(", "),
// 		trackID: _item.id,
// 		preview_url: _item.preview_url
// 	}
// });


// console.log("-----------", sanitizedTrackList[0])

// await renderElement(res, NowPlaying({ item: sanitizedTrackList[0] }));
// console.log("-----------")

// // await writeStreamSync(res, page[1]);
// await renderElement(res, TrackList({ trackList: sanitizedTrackList || [] }));
// console.log("-----------")

// const playlists = await playListGot;
// const playlistsSanitied = playlists.items.map(p => {
// 	return {
// 		id: p.id,
// 		name: p.name
// 	}
// })


// await writeStreamSync(res,
// 	`<script>
// 		window.initState =${JSON.stringify({
// 		playlists: playlistsSanitied,
// 		trackList: sanitizedTrackList,
// 		loginUrl: loginURL,
// 		nowPlaying: sanitizedTrackList[0]
// 	})};

// 	document.onload = function(){
// 		ReactDOM.hydrate(React.createElement(App,window.initState), document.querySelector("#root"));
// 	}
// 		</script>`);

// await writeStreamSync(res, page[1]);
// res.end();
// 	} catch (e)
// {
// 	console.error("..................", e);
// 	//	res.write(e.message);
// }
// });

router.get("/event/:event", (req, res) => {
	//res.end("ok");
	console.log(req.session.id, req.params.event);
});


if (require.main === module)
{
	const app = express();
	app.use(require("expre"));
	app.use("/spotify", router);
	app.listen(3000);
}
module.exports = router;
