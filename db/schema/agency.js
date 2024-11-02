const {
  pgTable,
  integer,
  varchar,
  timestamp,
  uuid,
} = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");

const { user } = require("./user.js");

// Define the agency table
const agency = pgTable("agencies", {
  agency_id: uuid("agency_id").primaryKey(),
  agency_name: varchar("agency_name").notNull(),
  created_by_user_id: uuid("created_by_user_id").notNull(), // Foreign key to User
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for agency
const agencyRelations = relations(agency, ({ one, many }) => ({
  createdByUser: one(user, {
    fields: [agency.created_by_user_id],
    references: [user.user_id],
  }),
}));

module.exports = {
  agency,
  agencyRelations,
};
