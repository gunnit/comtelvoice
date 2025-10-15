-- DropForeignKey
ALTER TABLE "handoffs" DROP CONSTRAINT IF EXISTS "handoffs_callId_fkey";

-- DropTable
DROP TABLE "handoffs";
