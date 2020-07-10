import { linkSync } from "fs";
import * as linfs from "./linfs";

test("basic", () => {
    linfs.init();
    const folders = linfs.listContainers();

    linfs.getContainer("test");
    const fd: linfs.FileDriver = linfs.fopen("test/1");
    fd.putContent("hi");

    expect(fd.getContent()).toBe("hi");
});

test("basic again", () => { });
