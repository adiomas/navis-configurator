-- RPC function: get quote status counts (replaces N+1 client-side counting)
CREATE OR REPLACE FUNCTION get_quote_status_counts(p_template_group_id uuid DEFAULT NULL)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT json_build_object(
    'all', count(*),
    'draft', count(*) FILTER (WHERE status = 'draft'),
    'sent', count(*) FILTER (WHERE status = 'sent'),
    'accepted', count(*) FILTER (WHERE status = 'accepted'),
    'rejected', count(*) FILTER (WHERE status = 'rejected')
  )
  FROM quotes
  WHERE (p_template_group_id IS NULL OR template_group_id = p_template_group_id);
$$;

-- RPC function: get template group quote counts (replaces N+1 client-side counting)
CREATE OR REPLACE FUNCTION get_template_group_quote_counts()
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(json_object_agg(
    template_group_id::text,
    json_build_object('total', total, 'accepted', accepted)
  ), '{}'::json)
  FROM (
    SELECT
      template_group_id,
      count(*) as total,
      count(*) FILTER (WHERE status = 'accepted') as accepted
    FROM quotes
    WHERE template_group_id IS NOT NULL
    GROUP BY template_group_id
  ) sub;
$$;
