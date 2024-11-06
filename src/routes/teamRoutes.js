const express = require("express");
const router = express.Router();
const {
  createTeam,
  getUserTeamsWithMembers,
  getTeamsByAgency,
  getTeamDetails,
  deleteTeamAndRelatedData,
  editTeam,
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

// to get all teams in a particular agency
router.get("/agency/:agencyId", getTeamsByAgency);

// Get the details of each team
router.get("/details", authenticateUser, getTeamDetails);

router.post("/delete", authenticateUser, deleteTeamAndRelatedData);

// Edit team
router.post("/edit", authenticateUser, editTeam);

module.exports = router;
