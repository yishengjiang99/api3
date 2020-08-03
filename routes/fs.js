var express = require("express");
var router = express.Router();

router.get("/:path/", (req, res) =>
  createReadStream(resolve("dbfs/lobby", req.params.filename)).pipe(res)
);

router.use(
  "/",
  require("serve-index")("dbfs", {
    icons: true,
    view: "details",
    sort: "recent",
  })
);

module.exports = router;
