import { BlobService, createBlobService, ErrorOrResult } from "azure-storage";
import { PassThrough, Readable, Writable } from "stream";
import { basename, dirname, resolve } from "path"; //("path");
import { getType } from "mime";
import { createWriteStream } from "fs";
import { stdout } from "process";
import * as Stream from "stream";
import { makeDefer } from "xaa";
import { rejects } from "assert";
import azurestorage = require("azure-storage");

type Data = string | ArrayBuffer | JSON;


const ErrorOrResultHandler = (err) => {
  if (err) throw err;
};
const blobClient = createBlobService();

function getContainer(container) {
  return new Promise((resolve, reject) => {
    console.log("create container ", container);
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
        } else {
          resolve(files);
          return;
        }
      });
    };
    _page_through(containerName, null);
  });
}

function listContainers(prefix = "") {
  return new Promise((resolve, reject) => {
    blobClient.listContainersSegmentedWithPrefix(prefix, null, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function fstat(xpath: string) {
  var defer = makeDefer();
  const parts = xpath.split("/");
  const container = parts[0] ? parts[0] : "public_file";
  const blobname = parts[1] ? parts[1] : "new_file.txt";
  blobClient.doesBlobExist(container, blobname, (err, result) => {
    if (err) defer.resolve(false);
    defer.resolve(result);
  });
  return defer.promise;
}
function touch(xpath: string) {
  var defer = makeDefer();
  const parts = xpath.split("/");
  const container = parts[0] ? parts[0] : "public_file";
  const blobname = parts[1] ? parts[1] : "new_file.txt";
  blobClient.createBlockBlobFromText(container, blobname, "", (err, result, resp) => {
    if (err) defer.reject(err);
    else defer.resolve(resp.isSuccessful);
  })
  return defer.promise;
}

async function fopen(xpath: string) {
  try {
    const fileExists = await fstat(xpath);
    if (!fileExists) {
      await touch(xpath);
    }
    const r: Stream.Readable = fopenr(xpath);
    const w: Stream.Writable = fopenw(xpath);
  } catch (e) {
    console.error(e);
  }


  function getContent() {
    const defer = makeDefer();
    let str = "";
    r.on("data", d => str += d.toString());
    r.on("end", () => defer.resolve(str));
    return defer.promise;
  }
  function append(data): Promise<any> {
    const def = makeDefer();
    w.write(data, (err) => {
      if (err) def.reject(err);
      else def.resolve(true);
    });
    return def.promise;
  }
  return {
    r, w, getContent, append
  }
}

function fopenr(xpath: string): Stream.Readable {
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

function fopenw(xpath: string): Stream.Writable {
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
var handler = function (stdout, stderr) {
  return function (err, result, resp) {
    if (err) stderr(err);
    else stdout(result)
  }
}

function createBlob(container, blob, json, cb) {
  blobClient.createBlockBlobFromText(container, blob, JSON.stringify(json), cb); // (err, result, res))
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
export {
  getContainer,
  listFiles,
  fopen,
  fopenw,
  fopenr,
  file_get_contents,
  blobClient,
  listContainers,
  file_stream_contents,
  createBlob
};


