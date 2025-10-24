#!/usr/bin/env node
// Example agent that discovers tools and safely executes operations on the MCP server.
// Usage:
// 1) Configure: export MCP_URL=http://localhost:4000
// 2) Optionally: export MCP_API_KEY=changeme
// 3) Optionally: export OPENAI_API_KEY=...
// 4) Run: node example_agent.js "create a note saying hello" --auto

const axios = require('axios');

const MCP_URL = process.env.MCP_URL || 'http://localhost:4000';
const API_KEY = process.env.MCP_API_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

async function discoverTools() {
  const res = await axios.get(`${MCP_URL}/tools`);
  return res.data;
}

async function ask(prompt, opts = {}) {
  const payload = { prompt, useLLM: !!OPENAI_KEY, ...opts };
  const headers = {};
  if (opts.execute && API_KEY) headers['x-api-key'] = API_KEY;
  const res = await axios.post(`${MCP_URL}/ask`, payload, { headers });
  return res;
}

async function run() {
  const prompt = process.argv[2] || 'list items';
  const auto = process.argv.includes('--auto');

  console.log('Discovering tools...');
  const tools = await discoverTools();
  console.log('Tools:', tools.map(t => t.id).join(', '));

  console.log(`Asking server for suggestion for prompt: "${prompt}" (useLLM=${!!OPENAI_KEY})`);
  const suggestionRes = await ask(prompt, { execute: false });
  console.log('Suggestion response:', suggestionRes.data);

  if (auto) {
    if (!API_KEY) {
      console.error('AUTO execution requested but MCP_API_KEY is not set. Aborting.');
      process.exit(2);
    }
    console.log('Executing suggested action...');
    const execRes = await ask(prompt, { execute: true });
    console.log('Execution result:', execRes.status, execRes.data || '(no content)');
  } else {
    console.log('Not auto-executing. To auto execute, pass --auto and ensure MCP_API_KEY env var is set.');
  }
}

run().catch(err => {
  console.error('Agent error:', err.response?.data || err.message);
  process.exit(1);
});
