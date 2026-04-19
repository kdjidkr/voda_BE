-- Enforce routine completion frequency at DB level.
-- Rules:
-- 1) WEEKLY routine without days_of_week: at most once per ISO week.
-- 2) MONTHLY routine without day_of_month: at most once per calendar month.

CREATE OR REPLACE FUNCTION enforce_routine_history_frequency()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_type routine_type;
  v_days_of_week integer[];
  v_day_of_month integer;
BEGIN
  -- Lock routine row to reduce race conditions on concurrent inserts.
  SELECT r.type, r.days_of_week, r.day_of_month
    INTO v_type, v_days_of_week, v_day_of_month
  FROM "routine" r
  WHERE r.routine_id = NEW.routine_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Routine % does not exist', NEW.routine_id;
  END IF;

  IF v_type = 'WEEKLY' AND COALESCE(array_length(v_days_of_week, 1), 0) = 0 THEN
    IF EXISTS (
      SELECT 1
      FROM "routine_history" rh
      WHERE rh.routine_id = NEW.routine_id
        AND EXTRACT(isoyear FROM rh.completed_at) = EXTRACT(isoyear FROM NEW.completed_at)
        AND EXTRACT(week FROM rh.completed_at) = EXTRACT(week FROM NEW.completed_at)
    ) THEN
      RAISE EXCEPTION 'Weekly routine without specific days can be completed only once per week. routine_id=% date=%',
        NEW.routine_id, NEW.completed_at
        USING ERRCODE = '23514';
    END IF;
  END IF;

  IF v_type = 'MONTHLY' AND v_day_of_month IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM "routine_history" rh
      WHERE rh.routine_id = NEW.routine_id
        AND EXTRACT(year FROM rh.completed_at) = EXTRACT(year FROM NEW.completed_at)
        AND EXTRACT(month FROM rh.completed_at) = EXTRACT(month FROM NEW.completed_at)
    ) THEN
      RAISE EXCEPTION 'Monthly routine without specific day can be completed only once per month. routine_id=% date=%',
        NEW.routine_id, NEW.completed_at
        USING ERRCODE = '23514';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_routine_history_frequency ON "routine_history";

CREATE TRIGGER trg_enforce_routine_history_frequency
BEFORE INSERT ON "routine_history"
FOR EACH ROW
EXECUTE FUNCTION enforce_routine_history_frequency();
