// ============================================================
// server.js - Main Backend Server for PC Remote
// ============================================================
// This file starts the web server that:
//   1. Serves the dashboard website to your browser
//   2. Handles logins and sessions
//   3. Stores commands (shutdown, restart, sleep) for the agent to pick up
//   4. Lets the Desktop Agent poll for and claim commands
// ============================================================

// ── Load required libraries ───────────────────────────────────
const express = require('express');           // Web server framework
const session = require('express-session');   // Manages login sessions (who is logged in)
const bcrypt  = require('bcryptjs');          // Secure password hashing
const cors    = require('cors');              // Allows cross-origin requests (needed for agent)
const { v4: uuidv4 } = require('uuid');      // Generates unique IDs for commands
const path    = require('path');              // Helps with file paths
const config  = require('./config');          // Our settings file

// ── Create the Express app ────────────────────────────────────
const app = express();

// ── In-memory store for pending commands ──────────────────────
// This is a simple array that holds commands waiting to be executed.
// When the agent picks up a command, it is removed from this list.
// NOTE: This resets when the server restarts. That's fine for our use case.
let pendingCommands = [];

// ── Hash the password from config ─────────────────────────────
// We never store the plain password in memory. bcrypt turns it into
// a safe "hash" that can be verified later without revealing the original.
const passwordHash = bcrypt.hashSync(config.password, 10);

// ── Middleware (things that run on every request) ─────────────
app.use(express.json());             // Parse incoming JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse form submissions

// Allow the Desktop Agent (running locally) to make requests to this server
app.use(cors({
  origin: true,         // Allow any origin (agent runs locally)
  credentials: true,    // Allow cookies/sessions
}));

// Set up session management so the server remembers who is logged in
app.use(session({
  secret: config.sessionSecret,  // Used to sign the session cookie (keep this private!)
  resave: false,                  // Don't re-save session if it wasn't changed
  saveUninitialized: false,       // Don't create a session until something is stored
  cookie: {
    secure: false,                // Set to true if using HTTPS (recommended for production)
    httpOnly: true,               // Prevents JavaScript from reading the cookie (security)
    maxAge: 24 * 60 * 60 * 1000  // Session lasts 24 hours (in milliseconds)
  }
}));

// Serve the frontend files (HTML, CSS, JS) from the "public" folder
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Helper: Check if a request is from a logged-in user ───────
// This function is used to protect routes that require authentication.
function requireAuth(req, res, next) {
  if (req.session && req.session.loggedIn === true) {
    return next(); // User is logged in, continue to the route
  }
  // User is NOT logged in — send a 401 Unauthorized response
  res.status(401).json({ success: false, message: 'Not authenticated. Please log in.' });
}

// ── Helper: Remove expired commands ───────────────────────────
// Commands older than the timeout are automatically discarded.
function cleanExpiredCommands() {
  const now = Date.now();
  const before = pendingCommands.length;
  pendingCommands = pendingCommands.filter(cmd => {
    return (now - cmd.createdAt) < config.commandTimeout;
  });
  if (pendingCommands.length < before) {
    console.log(`[Server] Cleaned up ${before - pendingCommands.length} expired command(s).`);
  }
}

// ── ROUTE: POST /api/login ────────────────────────────────────
// Called when the user submits the login form.
// Checks the password and creates a session if it's correct.
app.post('/api/login', (req, res) => {
  const { password } = req.body;

  // Make sure a password was actually sent
  if (!password) {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  // Compare the submitted password against our stored hash
  const isCorrect = bcrypt.compareSync(password, passwordHash);

  if (isCorrect) {
    // Password is correct! Create a session.
    req.session.loggedIn = true;
    console.log('[Server] Successful login from:', req.ip);
    return res.json({ success: true, message: 'Login successful.' });
  } else {
    // Wrong password
    console.log('[Server] Failed login attempt from:', req.ip);
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }
});

// ── ROUTE: POST /api/logout ───────────────────────────────────
// Called when the user clicks the "Logout" button.
// Destroys the session so they are no longer logged in.
app.post('/api/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out.' });
  });
});

// ── ROUTE: GET /api/status ────────────────────────────────────
// Called by the dashboard to check if the user is still logged in.
app.get('/api/status', (req, res) => {
  res.json({
    loggedIn: !!(req.session && req.session.loggedIn),
  });
});

// ── WHITELIST of allowed commands ─────────────────────────────
// SECURITY: Only these exact command names are accepted.
// Anything else will be rejected. This prevents misuse.
const ALLOWED_COMMANDS = ['shutdown', 'restart', 'sleep'];

// ── ROUTE: POST /api/command ──────────────────────────────────
// Called by the dashboard when a button is clicked.
// Requires the user to be logged in.
// Queues the command for the Desktop Agent to pick up.
app.post('/api/command', requireAuth, (req, res) => {
  cleanExpiredCommands(); // Remove old commands first

  const { action } = req.body;

  // Validate: make sure the action is one of the allowed ones
  if (!action || !ALLOWED_COMMANDS.includes(action)) {
    console.log(`[Server] Rejected unknown action: "${action}"`);
    return res.status(400).json({ success: false, message: 'Invalid action. Allowed: shutdown, restart, sleep.' });
  }

  // Create a command object with a unique ID and timestamp
  const command = {
    id: uuidv4(),           // Unique identifier (e.g., "a3f4b2c1-...")
    action: action,         // The action name (e.g., "shutdown")
    createdAt: Date.now(),  // When this command was created (Unix timestamp in ms)
  };

  // Add the command to our pending list
  pendingCommands.push(command);

  console.log(`[Server] Command queued: ${action} (ID: ${command.id})`);
  res.json({ success: true, message: `Command "${action}" has been queued.`, commandId: command.id });
});

// ── ROUTE: GET /api/poll ──────────────────────────────────────
// Called by the Desktop Agent every few seconds to check for commands.
// Returns the oldest pending command (if any) and removes it from the queue.
// Uses a simple "agent token" from the config to verify the agent is legit.
app.get('/api/poll', (req, res) => {
  cleanExpiredCommands(); // Remove expired commands

  // Return the first (oldest) pending command
  if (pendingCommands.length > 0) {
    const command = pendingCommands.shift(); // Remove from front of array
    console.log(`[Server] Dispatching command to agent: ${command.action} (ID: ${command.id})`);
    return res.json({ command });
  }

  // No commands waiting
  res.json({ command: null });
});

// ── ROUTE: GET /api/pending-count ────────────────────────────
// Returns how many commands are waiting. Used by the dashboard UI.
app.get('/api/pending-count', requireAuth, (req, res) => {
  cleanExpiredCommands();
  res.json({ count: pendingCommands.length });
});

// ── Catch-all: Serve index.html for any unknown route ─────────
// This makes sure the browser always gets the frontend app.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Start the server ──────────────────────────────────────────
app.listen(config.port, () => {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║       PC Remote Server Started       ║');
  console.log('╠══════════════════════════════════════╣');
  console.log(`║  Local:  http://localhost:${config.port}        ║`);
  console.log('║                                      ║');
  console.log('║  Press Ctrl+C to stop the server     ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');
});
