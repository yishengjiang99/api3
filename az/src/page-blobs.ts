"use strict";

import { PageBlobCreateResponse } from "@azure/storage-blob";
import { createReadStream } from "fs";
import { Transform } from "stream";

import { wsclient } from ".";

const minchunk = 1024;
export const createPageBlob = async (filename, container) => {
	const cc = wsclient();

	const blob = cc.getContainerClient(container).getPageBlobClient(filename);
	try {
		const resp: PageBlobCreateResponse = await blob.create(minchunk, {
			blobHTTPHeaders: {
				blobContentType: require("mime-types").lookup(filename),
			},
		});
		console.log(resp);
	} catch (e) {
		console.log(e);
		process.exit(1);
	}
	let pageOffset = 0;
	let leftover = Buffer.alloc(0);

	return new Transform({
		highWaterMark: minchunk * 10,
		transform: (chunk, enc, cb) => {
			let n = 0;
			if (leftover.length + chunk.byteLength < minchunk) {
				leftover = Buffer.concat([leftover, chunk]);
				cb(null, null);
			} else {
				for (; n < leftover.length + chunk.byteLength; n += minchunk);
				const agg = Buffer.concat([
					leftover,
					chunk.slice(0, n - leftover.byteLength),
				]);
				blob
					.uploadPages(agg, n, pageOffset)
					.then((resp) => {
						pageOffset += n;
						leftover = chunk.slice(n);
						console.log(pageOffset, n);
						cb(null, resp._response.status);
					})
					.catch((err) => {
						cb(err, null);
					});
			}
		},
		flush: (cb) => {
			if (leftover.byteLength) {
				const agg = Buffer.concat([
					leftover,
					Buffer.alloc(minchunk - leftover.byteLength).fill(0),
				]);
				blob
					.uploadPages(agg, minchunk, pageOffset)
					.then(console.log)
					.catch(console.error);
				cb(null, null);
			}
		},
	});
};

if (process.argv[2]) {
	const filename = process.argv[2].trim();
	if (filename.endsWith(".mid")) {
		createPageBlob(filename, "midi")
			.then((ws) => {
				debugger;
				createReadStream(filename).pipe(ws);
				ws.pipe(process.stdout);
				ws.pipe(process.stderr);
			})
			.catch(console.error);
		// createReadStream("filename").pipe(await createPageBlob("midi", filename));
	}
}
