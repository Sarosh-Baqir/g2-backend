const express = require("express");
const {
  createAgency,
  getAgencies,
  inviteUserToAgency,
  getSentInvitations,
  getReceivedInvitations,
  respondToInvitation,
} = require("../controllers/agencyController");
const authenticateUser = require("../middlewares/authMiddleware");
const validateRequest = require("../middlewares/validateRequest");
const {
  createAgencySchema,
  inviteUserToAgencySchema,
  respondToInvitationSchema,
  getSentInvitationsSchema,
  getReceivedInvitationsSchema,
} = require("../validation_schemas/agencyValidationSchemas");

const router = express.Router();

// Create a new agency
router.post(
  "/",
  authenticateUser,
  validateRequest(createAgencySchema),
  createAgency
);

// Get all agencies
router.get("/", authenticateUser, getAgencies);

// Invite a user to an agency
router.post(
  "/invite",
  authenticateUser,
  validateRequest(inviteUserToAgencySchema),
  inviteUserToAgency
);

// Get sent invitations with query validation
router.get(
  "/invitations/sent",
  authenticateUser,
  validateRequest(getSentInvitationsSchema, "query"),
  getSentInvitations
);

// Get received invitations with query validation
router.get(
  "/invitations/received",
  authenticateUser,
  validateRequest(getReceivedInvitationsSchema, "query"),
  getReceivedInvitations
);

// Respond to an invitation
router.post(
  "/invitations/respond",
  authenticateUser,
  validateRequest(respondToInvitationSchema),
  respondToInvitation
);

module.exports = router;