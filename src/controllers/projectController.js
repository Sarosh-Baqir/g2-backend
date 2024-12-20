const { eq, and, or } = require("drizzle-orm");
const database = require("../../db/database");
const { project } = require("../../db/schema/Project");
const { team } = require("../../db/schema/team");
const { agencyUser: agencyUserTable } = require("../../db/schema/agencyUser");
const { teamUser } = require("../../db/schema/teamUser");
const { user } = require("../../db/schema/user");
const generateUUID = require("../utils/uuid");

const createProject = async (req, res) => {
  const { project_name, assigned_team_id } = req.body;
  const created_by_user_id = req.userId;

  try {
    // Step 1: Check if the assigned team exists and get the agency_id
    const assignedTeam = await database
      .select({ agency_id: team.agency_id })
      .from(team)
      .where(eq(team.team_id, assigned_team_id))
      .then((teams) => teams[0]);

    if (!assignedTeam) {
      return res.status(404).json({
        success: false,
        message: "Assigned team not found",
      });
    }

    const agency_id = assignedTeam.agency_id;

    // Step 2: Check if the user is an admin in the AgencyUser table
    const agencyUserRecord = await database
      .select({ is_admin: agencyUserTable.is_admin })
      .from(agencyUserTable)
      .where(
        and(
          eq(agencyUserTable.agency_id, agency_id),
          eq(agencyUserTable.user_id, created_by_user_id)
        )
      )
      .then((users) => users[0]);

    if (!agencyUserRecord) {
      return res.status(403).json({
        success: false,
        message: "User does not belong to the agency",
      });
    }

    // Generate UUID for project ID
    const projectId = generateUUID();

    if (agencyUserRecord.is_admin) {
      // Step 3: If the user is an admin, allow them to create the project
      const newProject = await database
        .insert(project)
        .values({
          project_id: projectId,
          project_name,
          created_by_user_id,
          assigned_team_id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      return res.status(200).json({
        success: true,
        message: "Project created successfully by Admin",
        project: newProject[0],
      });
    }

    // Step 4: If the user is not an Admin, check if they are the Team-lead of the assigned team
    const isTeamLead = await database
      .select({ team_lead_user_id: team.team_lead_user_id })
      .from(team)
      .where(
        and(
          eq(team.team_id, assigned_team_id),
          eq(team.team_lead_user_id, created_by_user_id)
        )
      )
      .then((teams) => teams[0]);

    if (isTeamLead) {
      // Step 5: Team-lead can create a project for their own team
      const newProject = await database
        .insert(project)
        .values({
          project_id: projectId,
          project_name,
          created_by_user_id,
          assigned_team_id,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .returning();

      return res.status(200).json({
        success: true,
        message: "Project created successfully by Team-lead",
        project: newProject[0],
      });
    } else {
      return res.status(403).json({
        success: false,
        message: "Only the Team-lead can create a project for this team",
      });
    }
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      success: false,
      message: "Error creating project",
    });
  }
};

const getUserProjects = async (req, res) => {
  const userId = req.userId;

  try {
    // Step 1: Query all projects where the user is either the creator or part of the assigned team
    const projects = await database
      .select({
        project_id: project.project_id,
        project_name: project.project_name,
        created_by_user_id: project.created_by_user_id,
        created_by_user_name: user.name,
        created_by_user_email: user.email,
        assigned_team_id: team.team_id,
        assigned_team_name: team.team_name,
        team_members: teamUser.user_id, // This will contain IDs of team members
      })
      .from(project)
      .leftJoin(team, eq(project.assigned_team_id, team.team_id))
      .leftJoin(teamUser, eq(teamUser.team_id, team.team_id))
      .leftJoin(user, eq(project.created_by_user_id, user.user_id))
      .where(
        or(
          eq(project.created_by_user_id, userId), // User is creator of the project
          eq(teamUser.user_id, userId) // User is part of the assigned team
        )
      );

    console.log("projects: ", projects);

    // Remove duplicate projects based on project_id
    const uniqueProjects = Array.from(
      new Map(projects.map((p) => [p.project_id, p])).values()
    );
    console.log("unique projects: ", uniqueProjects);

    // Step 2: Check if any projects were found
    if (uniqueProjects.length === 0) {
      return res.status(201).json({
        message: "No projects found for the user",
      });
    }

    // Step 3: Respond with the list of projects
    return res.status(200).json({
      success: true,
      message: "Projects fetched successfully",
      uniqueProjects,
    });
  } catch (error) {
    console.error("Error fetching user projects:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching projects for user",
    });
  }
};

const getProjectDetails = async (req, res) => {
  console.log("Fetching project details...");
  const { project_id } = req.query; // Fetching project_id from query parameters
  console.log("project_id: ", project_id);

  try {
    // Step 1: Get the project information along with team and user details
    const projectDetails = await database
      .select({
        project_id: project.project_id,
        project_name: project.project_name,
        created_at: project.createdAt,
        updated_at: project.updatedAt,
        assigned_team_id: team.team_id,
        assigned_team_name: team.team_name,
        created_by_user_id: user.user_id,
        created_by_user_name: user.name,
        created_by_user_email: user.email,
      })
      .from(project)
      .innerJoin(team, eq(project.assigned_team_id, team.team_id))
      .innerJoin(user, eq(project.created_by_user_id, user.user_id))
      .where(eq(project.project_id, project_id));

    console.log("Project Details: ", projectDetails);

    if (projectDetails.length === 0) {
      return res.status(201).json({ message: "Project not found" });
    }

    // Final result
    const result = projectDetails[0]; // Since we're expecting one project detail

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching project details:", error);
    res.status(500).json({ message: "Failed to fetch project details" });
  }
};

const deleteProject = async (req, res) => {
  console.log("in delete controller");
  const { projectId } = req.body;

  console.log("projectId: ", projectId);

  try {
    const deletedProj = await database
      .delete(project)
      .where(eq(project.project_id, projectId))
      .returning();
    console.log("deleted project: ", deletedProj);
    res.status(200).json(deletedProj);
  } catch (error) {
    console.error("Error deleting project data:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete project data.",
    });
  }
};

module.exports = {
  createProject,
  getUserProjects,
  getProjectDetails,
  deleteProject,
};
