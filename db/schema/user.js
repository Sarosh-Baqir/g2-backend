const { pgTable, varchar, timestamp, uuid } = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");

const user = pgTable("users", {
  user_id: uuid("user_id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

const userRelations = relations(user, ({ many }) => ({
  agencies: many(agency),
  sentInvitations: many(invitation, { relationName: "Sender" }),
  receivedInvitations: many(invitation, { relationName: "Recipient" }),
  teams: many(team),
}));

module.exports = {
  user,
  userRelations,
};
