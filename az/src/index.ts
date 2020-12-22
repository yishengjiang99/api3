import {
	StorageSharedKeyCredential,
	BlockBlobClient,
	BlobServiceClient,
	ContainerClient,
} from "@azure/storage-blob";

import { spawn } from "child_process";
import { readFileSync, statSync } from "fs";

import { basename, resolve } from "path";
export { listContainerFiles } from "./list-blobs";
export * from "./page-blobs";
const account = process.env.azaccountname;
const sharedKeyCredential = new StorageSharedKeyCredential(
	account,
	process.env.azkey
);
export const wsclient = (): BlobServiceClient => {
	return new BlobServiceClient(
		`https://${account}.blob.core.windows.net`,
		sharedKeyCredential
	);
};

export function uploadSync(
	filepath: string,
	container: string
): Promise<BlockBlobClient | void> {
	const file = resolve(filepath);
	return wsclient()
		.getContainerClient(container)
		.uploadBlockBlob(basename(file), readFileSync(file), statSync(file).size, {
			blobHTTPHeaders: {
				blobContentType: require("mime-types").lookup(file),
			},
		})
		.then(({ blockBlobClient, response }) => {
			if (response.errorCode && !blockBlobClient)
				throw new Error(response.errorCode);
			return blockBlobClient;
		})
		.catch((e) => {
			Promise.reject(e);
		});
}
export const cspawn = (cmd, str) => {
	const proc = spawn(cmd, str.split(" "));
	proc.stderr.pipe(process.stderr);
	// console.log(cmd + " " + str);
	return proc;
};

if (process.argv[2] || process.argv[3]) {
	uploadSync(process.argv[2] || process.argv[3], "pcm")
		.then((res) => {
			process.stdout.write(res && res.url);
		})
		.catch(console.log);
}
