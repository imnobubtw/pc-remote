// ============================================================
// app.js - Frontend JavaScript for PC Remote Dashboard
// ============================================================
// This file handles:
//   1. Checking if the user is logged in on page load
//   2. The login form submission
//   3. Showing confirmation dialogs before sending commands
//   4. Sending commands to the backend
//   5. Showing toast notifications
//   6. The activity log
// ============================================================

// ── Wait for the page to fully load before running our code ──
// (The HTML sets defer on this script, so this runs automatically after HTML is ready)

// ── Get references to all the HTML elements we'll need ───────
const loginPage      = document.getElementById('login-page');
const dashboardPage  = document.getElementById('dashboard-page');

const passwordInput  = document.getElementById('password-input');
const loginBtn       = document.getElementById('login-btn');
const loginBtnText   = document.getElementById('login-btn-text');
const loginBtnLoad   = document.getElementById('login-btn-loading');
const loginError     = document.getElementById('login-error');

const logoutBtn      = document.getElementById('logout-btn');

const confirmOverlay = document.getElementById('confirm-overlay');
const confirmIcon    = document.getElementById('confirm-icon');
const confirmTitle   = document.getElementById('confirm-title');
const confirmMessage = document.getElementById('confirm-message');
const confirmOkBtn   = document.getElementById('confirm-ok-btn');
const confirmCancelBtn = document.getElementById('confirm-cancel-btn');

const activityLog    = document.getElementById('activity-log');
const toast          = document.getElementById('toast');
const toastMessage   = document.getElementById('toast-message');
const statusDot      = document.getElementById('status-dot');
const statusText     = document.getElementById('status-text');

// ── State ─────────────────────────────────────────────────────
let pendingAction = null;       // Stores which action (shutdown/restart/sleep) is being confirmed
let toastTimeout  = null;       // Timer reference for hiding the toast

// ── Configuration ─────────────────────────────────────────────
// Info for each command (title, message, icon, button color)
const COMMAND_CONFIG = {
  shutdown: {
    icon:    '⏻',
    title:   'Shut Down PC?',
    message: 'This will immediately power off your PC. Any unsaved work will be lost.',
    btnClass: 'btn-danger',
    label:   'Shut Down',
    logMsg:  '⏻ Shutdown command sent.',
  },
  restart: {
    icon:    '↺',
    title:   'Restart PC?',
    message: 'This will immediately restart your PC. Any unsaved work will be lost.',
    btnClass: 'btn-warning',
    label:   'Restart',
    logMsg:  '↺ Restart command sent.',
  },
  sleep: {
    icon:    '☾',
    title:   'Put PC to Sleep?',
    message: 'This will put your PC into sleep mode. You can wake it by pressing any key or moving the mouse.',
    btnClass: 'btn-info',
    label:   'Sleep',
    logMsg:  '☾ Sleep command sent.',
  },
};


// ════════════════════════════════════════════════════════════
// PAGE ROUTING: Show login or dashboard based on auth status
// ════════════════════════════════════════════════════════════

/**
 * Shows a page and hides the other.
 * @param {string} page - 'login' or 'dashboard'
 */
function showPage(page) {
  loginPage.classList.add('hidden');
  dashboardPage.classList.add('hidden');

  if (page === 'login') {
    loginPage.classList.remove('hidden');
    // Focus the password input so the user can type right away
    setTimeout(() => passwordInput.focus(), 100);
  } else if (page === 'dashboard') {
    dashboardPage.classList.remove('hidden');
  }
}

/**
 * Checks if the user is logged in by asking the server.
 * Called when the page first loads.
 */
async function checkAuthStatus() {
  try {
    const res  = await fetch('/api/status');
    const data = await res.json();

    if (data.loggedIn) {
      showPage('dashboard');
    } else {
      showPage('login');
    }
  } catch (err) {
    // If we can't reach the server, show login page
    console.error('Could not reach server:', err);
    showPage('login');
  }
}


// ════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════

