import { expect } from "chai";
import "mocha";
import * as az from "../../src/index"

describe("First test", () => {
  //az.uploadFile("testFiles/A3.mp3").then(console.log).catch(console.error);
  az.uploadCLI("../testFiles/A*.mp3").then(console.log).catch(console.error);
});
