const { eq, and } = require("drizzle-orm");
const database = require("../../db/database");
const { agency } = require("../../db/schema/agency");
const { agencyUser } = require("../../db/schema/agencyUser");
const { user } = require("../../db/schema/user");
const { invitation } = require("../../db/schema/invitation");

const generateUUID = require("../utils/uuid");

exports.createAgency = async (req, res) => {
  const { agency_name } = req.body;

  if (!agency_name) {
    return res.status(400).json({ message: "Agency name is required." });
  }
  //generate uuid
  const agencyId = generateUUID();

  try {
    const newAgency = await database.insert(agency).values({
      agency_id: agencyId,
      agency_name,
      created_by_user_id: req.userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const agencyUserId = generateUUID();
    const AgencyUser = await database.insert(agencyUser).values({
      agency_user_id: agencyUserId,
      agency_id: agencyId,
      user_id: req.userId,
      is_admin: true,
      invited: false,
    });
    try {
      const agencies = await database
        .select()
        .from(agency)
        .where(eq(agency.agency_id, agencyId));

      res.status(200).json(agencies);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
    //res.status(201).json(newAgency);
  } catch (error) {
    console.error("Error creating agency:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Fetch agencies associated with the logged-in user
exports.getAgencies = async (req, res) => {
  try {
    const agencies = await database
      .select()
      .from(agency)
      .where(eq(agency.created_by_user_id, req.userId)); // Assuming 'agencyid' is coming from a variable

    res.status(200).json(agencies);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Send an invitation to join the agency
exports.inviteUserToAgency = async (req, res) => {
  const { recipient_email, agency_id } = req.body;
  const sender_user_id = req.userId;
  // console.log("recipient email: ", recipient_email);
  // console.log("Agency Id: ", agency_id);
  // console.log("sender user id: ", sender_user_id);
  try {
    // Check if the sender is an admin in the agency
    const AgencyUser = await database
      .select()
      .from(agencyUser)
      .where(
        and(
          eq(agencyUser.agency_id, agency_id),
          eq(agencyUser.user_id, sender_user_id),
          eq(agencyUser.is_admin, true)
        )
      );

    if (!AgencyUser[0]) {
      return res.status(403).json({ message: "Only admins can invite users" });
    }
    //console.log(AgencyUser[0]);

    // Find the recipient by email
    const Recepient = await database
      .select()
      .from(user)
      .where(eq(user.email, recipient_email));
    if (!Recepient[0]) {
      return res.status(404).json({ message: "User not found" });
    }
    //console.log(Recepient[0]);

    // Check if an invitation already exists for this user
    const ExistingInvitation = await database
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.recipient_user_id, Recepient[0].user_id),
          eq(invitation.agency_id, agency_id),
          eq(invitation.status, "pending")
        )
      );

    //console.log("existing invitation: ", ExistingInvitation);
    if (ExistingInvitation[0]) {
      return res.status(400).json({ message: "Invitation already sent" });
    }

    // Create the invitation
    //generate uuid
    const inviteId = generateUUID();
    const Invitation = await database
      .insert(invitation)
      .values({
        invitation_id: inviteId,
        status: "pending",
        created_at: new Date(),
        updated_at: new Date(),
        sender_user_id,
        recipient_user_id: Recepient[0].user_id,
        agency_id,
      })
      .returning();
    //console.log("Invitation: ", Invitation);

    res.status(201).json({ message: "Invitation sent", Invitation });
  } catch (error) {
    console.error("Error inviting user:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getSentInvitations = async (req, res) => {
  const user_id = req.userId;
  try {
    // Fetch all invitations sent by the current user with recipient and agency details
    const sentInvitations = await database
      .select({
        invitation_id: invitation.invitation_id,
        status: invitation.status,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
        recipient_id: user.user_id,
        recipient_name: user.name,
        recipient_email: user.email,
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
      })
      .from(invitation)
      .where(eq(invitation.sender_user_id, user_id))
      .innerJoin(user, eq(invitation.recipient_user_id, user.user_id))
      .innerJoin(agency, eq(invitation.agency_id, agency.agency_id));

    res.status(200).json({ invitations: sentInvitations });
  } catch (error) {
    console.error("Error fetching sent invitations:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getReceivedInvitations = async (req, res) => {
  const user_id = req.userId;
  try {
    // Fetch all invitations received by the current user with sender and agency details
    const receivedInvitations = await database
      .select({
        invitation_id: invitation.invitation_id,
        status: invitation.status,
        createdAt: invitation.createdAt,
        updatedAt: invitation.updatedAt,
        sender_id: user.user_id,
        sender_name: user.name,
        sender_email: user.email,
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
      })
      .from(invitation)
      .where(eq(invitation.recipient_user_id, user_id))
      .innerJoin(user, eq(invitation.sender_user_id, user.user_id))
      .innerJoin(agency, eq(invitation.agency_id, agency.agency_id));
    console.log("received invitations: ", receivedInvitations);

    res.status(200).json({ invitations: receivedInvitations });
  } catch (error) {
    console.error("Error fetching sent invitations:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.respondToInvitation = async (req, res) => {
  const { invitation_id, response } = req.body; // response can be 'accepted' or 'rejected'
  const user_id = req.userId;

  try {
    // Check for a pending invitation for the current user
    const existingInvitation = await database
      .select()
      .from(invitation)
      .where(
        and(
          eq(invitation.invitation_id, invitation_id),
          eq(invitation.recipient_user_id, user_id),
          eq(invitation.status, "pending")
        )
      );
    console.log("existing invitation: ", existingInvitation);

    if (existingInvitation.length === 0) {
      return res
        .status(404)
        .json({ message: "Invitation not found or already responded to" });
    }

    // Update the invitation status
    const updatedStatus = response === "accepted" ? "accepted" : "rejected";
    await database
      .update(invitation)
      .set({ status: updatedStatus })
      .where(eq(invitation.invitation_id, invitation_id));

    // If accepted, add a new record to the agencyUser table
    //generate uuid
    const agencyUserId = generateUUID();
    if (response === "accepted") {
      await database.insert(agencyUser).values({
        agency_user_id: agencyUserId,
        agency_id: existingInvitation[0].agency_id,
        user_id: user_id,
        is_admin: false,
        invited: true,
      });
    }

    res.status(200).json({
      message: `Invitation ${response} successfully`,
      status: updatedStatus,
    });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
