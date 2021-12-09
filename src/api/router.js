var express = require("express");
var router = express.Router();

const availableLanguages = require("../availableLanguages");
router.get("/availableLanguages", (req, res) => {
  res.json({ status: 200, availableLanguages });
});

router.get("/auth", (req, res) => {
  if (!req.userId) {
    res.json({ status: 200, isAuthenticated: false });
    return;
  }
  res.json({ status: 200, isAuthenticated: true, id: req.userId });
});

router.use(require("./problems"));
router.use(require("./solutions"));

module.exports = router;
