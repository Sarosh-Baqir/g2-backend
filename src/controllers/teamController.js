const { eq, inArray, and, or } = require("drizzle-orm");
const { agencyUser } = require("../../db/schema/agencyUser");
const { agency } = require("../../db/schema/agency");
const { team } = require("../../db/schema/team");
const { teamUser } = require("../../db/schema/teamUser");
const { user } = require("../../db/schema/user");
const { project } = require("../../db/schema/Project");
const database = require("../../db/database");
const generateUUID = require("../utils/uuid");

const createTeam = async (req, res) => {
  const { team_name, agency_id, team_lead_email, members } = req.body;

  try {
    // Check if the agency exists and if the user is authorized as an admin
    const adminAgencyUser = await database
      .select()
      .from(agencyUser)
      .where(
        eq(agencyUser.agency_id, agency_id),
        eq(agencyUser.user_id, req.userId),
        eq(agencyUser.is_admin, true)
      );

    if (adminAgencyUser.length === 0) {
      return res.status(200).json({
        message: "You are not authorized to create a team for this agency.",
      });
    }

    // Verify if the team lead is in the agency with invited status
    const teamLeadInAgency = await database
      .select()
      .from(agencyUser)
      .where(eq(agencyUser.agency_id, agency_id), eq(agencyUser.invited, true));

    const teamLeadUser = await database
      .select()
      .from(user)
      .where(eq(user.email, team_lead_email));

    // Check if the team lead exists in both the user table and agencyUser table
    const isTeamLeadInAgency = teamLeadInAgency.some(
      (entry) => entry.user_id === teamLeadUser[0]?.user_id
    );

    if (!isTeamLeadInAgency) {
      return res.status(200).json({
        message: "Team lead must first be invited to the agency.",
      });
    }

    // Verify if all members are in the agency
    const allMembersEmails = [...members, team_lead_email];

    const agencyUsers = await database
      .select()
      .from(agencyUser)
      .where(eq(agencyUser.agency_id, agency_id), eq(agencyUser.invited, true));

    const agencyUserIds = agencyUsers.map((entry) => entry.user_id);

    const users = await database
      .select()
      .from(user)
      .where(inArray(user.email, allMembersEmails));

    const invitedEmails = users
      .filter((user) => agencyUserIds.includes(user.user_id))
      .map((user) => user.email);

    const missingMembers = allMembersEmails.filter(
      (email) => !invitedEmails.includes(email)
    );

    if (missingMembers.length > 0) {
      return res.status(200).json({
        message: `The following members must first be invited to the agency: ${missingMembers.join(
          ", "
        )}.`,
      });
    }

    // Retrieve the team lead ID and create the team
    const teamLead = users.find((user) => user.email === team_lead_email);
    const team_lead_user_id = teamLead.user_id;
    const teamId = generateUUID();

    const newTeam = await database.insert(team).values({
      team_id: teamId,
      team_name,
      agency_id,
      team_lead_user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Prepare team members with unique IDs
    const teamUserEntries = users.map((user) => ({
      team_user_id: generateUUID(),
      team_id: teamId,
      user_id: user.user_id,
    }));

    await database.insert(teamUser).values(teamUserEntries);
    res
      .status(201)
      .json({ message: "Team created successfully", team: newTeam });
  } catch (error) {
    console.error("Error creating team:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getUserTeamsWithMembers = async (req, res) => {
  const userId = req.userId;

  try {
    // Step 1: Fetch all relevant teams where the user is admin, creator, or member
    const rawTeams = await database
      .select({
        team_id: team.team_id,
        team_name: team.team_name,
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
        team_lead_user_id: team.team_lead_user_id,
        team_lead_name: user.name,
        team_lead_email: user.email,
      })
      .from(team)
      .leftJoin(agency, eq(team.agency_id, agency.agency_id))
      .leftJoin(agencyUser, eq(agency.agency_id, agencyUser.agency_id))
      .leftJoin(teamUser, eq(team.team_id, teamUser.team_id))
      .leftJoin(user, eq(team.team_lead_user_id, user.user_id)) // Join with user table for team lead details
      .where(
        or(
          eq(agency.created_by_user_id, userId),
          and(eq(agencyUser.user_id, userId), eq(agencyUser.is_admin, true)),
          eq(teamUser.user_id, userId)
        )
      );

    // Step 2: Remove duplicates by team_id
    const teams = rawTeams.filter(
      (team, index, self) =>
        index === self.findIndex((t) => t.team_id === team.team_id)
    );

    if (!teams || teams.length === 0) {
      return res.status(200).json({ message: "No teams found for the user" });
    }

    // Step 3: Extract unique team IDs for fetching members
    const teamIds = teams.map((t) => t.team_id);

    // Step 4: Fetch all members for the retrieved teams
    const members = await database
      .select({
        team_id: teamUser.team_id,
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      })
      .from(teamUser)
      .leftJoin(user, eq(teamUser.user_id, user.user_id))
      .where(inArray(teamUser.team_id, teamIds));

    // Step 5: Map members and team lead to respective teams
    const teamsWithMembersAndLead = teams.map((team) => ({
      ...team,
      members: members.filter((member) => member.team_id === team.team_id),
      team_lead: {
        name: team.team_lead_name,
        email: team.team_lead_email,
      },
    }));

    return res.status(200).json({ teams: teamsWithMembersAndLead });
  } catch (error) {
    console.error("Error fetching user teams with members:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching teams" });
  }
};

const getTeamsByAgency = async (req, res) => {
  console.log("in controller");
  const { agencyId } = req.params;

  try {
    // Fetch teams based on agency ID
    const teams = await database
      .select()
      .from(team)
      .where(eq(team.agency_id, agencyId));

    if (teams.length === 0) {
      return res
        .status(404)
        .json({ message: "No teams found for this agency." });
    }
    console.log(teams);

    res.status(200).json(teams);
  } catch (error) {
    console.error("Error fetching teams:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

const getTeamDetails = async (req, res) => {
  console.log("Fetching team details...");
  const { team_id } = req.query; // Make sure you're fetching team_id from query parameters
  console.log("team_id: ", team_id);

  try {
    // Step 1: Get the team information along with agency and team lead details
    const teamDetails = await database
      .select({
        team_id: team.team_id,
        team_name: team.team_name,
        created_at: team.createdAt,
        updated_at: team.updatedAt,
        agency_id: agency.agency_id,
        agency_name: agency.agency_name,
        team_lead_user_id: user.user_id,
        team_lead_user_name: user.name,
      })
      .from(team)
      .innerJoin(agency, eq(team.agency_id, agency.agency_id))
      .innerJoin(user, eq(team.team_lead_user_id, user.user_id))
      .where(eq(team.team_id, team_id));

    console.log("Team Details: ", teamDetails);

    if (teamDetails.length === 0) {
      return res.status(404).json({ message: "Team not found" });
    }

    // Step 2: Get all members of the team
    const members = await database
      .select({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
      })
      .from(teamUser)
      .innerJoin(user, eq(teamUser.user_id, user.user_id))
      .where(eq(teamUser.team_id, team_id));

    console.log("Team Members: ", members);

    // Final result
    const result = {
      ...teamDetails[0], // Spread team details
      members, // Add members
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching team details:", error);
    res.status(500).json({ message: "Failed to fetch team details" });
  }
};

const deleteTeamAndRelatedData = async (req, res) => {
  console.log("in delete controller");
  const { teamId } = req.body;

  console.log("teamId: ", teamId);

  try {
    const deletedProj = await database
      .delete(project)
      .where(eq(project.assigned_team_id, teamId))
      .returning();
    console.log("deleted project: ", deletedProj);
    const deletedTeamUser = await database
      .delete(teamUser)
      .where(eq(teamUser.team_id, teamId))
      .returning();
    console.log("deleted team user: ", deletedTeamUser);
    // Delete teams
    const deletedTeam = await database
      .delete(team)
      .where(eq(team.team_id, teamId))
      .returning();
    console.log("deleted team: ", deletedTeam);
    res.status(200).json(deletedTeam);
  } catch (error) {
    console.error("Error deleting team data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete team data.",
    });
  }
};

const editTeam = async (req, res) => {
  console.log("in controller of edit team");
  const { team_id, team_name } = req.body; // Extract agency ID and new name from the request body
  console.log("team id: ", team_id);
  console.log("team new name: ", team_name);
  if (!team_id || !team_name) {
    return res
      .status(400)
      .json({ message: "team ID and new name are required" });
  }

  try {
    // Update the agency name
    const result = await database
      .update(team)
      .set({ team_name: team_name, updatedAt: new Date() })
      .where(eq(team.team_id, team_id));
    console.log(result);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "team not found" });
    }

    res.status(200).json({ message: "team name updated successfully" });
  } catch (error) {
    console.error("Error updating team name:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createTeam,
  getUserTeamsWithMembers,
  getTeamsByAgency,
  getTeamDetails,
  deleteTeamAndRelatedData,
  editTeam,
};
