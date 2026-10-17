ALTER TABLE "Event"
ADD COLUMN "startDate" DATE,
ADD COLUMN "endDate" DATE,
ADD COLUMN "eventStartTime" TEXT,
ADD COLUMN "eventEndTime" TEXT;

UPDATE "Event"
SET
    "startDate" = "startTime"::DATE,
    "endDate" = "endTime"::DATE,
    "eventStartTime" = CASE WHEN "isAllDay" THEN NULL ELSE TO_CHAR("startTime", 'HH24:MI') END,
    "eventEndTime" = CASE WHEN "isAllDay" THEN NULL ELSE TO_CHAR("endTime", 'HH24:MI') END;

ALTER TABLE "Event"
ALTER COLUMN "startDate" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;

ALTER TABLE "Event"
DROP COLUMN "startTime",
DROP COLUMN "endTime";

ALTER TABLE "Event"
RENAME COLUMN "eventStartTime" TO "startTime";

ALTER TABLE "Event"
RENAME COLUMN "eventEndTime" TO "endTime";

ALTER TABLE "Task"
ALTER COLUMN "dueDate" TYPE DATE USING "dueDate"::DATE;
