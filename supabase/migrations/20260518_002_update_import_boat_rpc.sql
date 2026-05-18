-- Replace import_boat_from_pricelist RPC to map is_price_on_request from AI payload.
-- Previous version (20260309004152) did not commit to repo and did not handle TBQ items;
-- this migration both fixes the local/remote drift AND adds TBQ field mapping.

CREATE OR REPLACE FUNCTION public.import_boat_from_pricelist(payload jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_boat_id UUID;
  v_cat_id UUID;
  v_boat JSONB;
  v_cat JSONB;
  v_cat_idx INT;
  v_total_categories INT := 0;
  v_total_items INT := 0;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'admin' AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Only admins can import price lists';
  END IF;

  v_boat := payload->'boat';

  -- 1. Insert boat
  INSERT INTO boats (name, brand, model, year, base_price, description_en, description_hr, created_by)
  VALUES (
    v_boat->>'name',
    v_boat->>'brand',
    v_boat->>'model',
    (v_boat->>'year')::INT,
    (v_boat->>'base_price')::NUMERIC,
    v_boat->>'description_en',
    v_boat->>'description_hr',
    v_user_id
  )
  RETURNING id INTO v_boat_id;

  -- 2. Insert specs (batch)
  INSERT INTO boat_specs (boat_id, category, label_en, label_hr, value, sort_order)
  SELECT
    v_boat_id,
    elem->>'category',
    elem->>'label_en',
    elem->>'label_hr',
    elem->>'value',
    (ordinality - 1)::INT
  FROM jsonb_array_elements(payload->'specs') WITH ORDINALITY AS t(elem, ordinality);

  -- 3. Insert categories + items (including TBQ flag)
  FOR v_cat, v_cat_idx IN
    SELECT elem, (ordinality - 1)::INT
    FROM jsonb_array_elements(payload->'categories') WITH ORDINALITY AS t(elem, ordinality)
  LOOP
    INSERT INTO equipment_categories (boat_id, name_en, name_hr, sort_order)
    VALUES (
      v_boat_id,
      v_cat->>'name_en',
      COALESCE(v_cat->>'name_hr', v_cat->>'name_en'),
      v_cat_idx
    )
    RETURNING id INTO v_cat_id;

    v_total_categories := v_total_categories + 1;

    INSERT INTO equipment_items (
      category_id, name_en, name_hr, description_en, description_hr,
      price, currency, is_standard, is_discountable, manufacturer_code,
      is_price_on_request, sort_order
    )
    SELECT
      v_cat_id,
      elem->>'name_en',
      COALESCE(elem->>'name_hr', elem->>'name_en'),
      elem->>'description_en',
      elem->>'description_hr',
      (elem->>'price')::NUMERIC,
      'EUR',
      (elem->>'is_standard')::BOOLEAN,
      COALESCE((elem->>'is_discountable')::BOOLEAN, true),
      elem->>'manufacturer_code',
      COALESCE((elem->>'is_price_on_request')::BOOLEAN, false),
      (ordinality - 1)::INT
    FROM jsonb_array_elements(v_cat->'items') WITH ORDINALITY AS t(elem, ordinality);

    v_total_items := v_total_items + (jsonb_array_length(COALESCE(v_cat->'items', '[]'::JSONB)));
  END LOOP;

  RETURN jsonb_build_object(
    'boatId', v_boat_id,
    'categories', v_total_categories,
    'items', v_total_items
  );
END;
$function$;
