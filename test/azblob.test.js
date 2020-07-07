const fs = require("./azfs.js");
test("create container ", async function () {
  const container = await fs.getContainer("soundomusic").catch((err) => {
    //console.log(err);

    expect(typeof err).toBeUndefined();
  });
  expect(container.name).toBe("soundomusic");
});
// console.log(container);
test("upload file", function () {
  fs.file_put_contents(
    "soundomusic",
    "scarabourghfair1" + new Date().toTimeString() + ".txt",
    "adgadgarh"
  )
    .then((response) => {
      expect(response.isSuccessful).toBe(true);
    })
    .catch((er) => console.log(er));
});
test("list files", async function () {
  const files = await fs.listFiles("soundomusic", "").catch((er) => {
    //console.log(er);
    // expect(typeof er).toBeUndefined();
  });
  //console.log(files);
});

test("az has a filesystem", async function () {
  const t = new Date();
  const text = t.toISOString();
  var res = await fs.file_put_contents("soundomusic", `time${t.getSeconds()}.txt`, text);
  expect(res).toBeDefined();

  var filecontent = fs.file_get_contents(`sounds/time${t.getSeconds()}.txt`);
  expect(filecontent).toBeDefined();
});

//   it("lets you list files", async function () {
//     try {
//       const container = fs.getContainer("sounds");
//     } catch (e) {
//       expect(filecontent).toBeNull();
//     }
//   });
// });
