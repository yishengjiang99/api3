import * as fs from "fs";
import { resolve } from "path";
import * as net from "net";
import { assert } from "console";
import * as sh from "shelljs";
import * as chalk from "chalk";
import { spawn } from "child_process";
import { Writable } from "stream";
import * as readline from "readline";
import { listeners } from "process";
export const root = resolve("dbfs");

export function init() {
  if (!fs.existsSync(root)) {
    sh.mkdir(root);
  }
}

interface LSOptions {
  BFS?: boolean;
  stdout?: Writable;
  maxDepth?: number;
  sort?: "filename" | "edit date";
  reverse?: boolean;
  filter?: RegExp | string;
}

export async function LS(path = "", options) {
  ls("-R", "/users/me", "/tmp");

  const cwd = (!path && root) || resolve(root, path);
  // process.chdir(this.root);

  async function doproc() {
    new Promise((resolve, reject) => {
      const proc = spawn(`ls -R ${cwd}`);

      const rl = readline.createInterface({
        input: proc.stdout,
      });
      let lsdir = path;
      let output = "";
      rl.on("line", (_line) => {
        const line: string = _line.trim();

        if (
          line.trim().startsWith(path) &&
          line.lastIndexOf(":") === line.length - 1
        ) {
          lsdir = line.substr(0, line.length - 1);
        } else {
          const files = line.split(/\s/);
          output += files.map((f) => `${lsdir}/${f}\n`);
        }
        //readline
      });
      rl.on("error", reject);
      rl.on("done", () => {
        resolve(output);
      });
    });
  }
  var f = await doproc();
  console.log(f);
}
