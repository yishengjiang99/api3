import { resolve } from "path";
import { readFileSync } from "fs";
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
const { fs } = require("memfs");

var router = express.Router();
const h = React.createElement;
const rts = ReactDom.renderToString;
const mockStdk = require("./staticMocks");

const writeStreamSync = (stream, content) =>
	new Promise((resolve) => {
		console.log("writing ", content);
		stream.write(content, () => resolve(true));
	});

const renderElement = (response, element) =>
	new Promise((resolve, reject) => {
		const stream = ReactDom.renderToNodeStream(element);
		stream.pipe(response);
		stream.on("end", resolve);
		stream.on("error", (e) => {
			console.log(e);
			reject(e);
		});
	});

router.get("/bundle.css", (req, res) => Readable.from(critcss).pipe(res));
router.get("/bundle.css", (req, res) => {
	res.writeHead(200, { "Content-Type": "text/css" });
	Readable.from(critcss).pipe(res);
	//	res.end("console.log('ss')");
});
router.get("/bundle.js", (req, res) => {
	res.writeHead(200, { "Content-Type": "application/json" });
	Readable.from(critjs).pipe(res);
	//	res.end("console.log('ss')");
});
router.use("/", [checkAuth]);

router.get("(/list/)?(:listId)?", async function (req, res) {
	try {
		Error.stackTraceLimit = 10000;
		const { fetchAPI, fetchAPIPut } = req.session.sdk
			? req.session.sdk
			: mockStdk;
		res.writeHead(200, "welcome", { "Content-Type": "text/html" });
		const part1Wrote = writeStreamSync(res, page[0]); //
		let listId = req.params.listId || "1ZSGautkUpYJTOo6TfHoXi";
		const trackListGot = fetchAPI("/playlist/" + listId + "/tracks");
		const playListGot = fetchAPI("/me/playlists");
		await part1Wrote;
		await renderElement(res, AppBar({ loginUrl: loginURL }));
		const trackList = await trackListGot;

		const tracks = trackList.tracks || trackList.items;
		await renderElement(res, NowPlaying({ item: tracks[0] }));
		await writeStreamSync(res, page[1]);
		await renderElement(res, TrackList({ trackList: tracks || [] }));
		await writeStreamSync(res, page[2]);
		const playlists = await playListGot;
		await writeStreamSync(
			res,
			rts(PlayListMenu({ playlists: playlists.items }))
		);
		await renderElement(res, SpotifyFooter());
		await writeStreamSync(res, page[3]);
		// res.end();
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
