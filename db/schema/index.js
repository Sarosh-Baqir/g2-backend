const { user } = require("./user.js");
const { agency, agencyRelations } = require("./agency.js");
const { agencyUser, agencyUserRelations } = require("./agencyUser.js");
const { team, teamRelations } = require("./team.js");
const { teamUser, teamUserRelations } = require("./teamUser.js");
const { project, projectRelations } = require("./Project.js");
const { invitation, invitationRelations } = require("./invitation.js");

// Define the schema array to register all tables and relations
const schema = [
  user,
  agency,
  agencyRelations,
  agencyUser,
  agencyUserRelations,
  team,
  teamRelations,
  teamUser,
  teamUserRelations,
  project,
  projectRelations,
  invitation,
  invitationRelations,
];

module.exports = schema;
