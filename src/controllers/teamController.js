const { eq, inArray, and, or } = require("drizzle-orm");
const { agencyUser } = require("../../db/schema/agencyUser");
const { agency } = require("../../db/schema/agency");
const { team } = require("../../db/schema/team");
const { teamUser } = require("../../db/schema/teamUser");
const { user } = require("../../db/schema/user");
const database = require("../../db/database");
const generateUUID = require("../utils/uuid");
const createTeam = async (req, res) => {
  const { team_name, agency_id, team_lead_user_id, members } = req.body;

  try {
    // Check if the agency exists and if the user is authorized
    const agency = await database
      .select()
      .from(agencyUser)
      .where(
        eq(agencyUser.agency_id, agency_id),
        eq(agencyUser.user_id, req.userId),
        eq(agencyUser.is_admin, true)
      );

    if (agency.length === 0) {
      return res.status(403).json({
        message: "You are not authorized to create a team for this agency.",
      });
    }

    // Check if the team lead user exists
    const teamLead = await database
      .select()
      .from(user)
      .where(eq(user.user_id, team_lead_user_id));

    if (teamLead.length === 0) {
      return res.status(404).json({ message: "Team lead not found." });
    }

    // Create the team with a generated UUID
    const teamId = generateUUID();
    const newTeam = await database.insert(team).values({
      team_id: teamId,
      team_name,
      agency_id,
      team_lead_user_id,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Add the team lead to the list of members
    let allMembers = [...members, teamLead[0].email];

    // Retrieve the user IDs for the provided member emails (including team lead)
    if (allMembers.length > 0) {
      const userEntries = await database
        .select()
        .from(user)
        .where(inArray(user.email, allMembers));

      if (userEntries.length !== allMembers.length) {
        return res
          .status(404)
          .json({ message: "One or more members not found" });
      }

      // Prepare the team members with unique IDs for team_user_id
      const teamUserEntries = userEntries.map((user) => ({
        team_user_id: generateUUID(), // Generate a unique ID for each team member
        team_id: teamId,
        user_id: user.user_id,
      }));

      // Insert team members
      await database.insert(teamUser).values(teamUserEntries);
    }

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
      })
      .from(team)
      .leftJoin(agency, eq(team.agency_id, agency.agency_id))
      .leftJoin(agencyUser, eq(agency.agency_id, agencyUser.agency_id))
      .leftJoin(teamUser, eq(team.team_id, teamUser.team_id))
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

    console.log("Distinct Teams: ", teams);

    if (!teams || teams.length === 0) {
      return res.status(404).json({ message: "No teams found for the user" });
    }

    // Step 3: Extract unique team IDs for fetching members
    const teamIds = teams.map((t) => t.team_id);
    console.log("Unique team IDs: ", teamIds);

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

    console.log("Members: ", members);

    // Step 5: Map members to respective teams
    const teamsWithMembers = teams.map((team) => ({
      ...team,
      members: members.filter((member) => member.team_id === team.team_id),
    }));
    console.log("Teams with Members: ", teamsWithMembers);

    return res.status(200).json({ teams: teamsWithMembers });
  } catch (error) {
    console.error("Error fetching user teams with members:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching teams" });
  }
};

module.exports = {
  createTeam,
  getUserTeamsWithMembers,
};
