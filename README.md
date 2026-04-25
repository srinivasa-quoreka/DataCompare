# FT Validator -- Deployment Guide

## What's in this folder

| File | Purpose |
|------|---------|
| `index.html` | The FT Validator application |
| `server.js` | Node.js static file server (no npm install needed) |
| `FT_Validator_Launch.bat` | **Main launcher** -- double-click to start |
| `install-service.bat` | Install as Windows Service (auto-starts on boot) |
| `uninstall-service.bat` | Remove the Windows Service |
| `open-firewall.bat` | Open port 5000 in Windows Firewall |
| `DIAGNOSE_AND_FIX.bat` | Fix network access issues for team members |

---

## Quick Start

1. Install **Node.js** from https://nodejs.org (LTS version, one-time setup)
2. Double-click **`FT_Validator_Launch.bat`**
3. The console will show your network URL, e.g.:
   ```
   Network URL: http://192.168.1.45:5000
   ```
4. Share that URL with your team

---

## Install as Windows Service (Recommended)

Makes the server start automatically on every Windows boot, runs silently in the background.

1. Right-click **`open-firewall.bat`** -> Run as administrator
2. Right-click **`install-service.bat`** -> Run as administrator
3. Run `ipconfig` to find your IPv4 address
4. Share `http://YOUR-IP:5000` with the team

To manage the service later: open `services.msc`, look for **FT Validator Web Server**

---

## Team Cannot Connect?

Run **`DIAGNOSE_AND_FIX.bat`** as Administrator. It will:
- Detect your correct network IP
- Clear and re-add firewall rules
- Test connectivity
- Print a full checklist of what to check

---

## Default Login Credentials

| Username | Password   |
|----------|------------|
| `admin`  | `Admin123!` |
| `user1`  | `User1Pass!` |
| `user2`  | `User2Pass!` |
| `user3`  | `User3Pass!` |
| `user4`  | `User4Pass!` |

Admin can reset any user password via Settings -> User Management.

---

## Changing the Port

Edit `FT_Validator_Launch.bat` and change `set PORT=5000` to any other port number.
Also update the firewall rule to match.

---

## Folder Structure

```
FT_Validator_Service\
  index.html                 <- The application
  server.js                  <- Node.js server
  FT_Validator_Launch.bat    <- Double-click to start
  install-service.bat        <- Windows Service installer
  uninstall-service.bat      <- Windows Service remover
  open-firewall.bat          <- Firewall helper
  DIAGNOSE_AND_FIX.bat       <- Network troubleshooter
  README.md                  <- This file
  logs\                      <- Created automatically
```
