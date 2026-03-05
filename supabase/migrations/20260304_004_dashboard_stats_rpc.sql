-- RPC function: get_dashboard_stats
-- Replaces client-side aggregation (~160 lines useMemo) with a single SQL query
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_date_from timestamptz DEFAULT NULL)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  WITH filtered_quotes AS (
    SELECT
      q.id,
      q.status,
      q.total_price,
      q.created_at,
      q.boat_id,
      q.created_by,
      q.template_group_id,
      b.name AS boat_name,
      p.full_name AS salesperson_name,
      tg.name AS template_group_name
    FROM quotes q
    LEFT JOIN boats b ON b.id = q.boat_id
    LEFT JOIN profiles p ON p.id = q.created_by
    LEFT JOIN quote_template_groups tg ON tg.id = q.template_group_id
    WHERE (p_date_from IS NULL OR q.created_at >= p_date_from)
  ),
  -- Stats
  base_stats AS (
    SELECT
      count(*) AS total_quotes,
      count(*) FILTER (WHERE status IN ('draft', 'sent')) AS active_quotes,
      count(*) FILTER (WHERE status = 'accepted') AS accepted_count,
      count(*) FILTER (WHERE status = 'rejected') AS rejected_count,
      coalesce(sum(total_price) FILTER (WHERE status = 'accepted'), 0) AS total_revenue,
      CASE WHEN count(*) > 0
        THEN coalesce(sum(total_price), 0) / count(*)
        ELSE 0
      END AS avg_quote_value
    FROM filtered_quotes
  ),
  -- Status counts
  status_counts AS (
    SELECT json_build_object(
      'draft', count(*) FILTER (WHERE status = 'draft'),
      'sent', count(*) FILTER (WHERE status = 'sent'),
      'accepted', count(*) FILTER (WHERE status = 'accepted'),
      'rejected', count(*) FILTER (WHERE status = 'rejected')
    ) AS counts
    FROM filtered_quotes
  ),
  -- Revenue by month (accepted only)
  revenue_monthly AS (
    SELECT json_agg(row_to_json(r) ORDER BY r.month_key) AS data
    FROM (
      SELECT
        to_char(created_at, 'YYYY-MM') AS month_key,
        to_char(created_at, 'Mon YYYY') AS month,
        coalesce(sum(total_price), 0) AS revenue
      FROM filtered_quotes
      WHERE status = 'accepted' AND total_price > 0
      GROUP BY to_char(created_at, 'YYYY-MM'), to_char(created_at, 'Mon YYYY')
      ORDER BY to_char(created_at, 'YYYY-MM')
    ) r
  ),
  -- Top boats (accepted, top 5)
  top_boats AS (
    SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) AS data
    FROM (
      SELECT
        boat_name AS "boatName",
        coalesce(sum(total_price), 0) AS revenue,
        count(*) AS "quoteCount"
      FROM filtered_quotes
      WHERE status = 'accepted' AND boat_id IS NOT NULL AND total_price > 0
      GROUP BY boat_id, boat_name
      ORDER BY sum(total_price) DESC
      LIMIT 5
    ) r
  ),
  -- Salesperson data
  salesperson AS (
    SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) AS data
    FROM (
      SELECT
        coalesce(salesperson_name, 'Unknown') AS name,
        count(*) AS "totalQuotes",
        count(*) FILTER (WHERE status = 'accepted') AS "acceptedQuotes",
        coalesce(sum(total_price) FILTER (WHERE status = 'accepted'), 0) AS revenue,
        CASE WHEN count(*) > 0
          THEN round((count(*) FILTER (WHERE status = 'accepted')::numeric / count(*)) * 100, 1)
          ELSE 0
        END AS "acceptanceRate"
      FROM filtered_quotes
      GROUP BY created_by, salesperson_name
      ORDER BY sum(total_price) FILTER (WHERE status = 'accepted') DESC NULLS LAST
    ) r
  ),
  -- Campaign performance
  campaigns AS (
    SELECT coalesce(json_agg(row_to_json(r)), '[]'::json) AS data
    FROM (
      SELECT
        coalesce(template_group_name, 'Unknown Campaign') AS name,
        count(*) AS "quoteCount",
        coalesce(sum(total_price) FILTER (WHERE status = 'accepted'), 0) AS revenue
      FROM filtered_quotes
      WHERE template_group_id IS NOT NULL
      GROUP BY template_group_id, template_group_name
      ORDER BY sum(total_price) FILTER (WHERE status = 'accepted') DESC NULLS LAST
    ) r
  ),
  -- Conversion funnel
  funnel AS (
    SELECT
      count(*) AS total_created,
      count(*) FILTER (WHERE status IN ('sent', 'accepted', 'rejected')) AS total_sent,
      count(*) FILTER (WHERE status = 'accepted') AS total_accepted
    FROM filtered_quotes
  ),
  -- Monthly trend (last 6 months, including current)
  months_series AS (
    SELECT to_char(d, 'YYYY-MM') AS month_key, to_char(d, 'Mon') AS month_label
    FROM generate_series(
      date_trunc('month', now()) - interval '5 months',
      date_trunc('month', now()),
      '1 month'
    ) d
  ),
  monthly_trend AS (
    SELECT json_agg(row_to_json(r) ORDER BY r.month_key) AS data
    FROM (
      SELECT
        ms.month_key,
        ms.month_label AS month,
        coalesce(count(fq.id), 0) AS "quoteCount",
        coalesce(sum(fq.total_price) FILTER (WHERE fq.status = 'accepted'), 0) AS revenue
      FROM months_series ms
      LEFT JOIN filtered_quotes fq ON to_char(fq.created_at, 'YYYY-MM') = ms.month_key
      GROUP BY ms.month_key, ms.month_label
    ) r
  )
  SELECT json_build_object(
    'stats', json_build_object(
      'totalQuotes', bs.total_quotes,
      'activeQuotes', bs.active_quotes,
      'acceptanceRate', CASE WHEN (bs.accepted_count + bs.rejected_count) > 0
        THEN round((bs.accepted_count::numeric / (bs.accepted_count + bs.rejected_count)) * 100, 1)
        ELSE 0
      END,
      'totalRevenue', bs.total_revenue,
      'avgQuoteValue', round(bs.avg_quote_value::numeric, 2)
    ),
    'statusCounts', sc.counts,
    'revenueByMonth', coalesce(rm.data, '[]'::json),
    'topBoats', tb.data,
    'salespersonData', sp.data,
    'campaignPerformance', cp.data,
    'conversionFunnel', json_build_array(
      json_build_object(
        'label', 'created',
        'count', f.total_created,
        'percentage', 100,
        'dropoff', 0
      ),
      json_build_object(
        'label', 'sent',
        'count', f.total_sent,
        'percentage', CASE WHEN f.total_created > 0
          THEN round((f.total_sent::numeric / f.total_created) * 100, 1)
          ELSE 0
        END,
        'dropoff', CASE WHEN f.total_created > 0
          THEN round(((f.total_created - f.total_sent)::numeric / f.total_created) * 100, 1)
          ELSE 0
        END
      ),
      json_build_object(
        'label', 'accepted',
        'count', f.total_accepted,
        'percentage', CASE WHEN f.total_sent > 0
          THEN round((f.total_accepted::numeric / f.total_sent) * 100, 1)
          ELSE 0
        END,
        'dropoff', CASE WHEN f.total_sent > 0
          THEN round(((f.total_sent - f.total_accepted)::numeric / f.total_sent) * 100, 1)
          ELSE 0
        END
      )
    ),
    'monthlyTrend', coalesce(mt.data, '[]'::json)
  ) INTO result
  FROM base_stats bs
  CROSS JOIN status_counts sc
  CROSS JOIN revenue_monthly rm
  CROSS JOIN top_boats tb
  CROSS JOIN salesperson sp
  CROSS JOIN campaigns cp
  CROSS JOIN funnel f
  CROSS JOIN monthly_trend mt;

  RETURN result;
END;
$$;
