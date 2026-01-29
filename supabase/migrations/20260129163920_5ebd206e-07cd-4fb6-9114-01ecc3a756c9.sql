-- Create function to redirect inserts from dogs_discovery view to dogs table
CREATE OR REPLACE FUNCTION public.redirect_dogs_discovery_insert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.dogs (
    owner_id, name, breed, size, energy_level, bio, 
    avatar_url, age_years, weight_lbs, health_notes, play_style
  ) VALUES (
    NEW.owner_id, NEW.name, NEW.breed, NEW.size, NEW.energy_level, NEW.bio,
    NEW.avatar_url, NEW.age_years, NULL, NULL, NEW.play_style
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create INSTEAD OF INSERT trigger on the view
CREATE TRIGGER dogs_discovery_insert_redirect
INSTEAD OF INSERT ON public.dogs_discovery
FOR EACH ROW EXECUTE FUNCTION public.redirect_dogs_discovery_insert();