/**
 * Submits the login form.
 * Sends the password to the server and handles the response.
 */
async function handleLogin() {
  const password = passwordInput.value.trim();

  // Don't submit if the password field is empty
  if (!password) {
    passwordInput.focus();
    return;
  }

  // Show loading state on the button
  loginBtnText.classList.add('hidden');
  loginBtnLoad.classList.remove('hidden');
  loginBtn.disabled = true;
  loginError.classList.add('hidden');

  try {
    const res  = await fetch('/api/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ password }),
    });
    const data = await res.json();

    if (data.success) {
      // Login worked! Go to dashboard.
      passwordInput.value = ''; // Clear the password field
      showPage('dashboard');
      addLogEntry('✅ Logged in successfully.', 'success');
    } else {
      // Wrong password
      loginError.classList.remove('hidden');
      passwordInput.value = '';
      passwordInput.focus();
    }
  } catch (err) {
    loginError.textContent = '❌ Could not connect to the server. Is it running?';
    loginError.classList.remove('hidden');
  } finally {
    // Restore button to normal state
    loginBtnText.classList.remove('hidden');
    loginBtnLoad.classList.add('hidden');
    loginBtn.disabled = false;
  }
}

// Login button click
loginBtn.addEventListener('click', handleLogin);

// Allow pressing Enter in the password field to log in
passwordInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') handleLogin();
});


// ════════════════════════════════════════════════════════════
// LOGOUT
// ════════════════════════════════════════════════════════════

logoutBtn.addEventListener('click', async () => {
  try {
    await fetch('/api/logout', { method: 'POST' });
  } catch (err) {
    // Even if logout request fails, show the login page
  }
  showPage('login');
  addLogEntry('👋 Logged out.', 'info');
});


// ════════════════════════════════════════════════════════════
// COMMAND BUTTONS
// ════════════════════════════════════════════════════════════

/**
 * Open the confirmation dialog for a given action.
 * @param {string} action - 'shutdown', 'restart', or 'sleep'
 */
function openConfirmDialog(action) {
  const conf = COMMAND_CONFIG[action];
  if (!conf) return;

  // Store what we're about to do
  pendingAction = action;

  // Fill in the dialog content
  confirmIcon.textContent    = conf.icon;
  confirmTitle.textContent   = conf.title;
  confirmMessage.textContent = conf.message;

  // Update the confirm button's color and label
  confirmOkBtn.className = `btn ${conf.btnClass}`;
  confirmOkBtn.textContent = conf.label;

  // Show the dialog
  confirmOverlay.classList.remove('hidden');
  confirmOkBtn.focus();
}

// Listen for clicks on ALL action buttons using event delegation
// (Instead of adding a listener to each button, we listen on the parent)
document.getElementById('dashboard-page').addEventListener('click', (e) => {
  // Find the closest button with a data-action attribute
  const btn = e.target.closest('[data-action]');
  if (btn) {
    const action = btn.dataset.action; // e.g., "shutdown"
    openConfirmDialog(action);
  }
});

// ── Confirm dialog buttons ────────────────────────────────────

// Cancel: close the dialog without doing anything
confirmCancelBtn.addEventListener('click', () => {
  confirmOverlay.classList.add('hidden');
  pendingAction = null;
  addLogEntry('⬅ Action cancelled.', 'info');
});

// Close dialog if user clicks the dark backdrop
confirmOverlay.addEventListener('click', (e) => {
  if (e.target === confirmOverlay) {
    confirmCancelBtn.click();
  }
});

// Close dialog on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !confirmOverlay.classList.contains('hidden')) {
    confirmCancelBtn.click();
  }
});

// Confirm: send the command
confirmOkBtn.addEventListener('click', async () => {
  if (!pendingAction) return;

  const action = pendingAction;
  pendingAction = null;

  // Close the dialog
  confirmOverlay.classList.add('hidden');

  // Send the command to the server
  await sendCommand(action);
});

