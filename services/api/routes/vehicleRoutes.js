const express = require("express");
const { listVehicles, createVehicle } = require("../controllers/vehicleController");

const router = express.Router();

router.get("/", listVehicles);
router.post("/", createVehicle);

module.exports = router;
