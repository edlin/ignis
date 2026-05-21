const express = require("express");
const { getVersion } = require("../version");
const config = require("../config");

const router = express.Router();

router.get("/", (req, res) => {
  const pkg = require("../../package.json");

  res.json({
    version: getVersion(),
    semver: pkg.version,
    obsidianVersion: config.obsidianVersion,
  });
});

module.exports = router;
