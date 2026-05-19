-- ─── RPC 1: Paginated leaderboard with DENSE_RANK ─────────────
CREATE OR REPLACE FUNCTION get_leaderboard(p_limit INT, p_offset INT)
RETURNS TABLE (
  rank           BIGINT,
  user_id        UUID,
  username       TEXT,
  avatar_url     TEXT,
  total_xp       BIGINT,
  current_level  INT,
  current_streak INT
) LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT
    DENSE_RANK() OVER (ORDER BY s.total_xp DESC) AS rank,
    s.user_id,
    COALESCE(p.username, 'Anonymous')             AS username,
    p.avatar_url,
    s.total_xp,
    s.current_level,
    COALESCE(str.current_streak, 0)               AS current_streak
  FROM user_stats s
  LEFT JOIN profiles     p   ON p.id      = s.user_id
  LEFT JOIN user_streaks str ON str.user_id = s.user_id
  ORDER BY s.total_xp DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

-- ─── RPC 2: Single-user rank lookup ───────────────────────────
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS BIGINT LANGUAGE SQL STABLE SECURITY DEFINER AS $$
  SELECT rank
  FROM (
    SELECT
      user_id,
      DENSE_RANK() OVER (ORDER BY total_xp DESC) AS rank
    FROM user_stats
  ) ranked
  WHERE user_id = p_user_id;
$$;
