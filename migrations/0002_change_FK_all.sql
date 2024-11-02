-- Agency Users table migration
ALTER TABLE "agency_users" DROP CONSTRAINT IF EXISTS "agency_users_agency_id_fkey";
ALTER TABLE "agency_users" DROP COLUMN "agency_id";
ALTER TABLE "agency_users" ADD COLUMN "agency_id" uuid NOT NULL;
ALTER TABLE "agency_users"
ADD CONSTRAINT "agency_users_agency_id_fkey"
FOREIGN KEY ("agency_id") REFERENCES "agencies" ("agency_id");

ALTER TABLE "agency_users" DROP CONSTRAINT IF EXISTS "agency_users_user_id_fkey";
ALTER TABLE "agency_users" DROP COLUMN "user_id";
ALTER TABLE "agency_users" ADD COLUMN "user_id" uuid NOT NULL;
ALTER TABLE "agency_users"
ADD CONSTRAINT "agency_users_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

-- Teams table migration
ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_agency_id_fkey";
ALTER TABLE "teams" DROP COLUMN "agency_id";
ALTER TABLE "teams" ADD COLUMN "agency_id" uuid NOT NULL;
ALTER TABLE "teams"
ADD CONSTRAINT "teams_agency_id_fkey"
FOREIGN KEY ("agency_id") REFERENCES "agencies" ("agency_id");

ALTER TABLE "teams" DROP CONSTRAINT IF EXISTS "teams_team_lead_user_id_fkey";
ALTER TABLE "teams" DROP COLUMN "team_lead_user_id";
ALTER TABLE "teams" ADD COLUMN "team_lead_user_id" uuid NOT NULL;
ALTER TABLE "teams"
ADD CONSTRAINT "teams_team_lead_user_id_fkey"
FOREIGN KEY ("team_lead_user_id") REFERENCES "users" ("user_id");

-- Team Users table migration
ALTER TABLE "team_users" DROP CONSTRAINT IF EXISTS "team_users_team_id_fkey";
ALTER TABLE "team_users" DROP COLUMN "team_id";
ALTER TABLE "team_users" ADD COLUMN "team_id" uuid NOT NULL;
ALTER TABLE "team_users"
ADD CONSTRAINT "team_users_team_id_fkey"
FOREIGN KEY ("team_id") REFERENCES "teams" ("team_id");

ALTER TABLE "team_users" DROP CONSTRAINT IF EXISTS "team_users_user_id_fkey";
ALTER TABLE "team_users" DROP COLUMN "user_id";
ALTER TABLE "team_users" ADD COLUMN "user_id" uuid NOT NULL;
ALTER TABLE "team_users"
ADD CONSTRAINT "team_users_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users" ("user_id");

-- Projects table migration
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_created_by_user_id_fkey";
ALTER TABLE "projects" DROP COLUMN "created_by_user_id";
ALTER TABLE "projects" ADD COLUMN "created_by_user_id" uuid NOT NULL;
ALTER TABLE "projects"
ADD CONSTRAINT "projects_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("user_id");

ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_assigned_team_id_fkey";
ALTER TABLE "projects" DROP COLUMN "assigned_team_id";
ALTER TABLE "projects" ADD COLUMN "assigned_team_id" uuid NOT NULL;
ALTER TABLE "projects"
ADD CONSTRAINT "projects_assigned_team_id_fkey"
FOREIGN KEY ("assigned_team_id") REFERENCES "teams" ("team_id");

-- Invitations table migration
ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_sender_user_id_fkey";
ALTER TABLE "invitations" DROP COLUMN "sender_user_id";
ALTER TABLE "invitations" ADD COLUMN "sender_user_id" uuid NOT NULL;
ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_sender_user_id_fkey"
FOREIGN KEY ("sender_user_id") REFERENCES "users" ("user_id");

ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_recipient_user_id_fkey";
ALTER TABLE "invitations" DROP COLUMN "recipient_user_id";
ALTER TABLE "invitations" ADD COLUMN "recipient_user_id" uuid NOT NULL;
ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_recipient_user_id_fkey"
FOREIGN KEY ("recipient_user_id") REFERENCES "users" ("user_id");

ALTER TABLE "invitations" DROP CONSTRAINT IF EXISTS "invitations_agency_id_fkey";
ALTER TABLE "invitations" DROP COLUMN "agency_id";
ALTER TABLE "invitations" ADD COLUMN "agency_id" uuid NOT NULL;
ALTER TABLE "invitations"
ADD CONSTRAINT "invitations_agency_id_fkey"
FOREIGN KEY ("agency_id") REFERENCES "agencies" ("agency_id");
