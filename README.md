# 🃏 Planning Poker

Real-time story-point estimation with a Fibonacci deck (`1 2 3 5 8 13 21 ? ☕`).

**Stack:** React + Vite client · Node + Express + Socket.IO server · browser `localStorage` for persistence.

## Features

- Create a room and share the invite link (or 8-character room code)
- Votes stay hidden until the facilitator reveals them, then everyone sees them at once
- Facilitator-only controls: story title, reveal, reset votes, next round
- Stats after reveal: average, suggested card, min/max, consensus, and a distribution chart
- Observer (non-voting) mode, switchable at any time
- Round history, plus JSON export
- Facilitator handoff ("make facilitator"), or "Become facilitator" if the facilitator leaves
- English and Japanese (日本語) UI: auto-detected from the browser language, switchable from the language menu, and remembered per browser

### Adding a language

Translations live in `client/src/lib/messages.js`:

1. Add the language to `LANGUAGES`.
2. Add a `messages.<code>` block with every English key.
3. Add server error translations under `serverErrors` and `fieldErrors`.

`npm test` fails if any key, placeholder or server error message is missing.

## How persistence works

The server keeps live room state **in memory only** and never stores anything to disk.

The **facilitator's browser is the source of truth**. After every change it saves the room name,
current round number and story, and the history to `localStorage` (`pp.room.<id>`).

If the server restarts, the facilitator's browser re-seeds the room when it reconnects.
Participants who arrive first see "Waiting for the facilitator…" and join automatically
once the facilitator returns.

| Stored in | Data |
|---|---|
| Every browser | secret client token, display name, role per room |
| Facilitator's browser | room snapshot + history |
| Server memory | live participants and current-round votes (unrevealed votes are never persisted) |

Caveats:

- **History lives on one machine.** If the facilitator clears site data or switches browsers, the history is lost. Use **Export JSON** to keep a copy.
- **One browser profile counts as one participant.** The identity token is shared across tabs. To test with several people locally, use different browsers or private windows.
- **Idle rooms are evicted.** Rooms with nobody connected are removed from server memory after 6 hours. The facilitator can reopen them from the home page.

## Development

Requires Node `^20.19` or `>=22.12`.

```bash
npm install
npm run dev        # server on :3001, Vite on :5173 (proxies /socket.io)
npm test           # server tests + client i18n tests
```

## Production

```bash
npm run build      # builds client/dist
PORT=3001 npm start   # serves the built client and the Socket.IO server
```

The server keeps state in memory, so run a **single instance** (or use sticky sessions plus a shared Socket.IO adapter).

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for free hosting on Render, or Netlify + Render.

Optional environment variables:

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | server | Listen port (default `3001`) |
| `CORS_ORIGIN` | server | Comma-separated allowed origins, only needed when the client is hosted elsewhere |
| `VITE_SERVER_URL` | client build | Socket.IO server URL, only needed when the client is hosted elsewhere |
