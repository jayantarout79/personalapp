const { createClient } = require("@supabase/supabase-js");
const config = require("./config");

// Use service role if available for validation; fallback to anon key.
const supabaseAuth = config.supabase.url && (config.supabase.serviceRoleKey || config.supabase.anonKey)
  ? createClient(config.supabase.url, config.supabase.serviceRoleKey || config.supabase.anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

const authenticate = async (req, res, next) => {
  if (!supabaseAuth) {
    return res.status(500).json({ error: "Supabase auth is not configured." });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const { data, error } = await supabaseAuth.auth.getUser(token);
  if (error || !data?.user) {
    return res.status(401).json({ error: "Invalid auth token" });
  }

  req.user = data.user;
  return next();
};

module.exports = { authenticate };
