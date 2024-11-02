const express = require("express");
const router = express.Router();
const {
  createTeam,
  getUserTeamsWithMembers,
} = require("../controllers/teamController");
const authenticateUser = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const {
  createTeamSchema,
} = require("../validation_schemas/teamValidationSchemas");

// Route to create a team with validation
router.post(
  "/create-team",
  authenticateUser,
  validateRequest(createTeamSchema),
  createTeam
);

router.get("/", authenticateUser, getUserTeamsWithMembers);

module.exports = router;
