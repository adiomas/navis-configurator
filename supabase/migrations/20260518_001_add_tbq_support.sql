-- Add is_price_on_request flag to equipment_items and quote_items for TBQ (To Be Quoted) support.
-- TBQ items are optional equipment whose price has not been provided by the vendor.
-- They are displayed as "Na upit"/"On request" and excluded from quote totals.

ALTER TABLE equipment_items
  ADD COLUMN is_price_on_request BOOLEAN NOT NULL DEFAULT false;

-- Mutual exclusion: standard items (included in base price) cannot be TBQ.
ALTER TABLE equipment_items
  ADD CONSTRAINT equipment_items_tbq_not_standard
  CHECK (NOT (is_standard AND is_price_on_request));

COMMENT ON COLUMN equipment_items.is_price_on_request IS
  'True when price is "TBQ" (To Be Quoted) — vendor has not provided a price. UI shows "Na upit"/"On request" instead of price; quote total excludes these. Cannot be true when is_standard is true.';

ALTER TABLE quote_items
  ADD COLUMN is_price_on_request BOOLEAN NOT NULL DEFAULT false;

-- Same mutual exclusion enforced on snapshots.
ALTER TABLE quote_items
  ADD CONSTRAINT quote_items_tbq_not_standard
  CHECK (NOT (item_type = 'equipment_standard' AND is_price_on_request));

COMMENT ON COLUMN quote_items.is_price_on_request IS
  'Snapshot of equipment_items.is_price_on_request at quote creation time.';

-- Auto-clear flag when price is updated to a positive value (admin overrides TBQ by entering a real price).
CREATE OR REPLACE FUNCTION clear_tbq_on_price_set()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.price > 0 AND OLD.is_price_on_request = true THEN
    NEW.is_price_on_request := false;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER equipment_items_clear_tbq
  BEFORE UPDATE OF price ON equipment_items
  FOR EACH ROW
  EXECUTE FUNCTION clear_tbq_on_price_set();
