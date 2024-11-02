const {
  pgTable,
  integer,
  varchar,
  uuid,
  timestamp,
} = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");

const { team } = require("./team.js");
const { user } = require("./user.js");

// Define the project table
const project = pgTable("projects", {
  project_id: uuid("project_id").primaryKey(),
  project_name: varchar("project_name").notNull(),
  created_by_user_id: uuid("created_by_user_id").notNull(), // Foreign key to User
  assigned_team_id: uuid("assigned_team_id").notNull(), // Foreign key to Team
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for project
const projectRelations = relations(project, ({ one }) => ({
  team: one(team, {
    fields: [project.assigned_team_id],
    references: [team.team_id],
  }),
  createdByUser: one(user, {
    fields: [project.created_by_user_id],
    references: [user.user_id],
  }),
}));

module.exports = { project, projectRelations };
