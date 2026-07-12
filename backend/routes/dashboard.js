const express = require("express");
const auth = require("../middleware/auth");

const dashboardController = require("../controllers/dashboard.controller");

const router = express.Router();

router.use(auth);

router.get("/kpis", dashboardController.getKPIs);

router.get("/filters", dashboardController.getFilters);

module.exports = router;