/**
 * Sends a command to the backend server.
 * @param {string} action - 'shutdown', 'restart', or 'sleep'
 */
async function sendCommand(action) {
  const conf = COMMAND_CONFIG[action];

  try {
    const res  = await fetch('/api/command', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action }),
    });
    const data = await res.json();

    if (data.success) {
      addLogEntry(conf.logMsg, 'success');
      showToast(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} command sent!`, 'success');
    } else {
      addLogEntry(`❌ Failed to send ${action} command: ${data.message}`, 'error');
      showToast(`❌ Error: ${data.message}`, 'error');
    }
  } catch (err) {
    addLogEntry(`❌ Network error: Could not send ${action} command.`, 'error');
    showToast('❌ Could not reach server.', 'error');

    // If we got a 401 (not authenticated), redirect to login
    if (err.status === 401) {
      showPage('login');
    }
  }
}


// ════════════════════════════════════════════════════════════
// ACTIVITY LOG
// ════════════════════════════════════════════════════════════

/**
 * Adds a new entry to the activity log at the top.
 * @param {string} message - The log message
 * @param {string} type - 'info', 'success', 'warning', or 'error'
 */
function addLogEntry(message, type = 'info') {
  const now = new Date();
  // Format time as HH:MM:SS
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;
  entry.textContent = `[${time}] ${message}`;

  // Add the new entry at the TOP of the log
  activityLog.insertBefore(entry, activityLog.firstChild);

  // Keep only the last 50 entries to avoid the log growing forever
  while (activityLog.children.length > 50) {
    activityLog.removeChild(activityLog.lastChild);
  }
}


// ════════════════════════════════════════════════════════════
// TOAST NOTIFICATIONS
// ════════════════════════════════════════════════════════════

/**
 * Shows a brief notification message at the bottom of the screen.
 * @param {string} message - Text to display
 * @param {string} type - 'success' or 'error'
 * @param {number} duration - How long to show it (ms)
 */
function showToast(message, type = 'info', duration = 3000) {
  // Clear any existing toast timer
  if (toastTimeout) clearTimeout(toastTimeout);

  toastMessage.textContent = message;
  toast.className = `toast toast-${type}`; // Applies color styling
  toast.classList.remove('hidden');

  // Automatically hide after `duration` milliseconds
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, duration);
}


// ════════════════════════════════════════════════════════════
// AGENT STATUS INDICATOR
// ════════════════════════════════════════════════════════════
// We use a simple heuristic: if there are 0 pending commands,
// we assume the agent is online and picking them up.
// A more robust solution would use WebSockets, but this is
// beginner-friendly and good enough for personal use.

let consecutiveEmpty = 0; // Track how many times we got 0 pending in a row

async function checkAgentStatus() {
  try {
    const res  = await fetch('/api/pending-count');
    if (!res.ok) return; // Don't update if we're not logged in

    const data = await res.json();

    if (data.count === 0) {
      consecutiveEmpty++;
    } else {
      consecutiveEmpty = 0;
    }

    // If we consistently have 0 pending, assume agent is running
    if (consecutiveEmpty >= 2) {
      setAgentOnline();
    } else {
      setAgentPending();
    }
  } catch (err) {
    // Server unreachable
    setAgentOffline();
  }
}

function setAgentOnline() {
  statusDot.className = 'status-dot online';
  statusText.textContent = 'Agent Online';
}

function setAgentOffline() {
  statusDot.className = 'status-dot offline';
  statusText.textContent = 'Agent Offline';
}

function setAgentPending() {
  statusDot.className = 'status-dot';
  statusText.textContent = 'Command Pending…';
}

// Check agent status every 6 seconds (only when logged in)
setInterval(() => {
  if (!dashboardPage.classList.contains('hidden')) {
    checkAgentStatus();
  }
}, 6000);


// ════════════════════════════════════════════════════════════
// INITIALIZE: Run when the page loads
// ════════════════════════════════════════════════════════════
checkAuthStatus();
