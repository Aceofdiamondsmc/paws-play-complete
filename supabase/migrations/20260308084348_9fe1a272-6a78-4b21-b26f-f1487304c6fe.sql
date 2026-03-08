ALTER TABLE care_reminders DROP CONSTRAINT IF EXISTS care_reminders_category_check;
ALTER TABLE care_reminders ADD CONSTRAINT care_reminders_category_check
  CHECK (category = ANY (ARRAY['walk','medication','feeding','grooming','training','restock']));