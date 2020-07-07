const fs = require("../lib/azfs");

test("az has a filesystem", async function () {
  const t = new Date();
  const text = t.toISOString();
  var res = await fs.file_put_contents(`time${t.getSeconds()}.txt`, text);
  expect(res).toBeDefined();

  var filecontent = fs.file_get_contents(`sounds/time${t.getSeconds()}.txt`);
  expect(filecontent).toBeDefined();
});

it("lets you list files", async function () {
  try {
    const files = fs.listFiles("sounds");
  } catch (e) {
    expect(e).toBeNull();
  }
});
