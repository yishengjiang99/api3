import { resolve } from "path";
import { readFileSync } from "fs";
import * as session from "express-session";
const { checkAuth, refreshToken } = require("./checkauth");
var express = require("express"); // Express web server framework
const React = require("react");
const ReactDom = require("react-dom/server");
const page = readFileSync(resolve(__dirname, "views/spotifylayout.html"))
	.toString()
	.split("<!--BREAK-->");
const critcss = readFileSync(resolve(__dirname, "views/critic.css"));
const critjs = readFileSync(
	resolve(__dirname, "../dist/bundle.8db8c23f417e98fb16ed.js")
);
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
	App,
} = require("./client/"); //.jsack");

const { Readable } = require("stream");
const { fs } = require("memfs");

var router = express.Router();
const h = React.createElement;
const rts = ReactDom.renderToString;
const mockStdk = require("./staticMocks");
router.use("/", [checkAuth]);

const writeStreamSync = (stream, content) =>
	new Promise((resolve) => {
		stream.write(content, () => resolve(true));
	});
const renderElement = (response, element) =>
	new Promise((resolve, reject) => {
		const stream = ReactDom.renderToNodeStream(element);
		stream.pipe(response);
		stream.on("end", resolve);
		stream.on("error", reject);
	});

router.get("/bundle.css", (req, res) => Readable.from(critcss).pipe(res));
router.get("/bundle.js", (req, res) => {
	const jsbundle = Readable.from(critjs);
	jsbundle.pipe(res);
	jsbundle.on("end", () => {
		res.write(`
    const report = (event)=>fetch("/spotify/event");
    report("jsBundleLoaded");`);
	});
});

router.get("/", async function (req, res) {
	try {
		const { fetchAPI, fetchAPIPut } = req.session.sdk
			? req.session.sdk
			: mockStdk;
		res.writeHead(200, "welcome", { "Content-Type": "text/html" });
		const part1Wrote = writeStreamSync(res, page[0]); //
		res.write(`<script>
      const h = React.createElement;
      React.render(React.create)
    </script>`);
		const trackListGot = fetchAPI("/me/player/recently-played");
		const playListGot = fetchAPI("/me/playlists");

		const trackList = await trackListGot;
		await part1Wrote;
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
		await writeStreamSync(res, page[3]);
		res.end();
	} catch (e) {
		console.error(e);
		res.end(e.message);
	}
});

router.get("/refresh_token", refreshToken);

if (require.main === module) {
	const app = express();
	app.use(require("expre"));
	app.use("/spotify", router);
	app.listen(3000);
}
module.exports = router;
