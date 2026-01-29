-- Fix stack depth recursion: remove dogs->dogs_discovery sync triggers (they insert into the view and loop via INSTEAD OF trigger)
DROP TRIGGER IF EXISTS on_dog_created ON public.dogs;
DROP TRIGGER IF EXISTS trigger_sync_dog_to_discovery ON public.dogs;
DROP TRIGGER IF EXISTS on_dog_deleted ON public.dogs;

-- Remove broken sync functions (they reference non-existent columns and write to the view)
DROP FUNCTION IF EXISTS public.sync_dog_to_discovery();
DROP FUNCTION IF EXISTS public.sync_dog_deletion();

-- Harden the view insert redirect: enforce auth.uid() and avoid SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.redirect_dogs_discovery_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
BEGIN
  v_owner_id := auth.uid();
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- The view doesn't expose weight_lbs or health_notes, so we skip them
  INSERT INTO public.dogs (
    owner_id, name, breed, size, energy_level, bio,
    avatar_url, age_years, play_style
  ) VALUES (
    v_owner_id, NEW.name, NEW.breed, NEW.size, NEW.energy_level, NEW.bio,
    NEW.avatar_url, NEW.age_years, NEW.play_style
  );

  RETURN NEW;
END;
$$;

-- Ensure trigger is present and uses the hardened function
DROP TRIGGER IF EXISTS dogs_discovery_insert_redirect ON public.dogs_discovery;
CREATE TRIGGER dogs_discovery_insert_redirect
INSTEAD OF INSERT ON public.dogs_discovery
FOR EACH ROW EXECUTE FUNCTION public.redirect_dogs_discovery_insert();