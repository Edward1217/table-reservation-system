const express = require("express");

const {
  getAllTables,
  getAvailableTables,
} = require("../controllers/tableController");

const router = express.Router();

router.get("/", getAllTables);

router.get("/available", getAvailableTables);

module.exports = router;
