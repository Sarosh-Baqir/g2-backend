const { pgTable, integer, boolean, uuid } = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");
const { agency } = require("./agency.js");
const { user } = require("./user.js");

// Define the agency_user table
const agencyUser = pgTable("agency_users", {
  agency_user_id: uuid("agency_user_id").primaryKey(),
  agency_id: uuid("agency_id").notNull(), // Foreign key to Agency
  user_id: uuid("user_id").notNull(), // Foreign key to User
  is_admin: boolean("is_admin").default(false),
  invited: boolean("invited").default(false),
});

// Define relations for agencyUser
const agencyUserRelations = relations(agencyUser, ({ one }) => ({
  agency: one(agency, {
    fields: [agencyUser.agency_id],
    references: [agency.agency_id],
  }),
  user: one(user, {
    fields: [agencyUser.user_id],
    references: [user.user_id],
  }),
}));

module.exports = { agencyUser, agencyUserRelations };
