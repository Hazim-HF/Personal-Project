const express = require("express");
const { listAccounts, createAccount } = require("../controllers/accountController");

const router = express.Router();

router.get("/", listAccounts);
router.post("/", createAccount);

module.exports = router;
