// ============================================================
// config.js - Configuration File for PC Remote Server
// ============================================================
// This is where you set your password and other settings.
// After changing the password, restart the server for it to take effect.
// ============================================================

module.exports = {

  // ── PASSWORD ──────────────────────────────────────────────
  // Change this to whatever password you want to use to log in.
  // Use something strong! Mix letters, numbers, and symbols.
  // Example: "MyS3cur3P@ss!" is better than "password123"
  password: "pass",

  // ── SERVER PORT ───────────────────────────────────────────
  // The port number the server will listen on.
  // 3000 is the default. Only change this if another program uses port 3000.
  port: process.env.PORT || 3000,

  // ── SESSION SECRET ────────────────────────────────────────
  // A secret key used to secure your login session (like a cookie seal).
  // Change this to a long random string for better security.
  // Example: "x9#kP2mQ8vL5nR3tW7yU1jH6aE4sD0"
  sessionSecret: process.env.SESSION_SECRET || "change-this-to-a-random-secret-string",

  // ── AGENT POLL INTERVAL ───────────────────────────────────
  // How often (in milliseconds) the Desktop Agent checks for new commands.
  // 5000 = every 5 seconds. Lower = faster response but more network traffic.
  agentPollInterval: 5000,

  // ── COMMAND TIMEOUT ───────────────────────────────────────
  // How long (in milliseconds) a command stays "pending" before it expires.
  // 60000 = 1 minute. If the agent doesn't pick it up in time, it disappears.
  commandTimeout: 60000,

};
