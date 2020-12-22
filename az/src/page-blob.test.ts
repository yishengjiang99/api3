import { expect } from "chai";
import { wsclient } from ".";
import { exec, spawn } from "child_process";
import { createPageBlob } from "./page-blobs";
describe("page blobs", () => {
	it("create blob. its the initial createBlob call that decares blobs", (done) => {
		const filename = "today_yt_trending_" + new Date().toISOString + ".html";
		const { stdout, stderr } = spawn(`curl`, [
			"-s",
			`http://rss.cnn.com/rss/cnn_topstories.rss`,
			"-o",
			"-",
		]);
		createPageBlob(filename, "wav").then((ws) => {
			stdout.pipe(ws); //.pipe(process.stdout);

			stderr.on("data", (d) => expect.fail(d));
			ws.on("data", (d) => {
				console.log(d.toString());
			});
			ws.on("ended", () => {
				expect(1 + 1).equal(2);
				done();
			});
		});
	}).timeout(20000);
});
