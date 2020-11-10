import { PassThrough, Readable, Writable } from "stream";
import { basename, dirname, resolve, join } from "path"; //("path");

import * as fs from "fs";
import * as Stream from "stream";
export const rootdir = resolve(__dirname, "../dbfs");

function init() {
	if (fs.existsSync(rootdir) == false) {
		fs.mkdir(rootdir, (err) => console.error(err));
	}
	// process.chdir(rootdir);
}

function getContainer(container: string) {
	init();
	const parts = container.split("/");
	let xpath = rootdir;
	for (let i = 0; i < parts.length; i++) {
		xpath += "/" + parts[i];
		if (!fs.existsSync(xpath)) {
			console.log(xpath);
			const mkdirRet = fs.mkdirSync(xpath);
			console.log(mkdirRet);
		}
	}
}
function listFiles(container: string) {
	const xpath = resolve(rootdir, container);
	getContainer(xpath);
	return fs.readdirSync(xpath);
}

function listContainers(container = "") {
	const xpath = resolve(rootdir, container);

	return fs.readdirSync(rootdir);
}
interface FileDriver {
	append(data: string | NodeJS.ArrayBufferView): void;
	getContent(): string | NodeJS.ArrayBufferView;
	putContent(content: string | NodeJS.ArrayBufferView): void;
	download(output: Stream.Writable): void;
	upload(input: Stream.Readable): void;
}
const resolvedPath = {};
function fopen(xpath: string): FileDriver {
	let fullpath = resolve(rootdir, xpath);
	getContainer(dirname(xpath));
	return {
		getContent: () => {
			return fs.readFileSync(fullpath).toString();
		},
		append: (data: string | NodeJS.ArrayBufferView) => {
			fs.open(fullpath, "a+", (err, fd) => {
				fs.writeFileSync(fd, data);
			});
		},
		putContent: (data: string | NodeJS.ArrayBufferView) =>
			fs.writeFileSync(fullpath, data, { encoding: "utf8" }),

		download: (output: Stream.Writable) => {
			const r = fs.createReadStream(xpath);
			r.on("data", () => r.pipe(output));
			r.on("error", (err) => output.write(err.message));
			r.on("end", () => {
				output.write("EOF");
			});
		},
		upload: (input: Stream.Readable) => {
			fs.open(fullpath, "a+", (err, fd) => {
				if (err) console.error(err);
				const w = fs.createWriteStream(fullpath, { fd: fd });
				input.pipe(w);
				input.on("error", (err: any) => console.log(err));
			});
		},
	};
}

export { getContainer, init, fopen, FileDriver, listContainers, listFiles };

// listContainers();

// getContainer("lobby");
// listFiles("lobby");

// const fd = fopen("lobby/info.json");

// console.log(fd);
