const { z } = require("zod");

const createProjectSchema = z.object({
  project_name: z
    .string()
    .min(3, "Project name must be at least 3 characters long"),
  assigned_team_id: z.string().uuid("Assigned team ID must be a valid UUID"),
});

module.exports = {
  createProjectSchema,
};
