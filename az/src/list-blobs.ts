import { wsclient } from ".";
import { Readable, Transform, Writable } from "stream";
import { BlobItem } from "@azure/storage-blob";
import { execSync } from "child_process";

export async function listContainerFiles(container): Promise<BlobItem[]> {
	const containerClient = wsclient().getContainerClient(container);
	const iterator = containerClient.listBlobsFlat();
	const ret = [];
	for await (const item of iterator) {
		ret.push(item);
	}

	return ret;
}
