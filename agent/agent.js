// ============================================================
// agent.js - Desktop Agent for PC Remote
// ============================================================
// This lightweight script runs in the background on your Windows PC.
// It periodically asks the server "any commands for me?"
// If yes, it executes ONLY the pre-approved commands:
//   - Shutdown
//   - Restart
//   - Sleep
//
// HOW TO RUN:
//   1. Open Command Prompt in this folder
//   2. Run: npm install
//   3. Run: node agent.js
//   4. Leave the window open (or minimize it)
// ============================================================

// ── Load required modules ─────────────────────────────────────
const fetch  = require('node-fetch');    // For making HTTP requests to the server
const { exec } = require('child_process'); // For running system commands
const fs     = require('fs');            // For writing log files
const config = require('./agent-config'); // Our settings

// ── Approved commands map ─────────────────────────────────────
// SECURITY: This is the ONLY place where commands are defined.
// The agent will NEVER run anything not on this list.
// Each key matches an action name from the server.
const APPROVED_COMMANDS = {

  // Shut down the PC immediately (no countdown)
  shutdown: 'shutdown /s /t 0',

  // Restart the PC immediately
  restart: 'shutdown /r /t 0',

  // Put the PC to sleep using PowerShell
  sleep: 'powershell -Command "Add-Type -Assembly System.Windows.Forms; [System.Windows.Forms.Application]::SetSuspendState(\'Suspend\', $false, $false)"',

};

// ── Logging helper ────────────────────────────────────────────
// Writes a message to both the console AND a log file.
// The log file is useful for reviewing what happened while you were away.
function log(message) {
  const timestamp = new Date().toISOString(); // e.g., "2024-01-15T10:30:00.000Z"
  const line = `[${timestamp}] ${message}`;

  // Print to the terminal window
  console.log(line);

  // Append to the log file (creates it if it doesn't exist)
  try {
    fs.appendFileSync(config.logFile, line + '\n', 'utf8');
  } catch (err) {
    // If we can't write the log, just warn but don't crash
    console.warn('[Agent] Warning: Could not write to log file:', err.message);
  }
}

// ── Execute a command safely ──────────────────────────────────
// This function runs a system command, but ONLY if it's on the approved list.
function executeCommand(action) {
  // Double-check the action is in our approved list
  if (!APPROVED_COMMANDS.hasOwnProperty(action)) {
    log(`[SECURITY] Rejected unknown action: "${action}". This should never happen.`);
    return;
  }

  const systemCommand = APPROVED_COMMANDS[action];
  log(`[Agent] Executing: ${action} → "${systemCommand}"`);

  // Run the system command
  exec(systemCommand, (error, stdout, stderr) => {
    if (error) {
      log(`[Agent] ERROR executing "${action}": ${error.message}`);
      return;
    }
    if (stderr) {
      log(`[Agent] stderr: ${stderr}`);
    }
    log(`[Agent] Command "${action}" executed successfully.`);
  });
}

// ── Poll the server for commands ──────────────────────────────
// This function is called on a timer (every N seconds).
// It asks the server if there's a command waiting to be executed.
async function poll() {
  try {
    // Make a GET request to the /api/poll endpoint
    const response = await fetch(`${config.serverUrl}/api/poll`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000, // Give up if no response after 10 seconds
    });

    // Check if the server responded with an OK status
    if (!response.ok) {
      log(`[Agent] Server responded with error: ${response.status} ${response.statusText}`);
      return;
    }

    // Parse the response as JSON
    const data = await response.json();

    // If there's a command waiting, execute it
    if (data.command) {
      const { id, action } = data.command;
      log(`[Agent] Received command: ${action} (ID: ${id})`);
      executeCommand(action);
    }
    // If no command, just wait silently until the next poll

  } catch (err) {
    // Network errors (server offline, wrong URL, etc.)
    if (err.type === 'system' || err.code === 'ECONNREFUSED') {
      log(`[Agent] Cannot connect to server at ${config.serverUrl}. Is the server running?`);
    } else {
      log(`[Agent] Poll error: ${err.message}`);
    }
  }
}

// ── Start the agent ───────────────────────────────────────────
log('');
log('╔══════════════════════════════════════╗');
log('║       PC Remote Agent Started        ║');
log('╠══════════════════════════════════════╣');
log(`║  Server:   ${config.serverUrl}`);
log(`║  Polling:  every ${config.pollInterval / 1000}s`);
log(`║  Log file: ${config.logFile}`);
log('╠══════════════════════════════════════╣');
log('║  Close this window to stop the agent ║');
log('╚══════════════════════════════════════╝');
log('');

// Run the poll immediately on startup
poll();

// Then run it on a repeating timer (setInterval is like "do this every N ms")
setInterval(poll, config.pollInterval);
