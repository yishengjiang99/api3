var express = require("express");
var router = express.Router();
router.get("/db", async (req, res) => {
  res.json(await db.dbMeta());
});

router.get("/db/:table/(:start?)(/:limit?)", async (req, res) => {
  res.json(
    await db.dbQuery(
      `select * from ${req.params.table} limit ${req.params.start} ${req.params.limit}`
    )
  );
});
