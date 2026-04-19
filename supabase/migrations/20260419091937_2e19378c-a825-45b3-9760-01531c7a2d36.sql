CREATE OR REPLACE FUNCTION public.approve_park_suggestion(suggestion_id uuid, admin_notes_text text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_suggestion park_suggestions%ROWTYPE;
  v_new_park_id bigint;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  SELECT * INTO v_suggestion FROM park_suggestions WHERE id = suggestion_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found';
  END IF;

  SELECT COALESCE(MAX("Id"), 0) + 1 INTO v_new_park_id FROM parks;

  INSERT INTO parks (
    "Id", name, address, city, state, country, zip_code, description,
    latitude, longitude,
    is_fully_fenced, has_water_station, has_small_dog_area,
    has_large_dog_area, has_agility_equipment, has_parking, has_grass_surface,
    image_url, is_dog_friendly, added_by, created_at, updated_at
  ) VALUES (
    v_new_park_id,
    v_suggestion.name, v_suggestion.address, v_suggestion.city, v_suggestion.state,
    v_suggestion.country, v_suggestion.zip_code, v_suggestion.description,
    v_suggestion.latitude, v_suggestion.longitude,
    v_suggestion.is_fully_fenced, v_suggestion.has_water_station, v_suggestion.has_small_dog_area,
    v_suggestion.has_large_dog_area, v_suggestion.has_agility_equipment,
    v_suggestion.has_parking, v_suggestion.has_grass_surface,
    v_suggestion.image_url, true, v_suggestion.user_id::text, now()::text, now()::text
  );

  UPDATE park_suggestions
  SET status = 'approved',
      admin_notes = admin_notes_text,
      reviewed_at = now()
  WHERE id = suggestion_id;

  RETURN jsonb_build_object('success', true, 'park_id', v_new_park_id);
END;
$$;