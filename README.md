# Expenso (minimal)

A minimal Next.js expense tracker prototype.

This project was built for the Digital Science 2025 Technocly AI Hack Day as part of the Coders Track.

### Features
- Simple CRUD for expenses (amount, category, date, description, tags)
- List with filters (date range, category, tag)
- Export CSV
- Small SVG chart showing totals by category
- Local JSON persistence (optional) so data survives server restarts

### Quick start (local development)

1. Install dependencies and start the Next.js app:

```bash
npm install
npm run dev
```

2. Open the app in your browser:

http://localhost:3000

### Where data is stored
- Development persistence: `.data/expenses.json` in the repository root.
- This file is created automatically and is ignored by git. It's intended for local/dev use only.

### Useful commands
- Start dev server: `npm run dev`
- Build for production: `npm run build` and `npm run start`

## MCP server (agent / tools demo)

This repository includes a minimal MCP-style server under `server/`. It exposes a small tools registry plus CRUD and `/ask` endpoints so an agent can discover tools and request actions.

High-level options for running the demo:
- Run the MCP server separately (http://localhost:4000) and call it directly from the browser (CORS allowed for http://localhost:3000 by default).
- Preferably, run the Next.js proxy `/api/mcp/*` which forwards requests to the MCP server and injects the API key server-side so the browser never sees it.

### Start the MCP server
From the repository root:

```bash
cd server
cp .env.example .env       # create .env; edit if you want a different key
npm install
npm start
```

By default the example `.env.example` sets `MCP_API_KEY=secret`. The server prints a masked key at startup so you can confirm it's loaded.

### Configure Next.js proxy (server-side key injection)
Create a `.env.local` at the repository root (Next reads this at start):

```
MCP_API_KEY=secret
MCP_URL=http://localhost:4000   # optional if your MCP server runs elsewhere
```

Then restart Next.js (`npm run dev`) so it picks up the env.

### Demo page
- Open: http://localhost:3000/mcp-demo
- The demo calls `/api/mcp/ask` via the Next proxy. Use Suggest and Execute buttons to interact with the MCP server.

### Example API usage (copy/paste)

Create a Transport expense via the Next.js API (recommended — writes into `.data/expenses.json`):

```bash
curl -X POST http://localhost:3000/api/expenses \
	-H "Content-Type: application/json" \
	-d '{"amount":15.0,"category":"Transport","date":"2025-10-24","description":"Taxi to office","tags":["work"]}'
```

Create via MCP `/data` (MCP payload shape):

```bash
curl -X POST http://localhost:4000/data \
	-H "Content-Type: application/json" \
	-d '{"type":"expense","attributes":{"amount":15.0,"currency":"USD","category":"Transport","description":"Taxi to office","date":"2025-10-24","tags":["work"]}}'
```

Create via agent-style `/ask` through the Next proxy (Next injects API key):

```bash
curl -X POST http://localhost:3000/api/mcp/ask \
	-H "Content-Type: application/json" \
	-d '{"prompt":"Create a transport expense","execute":true,"params":{"type":"expense","attributes":{"amount":15.0,"currency":"USD","category":"Transport","description":"Taxi to office","date":"2025-10-24","tags":["work"]}}}'
```

Or call `/ask` directly on MCP (requires `x-api-key` header):

```bash
curl -X POST http://localhost:4000/ask \
	-H "Content-Type: application/json" \
	-H "x-api-key: secret" \
	-d '{"prompt":"Create a transport expense","execute":true,"params":{"type":"expense","attributes":{"amount":15.0,"currency":"USD","category":"Transport","description":"Taxi to office","date":"2025-10-24","tags":["work"]}}}'
```

### Verify persistence
- Check the file: `cat .data/expenses.json` or call the Next API: `curl http://localhost:3000/api/expenses`.
- MCP's `GET /data` merges in persisted `.data/expenses.json` items (so both services show the same data).

### Troubleshooting
- Invalid API key for execution: ensure the MCP server's `MCP_API_KEY` (in `server/.env`) matches the Next.js `MCP_API_KEY` in `.env.local` if you use the proxy. Restart both servers after changing env files.
- Validation errors (Ajv): ensure payload includes required fields (`amount` and `currency` for `expense`).
- CORS errors in browser: MCP allows `http://localhost:3000` by default; change `MCP_CORS_ORIGIN` in `server/.env` if necessary.

### Security notes
- Do not expose `MCP_API_KEY` to the browser. Use the Next.js proxy for browser-initiated actions that require the key.
- Add rate limiting and HTTPS before exposing services publicly.

### Screenshot
![Expenso screenshot](public/screenshots/expenso-screenshot.png)

### License

This project is licensed under the MIT License — see the accompanying `LICENSE` file for details.


