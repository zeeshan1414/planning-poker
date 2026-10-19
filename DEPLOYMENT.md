# Deployment Guide

This guide deploys Planning Poker for **$0/month**.

> Pricing and limits were checked in October 2026 against
> [render.com/docs/free](https://render.com/docs/free) and [netlify.com/pricing](https://www.netlify.com/pricing/).
> Free tiers change often, so re-check them before relying on them.

## Why not Netlify alone?

The app needs a **long-running Node process** that holds Socket.IO (WebSocket) connections open, so every vote is pushed to everyone in real time.

Netlify can't provide that:

- Netlify Functions are request/response only. They run in an ephemeral runtime, return a single `Response`, and then stop, so they can't keep a socket open or hold room state in memory.
- Netlify is still a good fit for the **static React frontend**, but the server has to live somewhere else.

## Free hosting options

| Option | Cost | Real-time server | Notes |
|---|---|---|---|
| **A. Render (everything)** ⭐ recommended | $0 | ✅ Free web service | One service, one URL, no CORS. Sleeps after 15 min idle. |
| **B. Netlify (frontend) + Render (server)** | $0 | ✅ on Render | Homepage loads instantly from Netlify's CDN, but the room still waits for Render to wake. Two deploys to manage. |
| Netlify only | — | ❌ | Not possible (see above). |
| Fly.io / Railway | Usage-based | ✅ | No permanent free tier, so these aren't covered here. |

### Render free-tier limits

- **Sleeps after 15 minutes idle.** Any HTTP request or WebSocket message counts as activity, so a running session keeps it awake.
- **Takes about a minute to wake.** The first visitor after a quiet period sees Render's loading page.
- **Restarts lose memory.** Sleeping or restarting wipes in-memory rooms. This app handles that: the facilitator's browser saves the room in `localStorage` and restores it when it reconnects. Participants who arrive first see "Waiting for the facilitator…".
- **750 free instance hours per month.** That's enough for one service running 24/7 (a month has at most 744 hours).
- **Monthly bandwidth and build-minute allowances apply.** Without a payment method on file, Render suspends the service instead of charging you if you exceed them. This app is tiny (about 90 KB gzipped), so that's unlikely.

### Netlify free-tier limits (option B only)

- **300 credits per month.**
- **Production deploys cost 15 credits each**, which caps you at about **20 deploys per month**. Bandwidth (20 credits/GB) and requests (2 credits per 10k) also draw from the same pool.
- **Deploy previews** (for branches and PRs) are listed as unlimited.
- **Tip:** turn off auto-deploy on every push, or deploy only from `main`, so you don't burn credits.

---

## Prerequisites

1. Push this repo to GitHub (Render and Netlify both deploy from Git):

   ```bash
   gh repo create planning-poker --private --source . --push
   ```

2. Create free accounts at [render.com](https://render.com) (and [netlify.com](https://netlify.com) for option B). Sign up with GitHub.

The project pins Node 22 via `.nvmrc`. Both platforms pick that up automatically.

---

## Option A: Everything on Render (recommended)

The repo includes a `render.yaml` blueprint:

```yaml
services:
  - type: web
    name: planning-poker
    runtime: node
    plan: free
    buildCommand: npm ci && npm run build
    startCommand: npm start
    healthCheckPath: /healthz
```

1. In the Render Dashboard, go to **New → Blueprint** and select your `planning-poker` repo.
2. Review the plan (it should say **Free**) and click **Apply**.
3. Wait for the build (a few minutes), then open `https://planning-poker-xxxx.onrender.com`.
4. Check the server: `https://<your-app>.onrender.com/healthz` should return `{"ok":true,...}`.

**Manual setup (without the blueprint):** go to **New → Web Service**, pick the repo, and enter:

- Runtime: **Node**
- Build command: `npm ci && npm run build`
- Start command: `npm start`
- Instance type: **Free**
- Health check path: `/healthz`

You don't need to set `PORT`. Render provides it and the server reads it.

Every push to the connected branch redeploys automatically.

---

## Option B: Netlify frontend + Render server

### 1. Deploy the server on Render

Follow Option A first. Note the URL, e.g. `https://planning-poker-xxxx.onrender.com`.

### 2. Deploy the frontend on Netlify

The repo includes a `netlify.toml` that builds the client and publishes `client/dist`. It also adds an SPA redirect so `/room/<id>` links work.

1. In Netlify, go to **Add new project → Import an existing project → GitHub** and pick the repo. The build settings are read from `netlify.toml`.
2. Under **Environment variables**, add:

   | Key | Value |
   |---|---|
   | `VITE_SERVER_URL` | `https://planning-poker-xxxx.onrender.com` |

3. Deploy. Note the site URL, e.g. `https://planning-poker.netlify.app`.

### 3. Allow the Netlify origin on Render

In the Render service, go to **Environment** and add:

| Key | Value |
|---|---|
| `CORS_ORIGIN` | `https://planning-poker.netlify.app` |

Use a comma-separated list for several origins, e.g. a custom domain as well. Render redeploys automatically.

Share the **Netlify** URL with your team.

> `VITE_SERVER_URL` is baked in at build time. If the Render URL changes, trigger a new Netlify deploy, which costs 15 credits.

---

## Optional: avoid the wake-up delay

To skip the roughly one-minute wake-up before a meeting, open the app (or `/healthz`) a couple of minutes early.

You can also use a free uptime monitor (e.g. UptimeRobot) to ping `/healthz` every 10 minutes. This keeps the service awake within the 750-hour monthly allowance. Check Render's current terms first.

## Custom domain (optional)

Both platforms add custom domains with free HTTPS:

- **Render:** Settings → Custom Domains.
- **Netlify:** Domain management.

For option B, also add the new domain to `CORS_ORIGIN`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| "Connecting…" never finishes (option B) | Check that `VITE_SERVER_URL` is the exact `https://` Render URL with no trailing path, and that `CORS_ORIGIN` matches the Netlify URL exactly. Look in the browser console for CORS errors. |
| `/room/<id>` returns 404 on Netlify | Make sure `netlify.toml` is at the repo root (it holds the SPA redirect). |
| Participants stuck on "Waiting for the facilitator…" | The server restarted or slept. The facilitator needs to open the room link again in the browser they created it in. |
| History disappeared | History lives in the facilitator's browser. Clearing site data or switching browsers loses it, so use **Export JSON** regularly. |
| Render build fails on Node version | Make sure `.nvmrc` (Node 22) is committed. |

## Scaling note

Room state lives in a single server process. Run **one instance** only. Horizontal scaling would need sticky sessions plus a shared Socket.IO adapter (e.g. Redis), which isn't free.
