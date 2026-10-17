ALTER TABLE "Birthday"
ADD COLUMN "month" INTEGER,
ADD COLUMN "day" INTEGER,
ADD COLUMN "birthYear" INTEGER;

UPDATE "Birthday"
SET
    "month" = EXTRACT(MONTH FROM "date")::INTEGER,
    "day" = EXTRACT(DAY FROM "date")::INTEGER,
    "birthYear" = EXTRACT(YEAR FROM "date")::INTEGER;

ALTER TABLE "Birthday"
ALTER COLUMN "month" SET NOT NULL,
ALTER COLUMN "day" SET NOT NULL,
ALTER COLUMN "birthYear" SET NOT NULL,
DROP COLUMN "date",
ADD CONSTRAINT "Birthday_month_check" CHECK ("month" BETWEEN 1 AND 12),
ADD CONSTRAINT "Birthday_day_check" CHECK (
    "day" BETWEEN 1 AND CASE "month"
        WHEN 2 THEN 29
        WHEN 4 THEN 30
        WHEN 6 THEN 30
        WHEN 9 THEN 30
        WHEN 11 THEN 30
        ELSE 31
    END
),
ADD CONSTRAINT "Birthday_birthYear_check" CHECK ("birthYear" BETWEEN 1 AND 9999);
