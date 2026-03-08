ALTER TABLE care_history DROP CONSTRAINT care_history_category_check;
ALTER TABLE care_history ADD CONSTRAINT care_history_category_check 
  CHECK (category = ANY (ARRAY['walk','medication','feeding','grooming','training','restock']));