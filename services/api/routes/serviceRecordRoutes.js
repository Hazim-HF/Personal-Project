const express = require("express");
const { listServiceRecords, createServiceRecord } = require("../controllers/serviceRecordController");

const router = express.Router();

router.get("/", listServiceRecords);
router.post("/", createServiceRecord);

module.exports = router;
