const { pgTable, integer, uuid } = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");
const { team } = require("./team.js");
const { user } = require("./user.js");

// Define the team_user table
const teamUser = pgTable("team_users", {
  team_user_id: uuid("team_user_id").primaryKey(),
  team_id: uuid("team_id").notNull(), // Foreign key to Team
  user_id: uuid("user_id").notNull(), // Foreign key to User
});

// Define relations for teamUser
const teamUserRelations = relations(teamUser, ({ one }) => ({
  team: one(team, {
    fields: [teamUser.team_id],
    references: [team.team_id],
  }),
  user: one(user, {
    fields: [teamUser.user_id],
    references: [user.user_id],
  }),
}));

module.exports = { teamUser, teamUserRelations };
