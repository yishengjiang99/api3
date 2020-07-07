"use strict";

const path = require("path");
const AutoLoad = require("fastify-autoload");

const azfs = require("../azfs.js");
const { dbRow, dbQuery, dbInsert } = require("../db.js");
const { resolve } = require("path");
const { execute, exec } = require("child_process");
const { blobClient } = require("./azfs.js");
const { db } = require("./db.js");

const errHandler = (err, res) => res.send(err.message);

module.exports = function (fastify, opts, next) {
  fastify.register(require("fastify-websocket"));

  fastify.get("/", (req, res) => {
    res.send(["/ls", "/ws", "/checkin.jpeg", "checkin.json", "POST /file"].join("\n<br>"));
  });

  fastify.get("/ws/upload", { websocket: true }, async (connection, reply, params) => {
    const fh = new require("stream").PassThrough();
    fh.on("done", function () {
      console.log("ff");
    });
    fh.on("error", (err) => console.error(err));

    const reqContainer = azfs.getContainer("streamuploads");
    connection.socket.send(JSON.stringify(connection.request));
    blobClient.createAppendBlobFromStream(
      "streamuploads",
      encodeURIComponent(new Date().toUTCString) + ".txt",
      fh,
      1024 * 1024,
      (err, res, req) => {
        errHandler(err, connection.socket);
      }
    );

    connection.socket.on("message", (message) => {
      connection.socket.send(message);
      if (message.toString() === "EOF") {
        reply.socket.write("writing file ..done");
        fh.end();
        connection.close();
      }
      fh.write(message, function (a, b, c) {
        console.log(a, b, c);
        connection.socket.send(fh.bytesWritten());
      });
    });
    connection.socket.on("end", () => {
      fhh.end();
    });
  });

  fastify.get("/ls", async (req, res) => {
    azfs
      .listContainers()
      .then((containers) => {
        res.send(JSON.stringify(containers));
      })
      .catch((err) => {
        res.send(err.message);
      });
  });
  fastify.get("/ls/:container", async (req, res) => {
    // res.send(JSON.stringify(req.params));

    azfs.listFiles(req.params.container).then((files) => {
      res.send(JSON.stringify(files));
    });
  });
  fastify.get("/ls/:container/:filename", async (req, reply, next) => {
    // res.send(JSON.stringify(req.params));
    const passthrough = new require("stream").PassThrough();
    azfs.file_stream_contents(req.params.container, req.params.filename, passthrough);
    passthrough.on("data", function () {
      reply.send(passthrough);
    });

    passthrough.on("done", () => {
      next();
    });
  });

  fastify.get("/put/:container/:filename", async (req, reply) => {
    // res.send(JSON.stringify(req.params));
    reply
      .code(200)
      .header("Content-Type", "text")
      .send("fetching " + [req.params.container, req.params.filename].join("/"));
    azfs
      .file_put_contents(req.params.container, req.params.filename, req.query.content)
      .then((result) => {
        reply.send(JSON.stringify(result));
        reply.raw.end("gg");
      })
      .catch((err) => {
        reply.send(err.message);
      });
  });
  fastify.post("/cat/:container/:filename", async (req, reply) => {
    // res.send(JSON.stringify(req.params));
    azfs
      .file_put_contents(req.params.container, req.params.filename, req.body)
      .then((result) => {
        reply.send(JSON.stringify(result));
      })
      .catch((err) => {
        reply.send(err.message);
      });
  });

  fastify.get("/checkin", async (req, res) => {
    const user = await getUser(req);
    const files = await dbQuery(
      `select f.*, m.meta as meta 
    from user u 
      left join files f on u.id=f.user_id 
      left join file_meta m on f.id=m.file_id
      where u.id=?`,
      [user.id]
    ).catch((e) => {
      console.error(e);
    });
    res.header("content-type", "application/json");
    res.header("set-cookie", `g-username=${user.username}`);
    res.header("set-cookie", `g-hash=${hashCheckAuthLogin(user.username)}`);
    res.send(JSON.stringify({ user, files }));
  });

  async function getUser(req) {
    const username = req.headers["g-username"];
    var user;
    if (username) {
      user = await dbRow("SELECT * from user where username=? limit 1", [username]);
    }

    if (!user) {
      const randUsername = await dbRow(
        "select username from available_usernames where taken=0 order by rand() limit 1"
      );
      dbQuery("update available_usernames set taken=1 where username=?", [randUsername.username]);
      const userId = await dbInsert("user", {
        username: randUsername.username,
        loggedin_cnt: 1,
      }).catch((e) => {});
      user = await dbRow("select username from user where id=?", [userId]).catch((e) =>
        console.log(e)
      );
    }
    if (!user) {
      throw new exception("unable to select or insert new user");
    }
    return user;
  }
  const hashCheckAuthLogin = async (username) => {
    exec(
      `md5 -s '${username}${process.env.secret_md5_salt || "welcome"}'`,
      (err, stdout, stderr) => {
        if (err) throw err;
        return stdout.toString();
      }
    );
  };
};
