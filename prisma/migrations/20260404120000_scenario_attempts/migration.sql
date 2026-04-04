-- AlterTable: allow in-progress rows without a score yet
ALTER TABLE "ScenarioProgress" ALTER COLUMN "score" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ScenarioAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "score" INTEGER,
    "feedback" TEXT,
    "rubric" JSONB,
    "status" TEXT NOT NULL,
    "messages" JSONB,
    "state" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScenarioAttempt_userId_scenarioId_idx" ON "ScenarioAttempt"("userId", "scenarioId");

-- AddForeignKey
ALTER TABLE "ScenarioAttempt" ADD CONSTRAINT "ScenarioAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "ScenarioProgress" ADD COLUMN "activeAttemptId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioProgress_activeAttemptId_key" ON "ScenarioProgress"("activeAttemptId");

-- AddForeignKey
ALTER TABLE "ScenarioProgress" ADD CONSTRAINT "ScenarioProgress_activeAttemptId_fkey" FOREIGN KEY ("activeAttemptId") REFERENCES "ScenarioAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
