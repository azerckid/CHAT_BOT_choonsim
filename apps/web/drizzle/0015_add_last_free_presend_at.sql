-- Phase 3-1: BASIC+ 주 1회 무료 선톡 제한용
-- 실행: cd apps/web && npx tsx scripts/run-migration-0015.ts

ALTER TABLE User ADD COLUMN lastFreePresendAt INTEGER;
