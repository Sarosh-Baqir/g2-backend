-- Step 1: Drop the foreign key constraint on 'created_by_user_id'
ALTER TABLE "agencies" DROP CONSTRAINT IF EXISTS "agencies_created_by_user_id_fkey";

-- Step 2: Drop the existing 'created_by_user_id' column
ALTER TABLE "agencies" DROP COLUMN "created_by_user_id";

-- Step 3: Add the 'created_by_user_id' column with the correct 'uuid' data type
ALTER TABLE "agencies" ADD COLUMN "created_by_user_id" uuid NOT NULL;

-- Step 4: Recreate the foreign key constraint
ALTER TABLE "agencies"
ADD CONSTRAINT "agencies_created_by_user_id_fkey"
FOREIGN KEY ("created_by_user_id") REFERENCES "users" ("user_id");
