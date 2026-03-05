-- Atomic quote number generation with row-level locking to prevent race conditions.
-- Returns next sequential quote number in format NM-YYYY-NNN.
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  current_year text := extract(year FROM now())::text;
  prefix text := 'NM-' || current_year || '-';
  last_number text;
  next_seq int;
BEGIN
  -- Lock the latest quote row for this year to prevent concurrent reads
  SELECT quote_number INTO last_number
  FROM quotes
  WHERE quote_number LIKE prefix || '%'
  ORDER BY quote_number DESC
  LIMIT 1
  FOR UPDATE;

  IF last_number IS NULL THEN
    RETURN prefix || '001';
  END IF;

  next_seq := substring(last_number FROM length(prefix) + 1)::int + 1;
  RETURN prefix || lpad(next_seq::text, 3, '0');
END;
$$;
