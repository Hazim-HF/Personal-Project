const express = require("express");
const {
  listBudgets,
  createBudget,
  applyBudgets,
  updateBudget,
  deleteBudget,
} = require("../controllers/budgetController");

const router = express.Router();

router.get("/", listBudgets);
router.post("/", createBudget);
router.put("/", applyBudgets);
router.patch("/:id", updateBudget);
router.delete("/:id", deleteBudget);

module.exports = router;
