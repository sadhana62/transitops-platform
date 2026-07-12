const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);

router.post("/login", authController.login);

router.get("/roles", authController.getRoles);

module.exports = router;