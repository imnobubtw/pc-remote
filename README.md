# PC Remote Control

> Control your Windows PC from anywhere using a web dashboard.

---

> Features
-Secure login system (password protected)
-Remote PC shutdown
-Remote restart
-Sleep mode control
-Web dashboard (mobile + desktop)
-Lightweight background agent


## 📋 Table of Contents

1. [What Is This?](#-what-is-this)
2. [Step 1 — Install Node.js](#-step-1--install-nodejs)
3. [Step 2 — Set Your Password](#-step-2--set-your-password)
4. [Step 3 — Install Dependencies](#-step-3--install-dependencies)
5. [Step 4 — Deploy the Server (Free Hosting)](#-step-4--deploy-the-server-free-hosting)
6. [Step 5 — Configure the Desktop Agent](#-step-5--configure-the-desktop-agent)
7. [Step 6 — Run the Desktop Agent](#-step-6--run-the-desktop-agent)
8. [Using the Dashboard](#-using-the-dashboard)
9. [Changing Your Password](#-changing-your-password)
10. [How It Works](#-how-it-works)
11. [Project Structure](#-project-structure)
12. [Troubleshooting](#-troubleshooting)
13. [Security Notes](#-security-notes)

---

## 🤔 What Is This?

**PC Remote** is a private web dashboard that lets you control your Windows PC from anywhere — your phone, a friend's computer, or any browser.

You can:
- 🔴 **Shutdown** your PC
- 🟠 **Restart** your PC
- 🔵 **Sleep** your PC (save power)

Everything is password-protected. Nobody else can access your dashboard.

---

## ✅ Step 1 — Install Node.js

Node.js is the program that runs our server and agent. You only need to do this once.

### On Your Windows PC (for the agent):

1. Go to **https://nodejs.org**
2. Click the big green button that says **"LTS"** (Long Term Support — the stable version)
3. Run the downloaded installer
4. Click **Next** → **Next** → **Install** (accept all defaults)
5. When it's done, open **Cmd**:
   - Press `Windows key`
   - Type `cmd`
   - Press Enter
6. Type this and press Enter to confirm it worked:
   ```
   node --version
   ```
   You should see something like `v20.11.0`. If you do, Node.js is installed! ✅

---

## ✅ Step 2 — Set Your Password

Before you do anything else, set your login password.

1. Open the file `server/config.js` with any text editor (Notepad works fine)
2. Find this line:
   ```js
   password: "ChangeMe123!",
   ```
3. Replace `ChangeMe123!` with your own strong password. For example:
   ```js
   password: "MyStr0ngP@ssword2024!",
   ```
4. Save the file

> ⚠️ **Use a strong password!** Since this controls your PC, treat it like your bank password. Use a mix of uppercase, lowercase, numbers, and symbols.

---

## ✅ Step 3 — Install Dependencies

"Dependencies" are extra code libraries that our app needs. We need to install them before running anything.

### For the Server:

1. Open **Command Prompt**
2. Navigate to the `server` folder. For example, if you put the project on your Desktop :
   ```
   cd Desktop\pc-remote\server
   ```
   > **Tip:** Type `cd ` then drag the folder into the Command Prompt window — it will type the path for you!
3. Run:
   ```
   npm install
   ```
4. Wait for it to finish (you'll see lots of text, that's normal). When you see the cursor back, it's done ✅

### For the Agent:

1. In the same Command Prompt, navigate to the agent folder:
   ```
   cd ..\agent
   ```
2. Run:
   ```
   npm install
   ```
3. Wait for it to finish ✅

---

## ✅ Step 4 — Deploy the Server (Free Hosting)

The server needs to run somewhere on the internet so you can access it from anywhere. We'll use **Render** — it's free and beginner-friendly.

> **Alternative:** You can also use **Railway** (railway.app) or **Fly.io**. The steps are similar.

### Option A: Deploy to Render (Recommended — Free)

#### 4.1 — Create a GitHub Account (if you don't have one)

1. Go to **https://github.com** and sign up for a free account
2. Verify your email address

#### 4.2 — Upload Your Project to GitHub

1. Go to **https://github.com/new**
2. Repository name: `pc-remote` (or anything you like)
3. Set it to **Private** (important for security!)
4. Click **Create repository**
5. Follow the instructions on the page to upload your files

> **Don't know Git?** Use GitHub Desktop (https://desktop.github.com) — it has a visual interface. Just open the app, drag your `pc-remote` folder in, and click "Publish repository."

#### 4.3 — Create a Render Account

1. Go to **https://render.com** and sign up (you can use your GitHub account)

#### 4.4 — Create a New Web Service on Render

1. Click **"New +"** in the top right
2. Select **"Web Service"**
3. Connect your GitHub account and select your `pc-remote` repository
4. Fill in the settings:

   | Setting | Value |
   |---------|-------|
   | **Name** | `pc-remote` (or anything) |
   | **Region** | Choose closest to you |
   | **Branch** | `main` |
   | **Root Directory** | `server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Instance Type** | Free |

5. Click **"Advanced"** and add these **Environment Variables**:

   | Key | Value |
   |-----|-------|
   | `SESSION_SECRET` | Type a long random string, like: `kP9xQ2mR7vN4wL8tH3jF6aE1sD5bY0c` |

   > **What is SESSION_SECRET?** It's used to sign cookies so users can't forge them. Make it random and long. You can use https://randomkeygen.com to generate one.

6. Click **"Create Web Service"**
7. Wait a few minutes for it to deploy. You'll see build logs scroll by.
8. When done, you'll see a green **"Live"** badge and a URL like:
   `https://pc-remote-xxxx.onrender.com`

9. **Copy this URL** — you'll need it for the agent!

> ✅ **Test it:** Open the URL in your browser. You should see the PC Remote login page!

---

## ✅ Step 5 — Configure the Desktop Agent

Now tell the agent where your server is.

1. Open the file `agent/agent-config.js` in a text editor
2. Find this line:
   ```js
   serverUrl: process.env.SERVER_URL || "http://localhost:3000",
   ```
3. Replace `http://localhost:3000` with your Render URL:
   ```js
   serverUrl: process.env.SERVER_URL || "https://pc-remote-xxxx.onrender.com",
   ```
4. Save the file

---

## ✅ Step 6 — Run the Desktop Agent

The agent needs to run on your Windows PC (the one you want to control).

### Method A: Run Manually (Easiest)

1. Open **Command Prompt**
2. Navigate to the agent folder:
   ```
   cd Desktop\pc-remote\agent
   ```
3. Run:
   ```
   node agent.js
   ```
4. You'll see:
   ```
   ╔══════════════════════════════════════╗
   ║       PC Remote Agent Started        ║
   ╠══════════════════════════════════════╣
   ║  Server:   https://your-app.onrender.com
   ║  Polling:  every 5s
   ║  Log file: ./agent.log
   ╚══════════════════════════════════════╝
   ```
5. **Leave this window open** (minimize it if you want)

> The agent runs as long as this window is open. If you close it, commands won't be received.

---

### Method B: Run Automatically at Startup (Recommended)

You probably want the agent to start automatically when Windows boots, so you don't have to remember to run it.

#### Using Windows Task Scheduler:

1. Press `Windows key + S` and search for **"Task Scheduler"**
2. Click **"Create Basic Task…"** on the right side
3. **Name:** `PC Remote Agent`
4. **Trigger:** Select **"When I log on"** → Next
5. **Action:** Select **"Start a program"** → Next
6. **Program/Script:** Browse to `node.exe` (usually at `C:\Program Files\nodejs\node.exe`)
7. **Add arguments:** Type the full path to agent.js, e.g.:
   ```
   C:\Users\YourName\Desktop\pc-remote\agent\agent.js
   ```
8. **Start in:** Type the full path to the agent folder, e.g.:
   ```
   C:\Users\YourName\Desktop\pc-remote\agent
   ```
9. Click **Finish**

The agent will now start automatically every time you log into Windows. ✅

---

## 🌐 Using the Dashboard

1. Open your Render URL in any browser (phone, tablet, computer, anywhere!)
   Example: `https://pc-remote-xxxx.onrender.com`
2. Enter your password and click **Sign In**
3. You'll see the dashboard with three buttons
4. Click a button — a confirmation dialog will appear asking "Are you sure?"
5. Confirm, and the command is sent to your PC!

> ⏱️ **There may be a 5-10 second delay** between clicking and the PC responding, because the agent polls every 5 seconds.

> 💤 **Note on Render free tier:** Render's free web services "spin down" after 15 minutes of no web traffic. The first request after a spin-down takes ~30 seconds to wake up. You can upgrade to a paid plan ($7/month) to avoid this.

---

## 🔑 Changing Your Password

1. Open `server/config.js`
2. Change the `password` value
3. Save the file
4. **Redeploy the server** (on Render: go to your service → click "Manual Deploy" → "Deploy latest commit")

---

## 🔧 How It Works

```
[Your Browser] ←──── Web Dashboard ────→ [Server on the Internet]
                                                    ↑
                                         (Render / Railway / etc.)
                                                    ↑
                                          [Desktop Agent on your PC]
                                         (runs quietly in background,
                                          checks for commands every 5s)
```

1. You open the website and log in with your password.
2. You click "Shutdown" (or Restart / Sleep).
3. The website sends a command to the server.
4. The Desktop Agent (running on your PC) sees the command.
5. Your PC executes the action.

The agent is a tiny Node.js script that runs on your PC and polls the server. It uses almost no CPU or RAM.

---

## 📁 Project Structure

```
pc-remote/
│
├── server/                  ← The web server (runs in the cloud)
│   ├── server.js            ← Main server logic
│   ├── config.js            ← ⬅ Change your password here!
│   └── package.json         ← Server dependencies
│
├── agent/                   ← The Desktop Agent (runs on your PC)
│   ├── agent.js             ← Main agent logic
│   ├── agent-config.js      ← ⬅ Point this at your server URL
│   └── package.json         ← Agent dependencies
│
├── public/                  ← The website (served by the server)
│   ├── index.html           ← Login + Dashboard page
│   ├── css/
│   │   └── style.css        ← Dark theme styles
│   └── js/
│       └── app.js           ← Dashboard JavaScript
│
├── package.json             ← Convenience scripts
└── README.md                ← This file!
```




## 🔍 Troubleshooting

### "Cannot connect to server" in the agent log
- Make sure your Render URL in `agent-config.js` is correct (no trailing slash)
- Check that the server is deployed and the green "Live" badge shows on Render
- Wait 30 seconds if Render is "spinning up" from sleep

### The dashboard shows but login fails
- Double-check your password in `server/config.js`
- Make sure the server was redeployed after you changed the password

### Buttons appear to work but PC doesn't respond
- Make sure the Desktop Agent is running (check the Command Prompt window)
- Check the `agent.log` file in the agent folder for any errors
- Verify the agent's `serverUrl` matches your Render URL exactly

### Sleep doesn't work
- Some PCs disable sleep via PowerShell for security reasons
- Try enabling it: Open PowerShell as Administrator and run:
  ```
  powercfg -h on
  ```

### The agent window keeps closing
- This usually means Node.js crashed. Open the `agent.log` file to see the error
- Most common cause: wrong `serverUrl` in `agent-config.js`

---

## 🔒 Security Notes

- **Password is required** for all dashboard actions — no exceptions
- **Only approved commands run** — the agent has a whitelist and refuses everything else
- **No arbitrary shell commands** — you can never accidentally (or intentionally) run random commands through this
- **Keep your repository Private** on GitHub — it contains your config
- **Use a strong password** — this controls your PC!
- **Use HTTPS** — Render provides HTTPS automatically, so your password is encrypted in transit
- **Session expires** after 24 hours of inactivity — you'll need to log in again

---

## 📄 License

This project is for personal use. Use it responsibly.

---

*Made with ❤️ for anyone who wants to control their PC from anywhere.*
