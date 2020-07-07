import { BlobService, createBlobService } from "azure-storage";
import { PassThrough, Readable } from "stream";
import { basename, dirname } from "path"; //("path");
import { getType } from "mime";
import { createWriteStream } from "fs";
const ErrorOrResultHandler = (err) => {
  if (err) throw err;
};
const blobClient = createBlobService();

function getContainer(container) {
  return new Promise((resolve, reject) => {
    console.log("create container");
    blobClient.createContainerIfNotExists(
      container,
      {
        publicAccessLevel: "container",
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
  });
}

function listFiles(containerName, prefix = null) {
  return new Promise((resolve, reject) => {
    var files = [];

    var _page_through = function (containerName, nextPage) {
      blobClient.listBlobsSegmentedWithPrefix(containerName, prefix, nextPage, (err, result) => {
        if (err) reject(err);
        result.entries.forEach((entry) => {
          files.push({
            name: entry.name,
            etag: entry.etag,
            contentLength: entry.contentLength,
            created_at: entry.creationTime,
          });
        });
        if (result.continuationToken) {
          resolve(files);
          //          _page_through(containerName, result.continuationToken);
        } else {
          resolve(files);
          return;
        }
      });
    };
    _page_through(containerName, null);
  });
}

function listContainers() {
  return new Promise((resolve, reject) => {
    blobClient.listContainersSegmented(null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function fopenr(xpath: string): Readable {
  const parts = xpath.split("/");

  const container = parts[0] ? parts[0] : "public_file";
  const blobname = parts[1] ? parts[1] : "new_file.txt";
  const start = parts[2] ? parts[2] : null;
  const end = parts[3] ? parts[3] : null;
  if (start || end) {
    const options = {
      rangeStart: parseInt(start) || null,
      rangeEnd: parseInt(end) || null,
    };
    return blobClient.createReadStream(container, blobname, options, ErrorOrResultHandler);
  } else {
    return blobClient.createReadStream(container, blobname, ErrorOrResultHandler);
  }
}

function fopenw(xpath: string): any {
  const parts = xpath.split("/");

  const container = parts[0] ? parts[0] : "public_file";
  getContainer(container);
  const blobname = parts[1] ? parts[1] : "new_file.txt";
  return blobClient.createWriteStreamToBlockBlob(container, blobname);
}

function file_stream_contents(containerName, fileName, writestream) {
  return new Promise((resolve, reject) => {
    blobClient.getBlobToStream(containerName, fileName, writestream, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function file_get_contents(filepath) {
  return new Promise((resolve, reject) => {
    var w = new PassThrough();
    var chunks = [];
    file_stream_contents(dirname(filepath), basename(filepath), w);
    w.on("data", (d) => chunks.push(d));
    w.on("done", () => {
      resolve(chunks.join());
    });
    w.on("error", (e) => reject(e));
  });
}
export default {
  getContainer,
  listFiles,
  fopenw,
  fopenr,
  file_get_contents,
  blobClient,
  listContainers,
  file_stream_contents,
};
