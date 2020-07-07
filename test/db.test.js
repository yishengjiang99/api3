const { dbQuery, dbInsert, dbMeta, dbRow } = require("./db.js");
const db = require("./db.js");
console.log("loo");

test("db connect", async function () {
  var ret = await dbRow("select 1+1 as result");
  expect(ret.result).toBe(2);
  console.log(ret);
  dbMeta();
});
test("db insert ", async () => {
  const name = "yisheng_" + Math.random() * 100000;
  await dbInsert("available_usernames", { username: name });
  var usernames = await dbQuery("select * from available_usernames where username = ?", [name]);
  expect(usernames.length).toBe(1);
  expect(usernames[0].username).toBe(name);
  console.log(usernames);
});

test("db user ", async () => {
  const filecontent = "asdfgasdfgawdsgasdf";
  const randUsername = await dbRow("select username from available_usernames where taken=0");
  await dbQuery("update available_usernames set taken=1 where username=?", [randUsername.username]);
  expect(randUsername.username).toMatch(/yisheng*/);
  const userId = await dbInsert("user", {
    username: randUsername.username,
    email: "yisheng.jiang@gmail.com",
    loggedin_cnt: 1,
  });
  console.log(userId);
  expect(userId).toBeTruthy();
  test("db file ", async function () {
    await dbInsert("files", {
      user_id: userId,
      filename: new Date().getDate() + "_log.txt",
      filetype: "txt",
      blob: filecontent.toString(2),
    });
  });
});
test("two plus two is four", () => {
  expect(2 + 2).toBe(4);
});
