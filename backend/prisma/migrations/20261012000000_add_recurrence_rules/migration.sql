ALTER TABLE "Event"
ADD COLUMN "recurrenceRule" TEXT;

ALTER TABLE "Task"
ADD COLUMN "recurrenceRule" TEXT,
ADD COLUMN "completedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
