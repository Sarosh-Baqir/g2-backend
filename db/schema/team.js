const {
  pgTable,
  integer,
  varchar,
  timestamp,
  uuid,
} = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");
const { agency } = require("./agency.js");
const { user } = require("./user.js");

// Define the team table
const team = pgTable("teams", {
  team_id: uuid("team_id").primaryKey(),
  team_name: varchar("team_name").notNull(),
  agency_id: uuid("agency_id").notNull(), // Foreign key to Agency
  team_lead_user_id: uuid("team_lead_user_id").notNull(), // Foreign key to User
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for team
const teamRelations = relations(team, ({ one }) => ({
  agency: one(agency, {
    fields: [team.agency_id],
    references: [agency.agency_id],
  }),
  teamLeadUser: one(user, {
    fields: [team.team_lead_user_id],
    references: [user.user_id],
  }),
}));

module.exports = { team, teamRelations };
