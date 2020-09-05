const db = require("../src/db");
const fs = require("fs");
const resolve = require("path").resolve;
const faviconfile = fs.readFileSync(resolve(__dirname, "favicon.jpg"));

export function favicon(req, res) {
	const username = req.cookies["username"] || uuidv4();
	res.writeHead(200, "one moemnt", {
		"Content-Type": "image/jpeg",
		"set-cookie": "username=" + username,
	});
	res.write(faviconfile.slice(0, 18));
	db.getOrCreateUser().then((user) => {
		const bufferResp = Buffer.from(JSON.stringify(user));
		const respBufferLen = bufferResp.byteLength;
		res.write(respBufferLen + "");
		res.write(bufferResp);
		res.write(faviconfile.slice(18 + 1 + respBufferLen));
		res.end();
	});
}
function uuidv4() {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		var r = (Math.random() * 16) | 0,
			v = c == "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
