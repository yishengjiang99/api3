
import { BlobService, createBlobService, ErrorOrResult } from "azure-storage";
import { PassThrough, Readable, Writable } from "stream";
import * as Stream from "stream";
import { rejects } from "assert";

const blobClient = createBlobService();

function getContainer(container, cb?: (info) => void) {
  return new Promise((resolve, reject) => {
    let _cb = cb;
    blobClient.createContainerIfNotExists(
      container,
      {
        publicAccessLevel: "container",
      },
      (err, result) => {
        if (err) reject(err);

        if (cb) cb(result);
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


// r, w, getContent, upload, append, download

async function fstat(xpath: string) {
  const parts = xpath.split("/");
  const container = parts[0] ? parts[0] : "public_file";
  const blobname = parts[1] ? parts[1] : "new_file.txt";

  try {
    blobClient.doesBlobExist(container, blobname, (err, result) => {
      if (err) defer.resolve(false);
      defer.resolve(result);
    });
  } catch (e) {
    defer.resolve(false)
  }
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

interface AzureFileDriver {
  writer: Stream.Writable,
  reader: Stream.Readable,
  getContent(xpath: string, data: string): void;
  append(xptah: string): Promise<string | any>;
  download(xpath: string, output: Stream.Writable): void;
  upload(xpath: string, readable: Stream.Readable): void;
}

async function fopen(xpath: string): Promise<AzureFileDriver | any> {
  const parts = xpath.split("/");
  const container = parts[0] ? parts[0] : "public_file";
  const blobName = parts[1] ? parts[1] : "new_file.txt";

  let r: Stream.Readable;
  let w: Stream.Writable;

  try {
    await fstat(xpath) || await touch(xpath);
    r = await fopenr(xpath);
    w = await fopenw(xpath);
    function getContent() {
      const defer = makeDefer();
      let str = "";
      r.on("data", d => str += d.toString());
      r.on("end", () => defer.resolve(str));
      r.on("error", (err) => defer.reject(err));
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
    function download(downlink: Writable) {
      const fh = blobClient.createReadStream(container, blobName, (err, fileInfo) => {
        if (err) throw err;
      }).pipe(downlink);
    };
    async function upload(uplink: Readable) {
      const writer = await fopenw(xpath);
      uplink.pipe(writer);
    }
    return {
      r, w, getContent, upload, append, download
    }
  } catch (e) {
    console.error('fml, ' + e.message);
  }
}

function fopenr(xpath: string): Promise<Stream.Readable | any> {
  const parts = xpath.split("/");
  const container = parts[0] ? parts[0] : "public_file";
  const blobname = parts[1] ? parts[1] : "new_file.txt";
  const start = parts[2] ? parts[2] : "0";
  const end = parts[3] ? parts[3] : "-1";
  const options = {
    rangeStart: parseInt(start),
  };
  let fh = blobClient.createReadStream(container, blobname, options, (err, result, resp) => {
    if (err) throw err;
    defer.resolve(fh);
  })
  return defer.promise;
}

function fopenw(xpath: string): Promise<Stream.Writable> {
  return new Promise((resolve, reject) => {
    const parts = xpath.split("/");
    const container = parts[0] ? parts[0] : "public_file";
    const blobname = parts[1] ? parts[1] : "new_file.txt";
    const writeStream = blobClient.createWriteStreamToBlockBlob(container, blobname, (err, result, resp) => {
      if (err) reject(err);
      else resolve(writeStream);
    });
  });
}

const file_get_content = function (containerName, blobName, cb) {
  let fh;
  blobClient.createReadStream(containerName, blobName, (err, fileInfo) => {
    if (err) {
      cb('');
      console.error(err)
    }
  });


  var bufs = [];
  let response;
  fh.on('data', data => {
    bufs.push(data);
  });
  fh.on("end", function () {
    if (!cb) {
      response = Buffer.concat(bufs);
    } else {
      cb(Buffer.concat(bufs));
    }

  });
  return response;
}



function file_put_content(containerName, blobName, text) {
  return new Promise((resolve, reject) => {
    blobClient.createBlockBlobFromText(containerName, blobName, text, function (err, result, response) {
      if (err) reject(err);
      else resolve(result);
    });
  })
}

export {
  fstat,
  getContainer,
  listFiles,
  file_get_content,
  fopen,
  AzureFileDriver,
  fopenw,
  fopenr,
  touch,
  blobClient,
  listContainers,
  file_put_content
};


