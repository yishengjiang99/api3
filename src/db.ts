import { Connection, createConnection } from "mysql";

function conn(): Connection {
  var c: Connection = createConnection({
    host: "localhost",
    user: process.env.db_user,
    password: process.env.db_password,
    database: "grepawk",
  });
  c.on("end", function () {});
  return c;
}
async function dbRow(sql, args = []) {
  const results = await dbQuery(sql, args);
  if (results[0]) return results[0];
  else return false;
}
async function dbQuery(sql, args = []) {
  return new Promise((resolve, reject) => {
    const connection: Connection = conn();
    connection.query(sql, args, function (error, results, fields) {
      if (error) reject(error);
      else resolve(results);
      connection.end();
    });
  });
}
async function dbInsert(table, obj) {
  return new Promise((resolve, reject) => {
    const connection: Connection = conn();
    const sql = `insert ignore into ${table} SET ?`;
    connection.query(sql, obj, function (error, results, fields) {
      if (error) reject(error);
      else resolve(results.insertId);
      console.log(results);
      connection.end();
    });
  });
}
// const dbConn = async () => {
//   return new Promise((resolve, reject) => {
//     pool.getConnection(function (err, connection) {
//       if (err) reject(err);
//       else resolve(connection);
//     });
//   });
// };
const dbMeta = async () => {
  var tables = await dbQuery("show tables", []);
  return tables;
};

const genuserNames = () => {
  const verbs = require("fs")
    .readSync(require("path").resolve("bin/verb.txt"))
    .split("\n")
    .map((n) => n.trim())
    .map((name) => dbInsert("available_usernames", { username: name, taken: 0 }));
};
async function getOrCreateUser(req) {
  const username = req.headers["g-username"];
  var user;
  if (username) {
    user = await dbRow("SELECT * from user where username = ? limit 1", [username]);
  }

  if (!user) {
    const randUsername = await dbRow(
      "select username from available_usernames where taken=0 order by rand() limit 1"
    );
    dbQuery("update available_usernames set taken=1 where username = ?", [
      randUsername.username,
    ]).catch((e) => console.error(e));

    const userId = await dbInsert("user", {
      username: randUsername.username,
      loggedin_cnt: 1,
    }).catch((e) => {
      console.error(e);
    });
    console.log("db insert user id " + userId);
    user = await dbRow("select username from user where id = ? ", [userId]).catch((e) =>
      console.log(e)
    );
  }
  if (!user) {
    throw new Error("unable to select or insert new user");
  }
  return user;
}
const hashCheckAuthLogin = async (username) => {
  return require("exec").exec(
    `md5 -s '${username}${process.env.secret_md5_salt || "welcome"}'`,
    (err, stdout, stderr) => {
      if (err) throw err;
      return stdout.toString();
    }
  );
};

const userFiles = async (user) =>
  await dbQuery(
    `select f.*, m.meta as meta 
from user u 
  left join files f on u.id=f.user_id 
  left join file_meta m on f.id=m.file_id
  where u.id=?`,
    [user.id]
  ).catch((e) => {
    console.error(e);
  });

export default { dbQuery, dbInsert, dbMeta, dbRow, getOrCreateUser, userFiles, hashCheckAuthLogin };
