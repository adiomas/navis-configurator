-- Atomic primary image setting: clears all, sets new primary, updates hero URL.
-- Prevents race condition from 3 separate queries.
CREATE OR REPLACE FUNCTION set_primary_boat_image(p_boat_id uuid, p_image_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_display_url text;
BEGIN
  -- Clear all primary flags for this boat
  UPDATE boat_images
  SET is_primary = false
  WHERE boat_id = p_boat_id;

  -- Set the selected image as primary
  UPDATE boat_images
  SET is_primary = true
  WHERE id = p_image_id AND boat_id = p_boat_id;

  -- Get the display URL
  SELECT display_url INTO v_display_url
  FROM boat_images
  WHERE id = p_image_id;

  -- Update boat hero image
  IF v_display_url IS NOT NULL THEN
    UPDATE boats
    SET hero_image_url = v_display_url
    WHERE id = p_boat_id;
  END IF;
END;
$$;
