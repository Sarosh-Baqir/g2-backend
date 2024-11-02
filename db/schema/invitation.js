const {
  pgTable,
  integer,
  text,
  timestamp,
  uuid,
} = require("drizzle-orm/pg-core");
const { relations } = require("drizzle-orm");

const { agency } = require("./agency.js");
const { user } = require("./user.js");

// Define the invitation table
const invitation = pgTable("invitations", {
  invitation_id: uuid("invitation_id").primaryKey(),
  sender_user_id: uuid("sender_user_id").notNull(), // Foreign key to User
  recipient_user_id: uuid("recipient_user_id").notNull(), // Foreign key to User
  agency_id: uuid("agency_id").notNull(), // Foreign key to Agency
  status: text("status").notNull().default("pending"), // ENUM equivalent
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations for invitation
const invitationRelations = relations(invitation, ({ one }) => ({
  senderUser: one(user, {
    fields: [invitation.sender_user_id],
    references: [user.user_id],
  }),
  recipientUser: one(user, {
    fields: [invitation.recipient_user_id],
    references: [user.user_id],
  }),
  agency: one(agency, {
    fields: [invitation.agency_id],
    references: [agency.agency_id],
  }),
}));

module.exports = { invitation, invitationRelations };
