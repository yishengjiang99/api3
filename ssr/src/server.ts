import { resolve } from "path";
import { readFileSync, write } from "fs";
import * as express from "express";
const { checkAuth, refreshToken, loginURL } = require("./checkauth");
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


router.get("/bundle.js", (req, res) => {
	res.headersSent || res.writeHead(200, { "Content-Type": "application/json" });
	Readable.from(critjs).pipe(res);

	//	res.end("console.log('ss')");
});
// router.use("/", [checkAuth]);

router.get("(/list/)?(:listId)?", async function (req, res) {
	try {
		res.write(JSON.stringify(req.session.auth));
		Error.stackTraceLimit = 10000;
		const { fetchAPI, fetchAPIPut } = req.session.sdk
			? req.session.sdk
			: mockStdk;
		res.writeHead(200, "welcome", { "Content-Type": "text/html" });
		console.log("-----------")

		const part1Wrote = writeStreamSync(res, page[0]); //
		let listId = req.params.listId || "1ZSGautkUpYJTOo6TfHoXi";
		console.log("-----------")

		const trackListGot = fetchAPI("/playlists/" + listId + "/tracks");
		console.log("-----------")
		const playListGot = fetchAPI("/me/playlists");
		console.log("-----------")

		await part1Wrote;
		console.log("-----------")

		await renderElement(res, AppBar({ loginUrl: loginURL }));
		const trackList = await trackListGot;
		console.log("-----------")

		const sanitizedTrackList = (trackList.tracks || trackList.items || []).map(item => {
			const _item = item.track || item;
			return {
				imgURL: _item.album.images[0].url,
				name: _item.name,
				artist: _item.artists.map(a => a.name).join(", "),
				trackID: _item.id,
				preview_url: _item.preview_url
			}
		});


		console.log("-----------", sanitizedTrackList[0])

		await renderElement(res, NowPlaying({ item: sanitizedTrackList[0] }));
		console.log("-----------")

		// await writeStreamSync(res, page[1]);
		await renderElement(res, TrackList({ trackList: sanitizedTrackList || [] }));
		console.log("-----------")

		const playlists = await playListGot;
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
		await writeStreamSync(res,
			`<script>
		window.initState =${JSON.stringify({
				playlists: playlistsSanitied,
				trackList: sanitizedTrackList,
				loginUrl: loginURL,
				nowPlaying: sanitizedTrackList[0]
			})};

	document.onload = function(){
		ReactDOM.hydrate(React.createElement(App,window.initState), document.querySelector("#root"));
	}
		</script>`);

		await writeStreamSync(res, page[1]);
		res.end();
	} catch (e) {
		console.error("..................", e);
		//	res.write(e.message);
	}
});

router.get("/event/:event", (req, res) => {
	//res.end("ok");
	console.log(req.session.id, req.params.event);
});

router.get("/refresh_token", refreshToken);

if (require.main === module) {
	const app = express();
	app.use(require("expre"));
	app.use("/spotify", router);
	app.listen(3000);
}
module.exports = router;
