const express = require("express");
const {
  createAgency,
  getAgencies,
  inviteUserToAgency,
  getSentInvitations,
  getReceivedInvitations,
  respondToInvitation,
  getAgencyDetails,
  getAdminAgenciesByUserId,
  editAgency,
  deleteAgencyAndRelatedData,
  deleteInvitation,
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

// Edit agency
router.post("/edit", authenticateUser, editAgency);

router.post("/delete", authenticateUser, deleteAgencyAndRelatedData);
router.post("/deleteInvitation", authenticateUser, deleteInvitation);
// Get agencies where admin
router.get("/adminAgencies", authenticateUser, getAdminAgenciesByUserId);

// Get the details of each agency
router.get("/details", authenticateUser, getAgencyDetails);

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
