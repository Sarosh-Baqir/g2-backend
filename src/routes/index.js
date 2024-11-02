const express = require("express");

const userRoutes = require("./userRoutes");
const agencyRoutes = require("./agencyRoutes");
const teamRoutes = require("./teamRoutes");
const projectRoutes = require("./projectRoutes");
const router = express.Router();

router.use("/users", userRoutes);
router.use("/agencies", agencyRoutes);
router.use("/teams", teamRoutes);
router.use("/projects", projectRoutes);

module.exports = router;
