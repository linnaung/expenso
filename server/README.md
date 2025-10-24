# expenso MCP server

This folder contains a minimal Model Context Protocol (MCP)-style server used for testing agent/tool interactions.

Features:
- In-memory store for objects (CRUD)
- `/tools` endpoint exposing tool metadata
- `/ask` endpoint for agent-friendly suggestions and optional execution

Run (from repository root):

```bash
cd server
npm install
npm start
```

By default the server listens on port 4000. To allow the server to execute actions via `/ask` when `execute=true`, set the `MCP_API_KEY` environment variable and include the same value in the `x-api-key` request header.

Example: create via /ask (execute):

```bash
export MCP_API_KEY=secret
curl -X POST http://localhost:4000/ask -H 'Content-Type: application/json' -H 'x-api-key: secret' -d '{"prompt":"create a note","execute":true, "params": {"type":"note","attributes":{"text":"hello"}}}'
```

Using a .env file
------------------

You can create a `.env` file inside `server/` to set `MCP_API_KEY` and `OPENAI_API_KEY`. A sample file is provided as `.env.example`.

Example `.env` (do not commit this file):

```
MCP_API_KEY=secret
OPENAI_API_KEY=sk-...
```

When you start the server it will read `.env` and print a masked version of the configured `MCP_API_KEY` so you can confirm which key is active.
