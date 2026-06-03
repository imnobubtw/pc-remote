// ============================================================
// agent-config.js - Configuration for the Desktop Agent
// ============================================================
// Edit SERVER_URL below to point to where your server is running.
// ============================================================

module.exports = {

  // ── SERVER URL ────────────────────────────────────────────
  // Where is your backend server running?
  //
  // If running LOCALLY (server and agent on same PC):
  //   "http://localhost:3000"
  //
  // If deployed to Render/Railway/etc (recommended for remote access):
  //   "https://your-app-name.onrender.com"
  //
  // ⬇️ CHANGE THIS to your server address ⬇️
  serverUrl: process.env.SERVER_URL || "http://localhost:3000",

  // ── POLL INTERVAL ────────────────────────────────────────
  // How often (in milliseconds) to check the server for new commands.
  // 5000 = every 5 seconds. Don't go below 2000 to avoid overloading the server.
  pollInterval: parseInt(process.env.POLL_INTERVAL) || 5000,

  // ── LOG FILE ─────────────────────────────────────────────
  // Where to save the log file on your PC.
  // Default: a file called "agent.log" in the same folder as this script.
  logFile: process.env.LOG_FILE || "./agent.log",

};
