const express = require("express");
const {
  listTransactions,
  createTransaction,
  updateTransaction,
} = require("../controllers/transactionController");

const router = express.Router();

router.get("/", listTransactions);
router.post("/", createTransaction);
router.patch("/:id", updateTransaction);

module.exports = router;
