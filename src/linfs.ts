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
  const xpath = resolve(rootdir, container);
  if (!fs.existsSync(xpath)) {
    fs.mkdirSync(xpath);
  }
  return fs.readdirSync(xpath);
}
function listFiles(container: string) {
  const xpath = resolve(rootdir, container);

  if (!fs.existsSync(xpath)) {
    fs.mkdirSync(xpath);
  }
  return fs.readdirSync(xpath);
}

function listContainers() {
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

  return {
    getContent: () => {
      return fs.readFileSync(fullpath).toString();
    },
    append: (data: string | NodeJS.ArrayBufferView) => {
      fs.open(fullpath, "a+", (err, fd) => {
        fs.writeFileSync(fd, data, { encoding: "utf8", flag: "a" });
      })
    },
    putContent: (data: string | NodeJS.ArrayBufferView) =>
      fs.writeFileSync(fullpath, data, { encoding: "utf8" }),

    download: (output: Stream.Writable) => {
      const r = fs.createReadStream(xpath);
      r.on("data", () => r.pipe(output));
      r.on("error", (err) => output.end(err.message));
      r.on("close", () => {
        output.end("EOF");
      });
    },
    upload: (input: Stream.Readable) => {
      fs.open(fullpath, "a+", (err, fd) => {
        const w = fs.createWriteStream(fullpath, { fd: fd });
        input.pipe(w);
        input.on("error", (err: any) => console.log(err));
      })
    },
  };
}

export { getContainer, init, fopen, FileDriver, listContainers, listFiles };

// listContainers();

// getContainer("lobby");
// listFiles("lobby");

// const fd = fopen("lobby/info.json");

// console.log(fd);
