import * as db from "./db";
require("iconv-lite").encodingExists("foo");

test("two plus two is four", () => {
  expect(2 + 2).toBe(4);
  db.dbRow("select * from user limit 1").then((res) => {
    expect(res.username).toBeTruthy;
  });
});

test("two plus 1 is 3", async () => {
  await db.getOrCreateUser("tom2");
  db.dbRow("select * from user where username=?", ["tom2"]).then((res) => {
    expect(res.username).toBeTruthy;
  });
  await db.getOrCreateUser("tom2");

  db.dbQuery("select * from user where username=?", ["tom2"]).then((res) => {
    expect(res.length).toBe(1);
  });
});

test("db insert ", async () => {
  const name = new Date().toString();
  const insertedId = await db.dbInsert("room", { name: "aaa" });
  expect(insertedId).toBeTruthy();
  db.dbQuery("select * from room order by name asc limit 1").then((res) => {
    expect(res[0].name).toContain("aaa");
  });

  expect(insertedId).toBeTruthy();
});

// test("upsert", async function () {
//   const data = {
//     udid: "12345",
//     tracks: "123",
//   };
//   const rname = "room3";
//   const ret = await db.dbUpsert(
//     "room_participants",
//     {
//       roomname: rname,
//       participant_id: data.udid,
//       tracks: JSON.stringify(data.tracks),
//     },
//     ["roomname", "participant_id"]
//   );

//   const user2 = {
//     udid: "user2",
//     tracks: [],
//   };
//   const ret2 = await db
//     .dbUpsert(
//       "room_participants",
//       {
//         roomname: rname,
//         participant_id: user2.udid,
//         tracks: JSON.stringify(user2.tracks),
//       },
//       ["roomname", "participant_id"]
//     )
//     .then((insertId) => {
//       console.log(insertId);
//       return db.dbQuery(
//         `select * from room_participants where roomname= ? and participant_id != ? 
//     order by last_active desc limit 5`,
//         [name, user2.udid]
//       );
//     })
//     .then((others) => {
//       expect(others.length).toBeGreaterThan(0);
//     });

//   console.log(ret);
// });
test("ytinsert", function () {
  db.queryYt("billie ellish", null);

})