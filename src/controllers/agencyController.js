const { eq, and, or } = require("drizzle-orm");
const database = require("../../db/database");
const { agency } = require("../../db/schema/agency");
const { agencyUser } = require("../../db/schema/agencyUser");
const { user } = require("../../db/schema/user");
const { invitation } = require("../../db/schema/invitation");
const { team } = require("../../db/schema/team");
const { teamUser } = require("../../db/schema/teamUser");
const { project } = require("../../db/schema/Project");

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

      // Fetch all users associated with the current agency
      const agencyUsers = await database
        .select({
          agency_user_id: agencyUser.agency_user_id,
          is_admin: agencyUser.is_admin,
        })
        .from(agencyUser)
        .where(eq(agencyUser.agency_id, agencyId));
      // Calculate total members and total admins
      const total_members = agencyUsers.length;
      const total_admins = agencyUsers.filter((user) => user.is_admin).length;

      // Add total_members and total_admins to the agencies object
      const agencyWithCounts = agencies.map((agency) => ({
        ...agency,
        total_members,
        total_admins,
      }));

      console.log(`Total Admins: ${total_admins}`);
      console.log(`Total Members: ${total_members}`);

      res.status(200).json(agencyWithCounts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
    //res.status(201).json(newAgency);
  } catch (error) {
    console.error("Error creating agency:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

exports.editAgency = async (req, res) => {
  console.log("in controller of edit agency");
  const { agency_id, agency_name } = req.body;
  console.log("agency id: ", agency_id);
  console.log("agency new name: ", agency_name);
  if (!agency_id || !agency_name) {
    return res
      .status(400)
      .json({ message: "Agency ID and new name are required" });
  }

  try {
    // Update the agency name
    const result = await database
      .update(agency)
      .set({ agency_name: agency_name, updatedAt: new Date() })
      .where(eq(agency.agency_id, agency_id));
    console.log(result);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Agency not found" });
    }

    res.status(200).json({ message: "Agency name updated successfully" });
  } catch (error) {
    console.error("Error updating agency name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAgencies = async (req, res) => {
  try {
    // Step 1: Fetch all agencies created by the user
    const agencies = await database
      .select({
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
      })
      .from(agency)
      .where(eq(agency.created_by_user_id, req.userId));

    // Step 2: For each agency, fetch all associated users and calculate counts in JavaScript
    const agencyData = await Promise.all(
      agencies.map(async (agency) => {
        // Fetch all users associated with the current agency
        const agencyUsers = await database
          .select({
            agency_user_id: agencyUser.agency_user_id,
            is_admin: agencyUser.is_admin,
          })
          .from(agencyUser)
          .where(eq(agencyUser.agency_id, agency.agency_id));

        // Calculate total members and total admins
        const total_members = agencyUsers.length;
        const total_admins = agencyUsers.filter((user) => user.is_admin).length;
        console.log(total_admins);

        return {
          ...agency,
          total_members,
          total_admins,
        };
      })
    );

    res.status(200).json(agencyData);
  } catch (error) {
    console.error("Error fetching agencies:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getAgencyDetails = async (req, res) => {
  console.log("IN controller");
  try {
    const { agency_id } = req.query; // Make sure you're fetching agency_id from query parameters
    console.log("agency_id: ", agency_id);

    // Step 1: Get the agency information
    const agencyInfo = await database
      .select({
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
        created_at: agency.createdAt,
        updated_at: agency.updatedAt,
        created_by_user_id: user.email,
        created_by_user_name: user.name,
      })
      .from(agency)
      .innerJoin(user, eq(agency.created_by_user_id, user.user_id))
      .where(eq(agency.agency_id, agency_id));

    if (agencyInfo.length === 0) {
      return res.status(404).json({ message: "Agency not found" });
    }

    console.log("Agency Info: ", agencyInfo[0]);

    // Step 2: Get all teams within the agency
    const teams = await database
      .select({
        team_id: team.team_id,
        team_name: team.team_name,
        created_at: team.createdAt,
        updated_at: team.updatedAt,
        team_lead_user_id: user.user_id,
        team_lead_user_name: user.name,
      })
      .from(team)
      .innerJoin(user, eq(team.team_lead_user_id, user.user_id))
      .where(eq(team.agency_id, agency_id));

    console.log("teams: ", teams);

    // Step 3: For each team, get its members
    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await database
          .select({
            user_id: user.user_id,
            name: user.name,
            email: user.email,
          })
          .from(teamUser)
          .innerJoin(user, eq(teamUser.user_id, user.user_id))
          .where(eq(teamUser.team_id, team.team_id));

        return {
          ...team,
          members,
        };
      })
    );
    console.log("teams with members: ", teamsWithMembers);
    // Step 4: Get all agency users, separated into admins and other users
    const agencyUsers = await database
      .select({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        is_admin: agencyUser.is_admin,
      })
      .from(agencyUser)
      .innerJoin(user, eq(agencyUser.user_id, user.user_id))
      .where(eq(agencyUser.agency_id, agency_id));

    const admins = agencyUsers.filter((user) => user.is_admin);
    const otherUsers = agencyUsers.filter((user) => !user.is_admin);
    console.log("admins: ", admins);
    console.log("other users: ", otherUsers);
    // Final result
    const agencyDetails = {
      ...agencyInfo[0],
      teams: teamsWithMembers,
      admins,
      otherUsers,
    };

    res.status(200).json(agencyDetails);
  } catch (error) {
    console.error("Error fetching agency details:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Send an invitation to join the agency
exports.inviteUserToAgency = async (req, res) => {
  const { recipient_email, agency_name } = req.body;
  const sender_user_id = req.userId;
  const agencyName = agency_name;
  // console.log("recipient email: ", recipient_email);
  //console.log("Agency name: ", agency_name);
  // console.log("sender user id: ", sender_user_id);
  try {
    //get the id of agency
    const agencyId = await database
      .select({ agency_id: agency.agency_id })
      .from(agency)
      .where(eq(agency.agency_name, agencyName));

    const agency_id = agencyId[0].agency_id;
    console.log("agency_id: ", agency_id);
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
    // Creating a new object with additional property 'email'
    const newInvitation = {
      ...Invitation[0],
      recipient_email: recipient_email,
    };
    const agency_name = await database
      .select({
        agency_name: agency.agency_name,
      })
      .from(agency)
      .where(eq(agency.agency_id, agency_id));
    console.log(agency_name);
    Object.assign(newInvitation, agency_name[0]);

    console.log("Invitation: ", newInvitation);

    res.status(201).json({ message: "Invitation sent", newInvitation });
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
    if (sentInvitations.length == 0) {
      return res
        .status(201)
        .json({ message: "You have no sent invitation", invitations: [] });
    }

    return res.status(200).json({ invitations: sentInvitations });
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
    if (receivedInvitations.length == 0) {
      return res
        .status(201)
        .json({ message: "You have no received invitation", invitations: [] });
    }

    return res.status(200).json({ invitations: receivedInvitations });
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

    return res.status(200).json({
      message: `Invitation ${response} successfully`,
      status: updatedStatus,
    });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

exports.getAdminAgenciesByUserId = async (req, res) => {
  try {
    const agencies = await database
      .select({
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
      })
      .from(agency)
      .innerJoin(agencyUser, eq(agency.agency_id, agencyUser.agency_id))
      .where(
        eq(agencyUser.user_id, req.userId),
        eq(agencyUser.is_admin, true) // Combine conditions in the same where call
      );

    return res.json(agencies); // Send the response back as JSON
  } catch (error) {
    console.error("Error fetching admin agencies:", error);
    return res.status(500).json({ error: "Failed to fetch agencies" }); // Return error response
  }
};

exports.deleteAgencyAndRelatedData = async (req, res) => {
  console.log("in delete controller");
  const { agencyId } = req.body; // Expecting agencyId to be passed in the request body

  console.log("agencyId: ", agencyId);

  try {
    const projects = await database
      .select({
        project_id: project.project_id,
        project_name: project.project_name,
        created_by_user_id: project.created_by_user_id,
        assigned_team_id: team.team_id,
        assigned_team_name: team.team_name,
        team_members: teamUser.user_id, // This will contain IDs of team members
      })
      .from(project)
      .leftJoin(team, eq(project.assigned_team_id, team.team_id))
      .leftJoin(teamUser, eq(teamUser.team_id, team.team_id)) // Join to get team members
      .where(eq(team.agency_id, agencyId)); // Filter by agency_id

    // Use reduce to filter unique projects by project_id
    const uniqueProjects = projects.reduce((acc, current) => {
      // Check if the project already exists in the accumulator
      const existingProject = acc.find(
        (proj) => proj.project_id === current.project_id
      );

      if (existingProject) {
        // If it exists, push the team member ID to the existing project's team_members array
        if (current.team_member_id) {
          existingProject.team_members.push(current.team_member_id);
        }
      } else {
        // If it doesn't exist, create a new project entry
        acc.push({
          project_id: current.project_id,
          project_name: current.project_name,
          created_by_user_id: current.created_by_user_id,
          assigned_team_id: current.assigned_team_id,
          assigned_team_name: current.assigned_team_name,
          team_members: current.team_member_id ? [current.team_member_id] : [], // Initialize with the team member ID
        });
      }

      return acc; // Return the accumulator for the next iteration
    }, []);

    console.log(uniqueProjects);
    // Step 3: Delete projects
    await deleteProjects(uniqueProjects);
    await deleteTeamsAndUsersByAgency(agencyId);
    await deleteInvitationsByAgency(agencyId);
    await deleteAgencyAndUsers(agencyId);
    return res.status(200).json({
      message: "Agency and its related data has been deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting agency data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete agency data.",
    });
  }
};
async function deleteProjects(uniqueProjects) {
  try {
    // Loop through each unique project and delete
    for (const uniqueProject of uniqueProjects) {
      await database
        .delete(project)
        .where(eq(project.project_id, uniqueProject.project_id));
    }

    console.log("Deleted all specified projects successfully.");
  } catch (error) {
    console.error("Error deleting projects:", error);
    throw error; // Re-throw for further handling if needed
  }
}

async function deleteTeamsAndUsersByAgency(agencyId) {
  try {
    // Fetch all teams associated with the agency
    const teams = await database
      .select({ team_id: team.team_id })
      .from(team)
      .where(eq(team.agency_id, agencyId));

    // Extract team IDs
    const teamIds = teams.map((t) => t.team_id);
    console.log("teams: ", teams);

    // Delete associated team users
    for (const id of teamIds) {
      await database.delete(teamUser).where(eq(teamUser.team_id, id));
    }

    // Delete teams
    await database.delete(team).where(eq(team.agency_id, agencyId));

    console.log("Deleted teams and associated team users successfully.");
  } catch (error) {
    console.error("Error deleting teams and users:", error);
    throw error; // Re-throw for further handling if needed
  }
}

async function deleteInvitationsByAgency(agencyId) {
  try {
    // Delete invitations associated with the specified agency ID
    await database.delete(invitation).where(eq(invitation.agency_id, agencyId));

    console.log(
      "Deleted invitations associated with the specified agency successfully."
    );
  } catch (error) {
    console.error("Error deleting invitations:", error);
    throw error; // Re-throw for further handling if needed
  }
}

async function deleteAgencyAndUsers(agencyId) {
  try {
    // Delete agency users associated with the specified agency ID
    await database.delete(agencyUser).where(eq(agencyUser.agency_id, agencyId));

    // Delete the agency itself
    await database.delete(agency).where(eq(agency.agency_id, agencyId));

    console.log("Deleted agency and associated agency users successfully.");
  } catch (error) {
    console.error("Error deleting agency and users:", error);
    throw error; // Re-throw for further handling if needed
  }
}

exports.deleteInvitation = async (req, res) => {
  const { invitation_id } = req.body; // response can be 'accepted' or 'rejected'
  const user_id = req.userId;
  console.log(invitation_id);
  console.log(user_id);

  try {
    // Check for a pending invitation for the current user
    const existingInvitation = await database
      .delete(invitation)
      .where(
        and(
          eq(invitation.invitation_id, invitation_id),
          eq(invitation.sender_user_id, user_id),
          or(
            eq(invitation.status, "pending"),
            eq(invitation.status, "rejected")
          )
        )
      )
      .returning();
    console.log("deleted invitation: ", existingInvitation);

    if (existingInvitation.length === 0) {
      return res.status(404).json({ message: "Invitation already accepted" });
    }

    res.status(200).json({
      message: `Invitation cancelled successfully`,
      cancelledInvitation: existingInvitation,
    });
  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ message: "Server error", error });
  }
};
