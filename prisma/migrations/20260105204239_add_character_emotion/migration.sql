-- AlterTable
ALTER TABLE "CharacterStat" ADD COLUMN "currentEmotion" TEXT DEFAULT 'JOY';
ALTER TABLE "CharacterStat" ADD COLUMN "emotionExpiresAt" DATETIME;
