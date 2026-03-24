# Running PickMeUp Locally with Docker (Windows)

This guide is for Windows team members who want to run both the Customer and Manager apps locally using Docker. You do **not** need to clone any repos or install Node.js — Docker handles everything.

---

## What You Need

- [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) installed and running
- The `.env` file with secret values (ask a teammate — **never** commit this file)

---

## Step 1 — Install Docker Desktop

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop/
2. Run the installer and follow the prompts
3. When asked, make sure **"Use WSL 2 instead of Hyper-V"** is checked (recommended)
4. Restart your computer if prompted
5. Open Docker Desktop — wait until you see **"Docker Desktop is running"** in the bottom left corner

> If Docker asks you to install WSL 2, follow the link it provides and complete that step first, then relaunch Docker Desktop.

---

## Step 2 — Create a Folder

Open **PowerShell** (search for it in the Start menu) and run:

```powershell
mkdir $HOME\pickmeup-docker
cd $HOME\pickmeup-docker
```

This creates a folder at `C:\Users\YourName\pickmeup-docker`.

---

## Step 3 — Add the Config Files

You need two files inside `C:\Users\YourName\pickmeup-docker\`. You can create them with Notepad or any text editor — just make sure the file extensions are correct (`.yml` and `.env`, not `.txt`).

### `docker-compose.yml`

Create a new file named `docker-compose.yml` and paste in the following:

```yaml
version: "3.9"

services:
  customer:
    image: tayuun/pickmeup-customer:latest
    platform: linux/amd64
    container_name: pickmeup-customer
    ports:
      - "3001:3000"
    environment:
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SQUARE_ACCESS_TOKEN: ${SQUARE_ACCESS_TOKEN}
      RESEND_API_KEY: ${RESEND_API_KEY}
      POSTHOG_PERSONAL_API_KEY: ${POSTHOG_PERSONAL_API_KEY}
      POSTHOG_PROJECT_ID: ${POSTHOG_PROJECT_ID}
      ANALYTICS_API_KEY: ${ANALYTICS_API_KEY}
      RECAPTCHA_SECRET_KEY: ${RECAPTCHA_SECRET_KEY}
    restart: unless-stopped
    networks:
      - pickmeup-net
    healthcheck:
      test:
        [
          "CMD",
          "node",
          "-e",
          "fetch('http://localhost:3000/').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))",
        ]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  manager:
    image: tayuun/pickmeup-manager:latest
    platform: linux/amd64
    container_name: pickmeup-manager
    ports:
      - "3000:3000"
    environment:
      SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY}
      SQUARE_ACCESS_TOKEN: ${SQUARE_ACCESS_TOKEN}
      POSTHOG_PERSONAL_API_KEY: ${POSTHOG_PERSONAL_API_KEY}
      POSTHOG_PROJECT_ID: ${POSTHOG_PROJECT_ID}
      ANALYTICS_API_KEY: ${ANALYTICS_API_KEY}
      CLIENT_APP_URL: http://customer:3000
    depends_on:
      customer:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - pickmeup-net

networks:
  pickmeup-net:
    driver: bridge
```

> **Tip — saving with the right extension in Notepad:** When saving, set "Save as type" to **All Files** and name it exactly `docker-compose.yml`. Otherwise Notepad will save it as `docker-compose.yml.txt`.

### `.env`

Get this file from a teammate. It should look like this (with real values filled in):

```
SUPABASE_SERVICE_ROLE_KEY=your_value_here
SQUARE_ACCESS_TOKEN=your_value_here
RESEND_API_KEY=your_value_here
POSTHOG_PERSONAL_API_KEY=your_value_here
POSTHOG_PROJECT_ID=your_value_here
ANALYTICS_API_KEY=your_value_here
RECAPTCHA_SECRET_KEY=your_value_here
```

> Do **not** commit this file to git. It contains secrets.

---

## Step 4 — Start the Containers

Make sure Docker Desktop is open and running, then in PowerShell run:

```powershell
cd $HOME\pickmeup-docker
docker-compose up -d
```

Docker will automatically pull the images from DockerHub on first run — this may take a couple of minutes depending on your internet speed. Once done, you should see:

```
✔ Container pickmeup-customer  Healthy
✔ Container pickmeup-manager   Started
```

---

## Step 5 — Open the Apps

| App          | URL                   |
| ------------ | --------------------- |
| Customer app | http://localhost:3001 |
| Manager app  | http://localhost:3000 |

---

## Stopping the Containers

```powershell
docker-compose down
```

---

## Getting the Latest Version

When the team pushes updated images, run:

```powershell
docker-compose pull
docker-compose up -d
```

---

## Troubleshooting

### Containers won't start / one is unhealthy

Check the logs in PowerShell:

```powershell
docker-compose logs customer
docker-compose logs manager
```

### Port already in use

If port 3000 or 3001 is already taken by another app, find what's using it:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

The last column is the Process ID (PID). Open **Task Manager → Details tab**, find that PID, and end the process. Then retry `docker-compose up -d`.

### Docker Desktop not running

Make sure Docker Desktop is open and shows **"Docker Desktop is running"** before running any commands. It can take 30–60 seconds to fully start after opening.

### WSL 2 errors on startup

If Docker Desktop shows a WSL 2 error, open PowerShell **as Administrator** and run:

```powershell
wsl --update
```

Then restart Docker Desktop.
