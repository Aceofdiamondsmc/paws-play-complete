
CREATE OR REPLACE FUNCTION public.approve_park_suggestion(suggestion_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _suggestion park_suggestions%ROWTYPE;
  _next_id bigint;
BEGIN
  -- Verify caller is admin
  IF NOT EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Fetch the suggestion
  SELECT * INTO _suggestion FROM park_suggestions WHERE id = suggestion_id AND status = 'pending';
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Suggestion not found or already reviewed';
  END IF;

  -- Get next park Id
  SELECT COALESCE(MAX("Id"), 0) + 1 INTO _next_id FROM parks;

  -- Insert into parks with added_by set to the suggesting user's ID
  INSERT INTO parks ("Id", name, address, city, state, description, latitude, longitude, image_url,
    is_fully_fenced, has_water_station, has_small_dog_area, has_large_dog_area,
    has_agility_equipment, has_parking, has_grass_surface, is_dog_friendly, added_by)
  VALUES (_next_id, _suggestion.name, _suggestion.address, _suggestion.city, _suggestion.state,
    _suggestion.description, _suggestion.latitude, _suggestion.longitude, _suggestion.image_url,
    _suggestion.is_fully_fenced, _suggestion.has_water_station, _suggestion.has_small_dog_area,
    _suggestion.has_large_dog_area, _suggestion.has_agility_equipment, _suggestion.has_parking,
    _suggestion.has_grass_surface, true, _suggestion.user_id::text);

  -- Mark suggestion as approved
  UPDATE park_suggestions SET status = 'approved', reviewed_at = now() WHERE id = suggestion_id;
END;
$function$;
