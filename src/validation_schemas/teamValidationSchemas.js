// team.validation_schema.js
const { z } = require("zod");

// Validation schema for creating a team
const createTeamSchema = z.object({
  team_name: z
    .string()
    .min(2, { message: "Team name must be at least 2 characters long" }),
  agency_id: z.string().uuid({ message: "Invalid agency ID" }),
  team_lead_user_id: z.string().uuid({ message: "Invalid team lead user ID" }),
  members: z
    .array(z.string().email({ message: "Each member must be a valid email" }))
    .optional(),
});

module.exports = {
  createTeamSchema,
};
