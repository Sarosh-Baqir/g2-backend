const express = require("express");
const router = express.Router();
const {
  createProject,
  getUserProjects,
} = require("../controllers/projectController");
const authenticateUser = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const {
  createProjectSchema,
} = require("../validation_schemas/projectValidation");

router.post(
  "/create-project",
  authenticateUser,
  validateRequest(createProjectSchema),
  createProject
);
router.get("/", authenticateUser, getUserProjects);

module.exports = router;
