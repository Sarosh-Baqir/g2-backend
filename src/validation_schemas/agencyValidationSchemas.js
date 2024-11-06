const { z } = require("zod");

// Schema for creating an agency
const createAgencySchema = z.object({
  agency_name: z.string().min(1, { message: "Agency name is required" }),
});

// Schema for inviting a user to an agency
const inviteUserToAgencySchema = z.object({
  recipient_email: z.string().email({ message: "Invalid email format" }),
  agency_name: z.string().min(1, { message: "Agency name is required" }),
});

// Schema for responding to an invitation
const respondToInvitationSchema = z.object({
  invitation_id: z.string().uuid({ message: "Invalid invitation ID format" }),
  response: z.enum(["accepted", "rejected"], {
    message: "Response must be 'accepted' or 'rejected'",
  }),
});

// Schema for validating query parameters for retrieving sent invitations
const getSentInvitationsSchema = z.object({
  user_id: z.string().uuid({ message: "Invalid user ID format" }).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
});

// Schema for validating query parameters for retrieving received invitations
const getReceivedInvitationsSchema = z.object({
  user_id: z.string().uuid({ message: "Invalid user ID format" }).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).optional(),
});

module.exports = {
  createAgencySchema,
  inviteUserToAgencySchema,
  respondToInvitationSchema,
  getSentInvitationsSchema,
  getReceivedInvitationsSchema,
};
