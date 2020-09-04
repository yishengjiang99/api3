"use strict";

const dbfs = require("../../dist/dbfs");
const { LS, root } = require("../../dist/dbfs");
const { expect } = require("chai");
const { execSync } = require("child_process");

// if you used the '@types/mocha' method to install mocha type definitions, uncomment the following line

describe("dbfs", function () {
  it("will have unit tests", () => expect(true));
  it("defines uses a root directory and has read/write/access", () => {
    dbfs.init();
    expect(root).to.exist;
    expect(root).to.include("dbfs");
    const output = execSync("ls", { pwd: dbfs.root });
    expect("no exception through");
    expect(output).to.be.not.null;
  });
});

describe("list files", function () {
  beforeEach(function () {});

  it("list files in rootdir", function () {
    LS().then((files) => {
      expect(files).to.include("text1.txt"); //, "dir/file2"]);
    });
  });
});
