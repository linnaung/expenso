const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const { v4: uuidv4 } = require('uuid');
const Ajv = require('ajv');
const fs = require('fs');
const path = require('path');

// Load .env into process.env if present
require('dotenv').config();

const app = express();
const ajv = new Ajv();

app.use(morgan('dev'));
app.use(bodyParser.json({ limit: '100kb' }));

// Enable CORS for local development. You can set MCP_CORS_ORIGIN env var to limit origin.
const cors = require('cors');
const CORS_ORIGIN = process.env.MCP_CORS_ORIGIN || 'http://localhost:3000';
app.use(cors({ origin: CORS_ORIGIN }));

// Read API key once from env and log masked info
const MCP_API_KEY = process.env.MCP_API_KEY || 'changeme';
function maskKey(k) {
  if (!k) return '(none)';
  if (k.length <= 4) return '*'.repeat(k.length);
  return k.slice(0, 2) + '*'.repeat(Math.max(0, k.length - 4)) + k.slice(-2);
}
console.log(`MCP API key: ${maskKey(MCP_API_KEY)} (set MCP_API_KEY in .env or the environment to override)`);

// In-memory store: id -> record
const store = new Map();

// Helper: per-type JSON schemas
const schemas = {
  note: {
    type: 'object',
    properties: {
      type: { const: 'note' },
      attributes: {
        type: 'object',
        properties: {
          text: { type: 'string' }
        },
        required: ['text'],
        additionalProperties: false
      }
    },
    required: ['type', 'attributes'],
    additionalProperties: false
  },
  expense: {
    type: 'object',
    properties: {
      type: { const: 'expense' },
      attributes: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          currency: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
          date: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } }
        },
        required: ['amount', 'currency'],
        additionalProperties: false
      }
    },
    required: ['type', 'attributes'],
    additionalProperties: false
  },
  task: {
    type: 'object',
    properties: {
      type: { const: 'task' },
      attributes: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          done: { type: 'boolean' }
        },
        required: ['title'],
        additionalProperties: false
      }
    },
    required: ['type', 'attributes'],
    additionalProperties: false
  }
};

const validators = Object.fromEntries(Object.entries(schemas).map(([k, s]) => [k, ajv.compile(s)]));

// Tools metadata
const tools = [
  { id: 'listData', name: 'List data', description: 'List stored objects', method: 'GET', endpoint: '/data' },
  { id: 'createData', name: 'Create data', description: 'Create a stored object', method: 'POST', endpoint: '/data' },
  { id: 'readData', name: 'Read data', description: 'Read a stored object', method: 'GET', endpoint: '/data/:id' },
  { id: 'updateData', name: 'Update data', description: 'Update a stored object', method: 'PUT', endpoint: '/data/:id' },
  { id: 'deleteData', name: 'Delete data', description: 'Delete a stored object', method: 'DELETE', endpoint: '/data/:id' }
];

// Helper functions for operations
function listData() {
  return Array.from(store.values());
}

function createData({ type, attributes }) {
  const id = uuidv4();
  const now = new Date().toISOString();
  const rec = { id, type, attributes, createdAt: now, updatedAt: now };
  store.set(id, rec);

  // If this is an expense, also persist to the app's JSON store so Next.js API can see it
  if (type === 'expense') {
    try {
      const dataDir = path.resolve(__dirname, '..', '.data');
      const filePath = path.join(dataDir, 'expenses.json');
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, JSON.stringify({ items: [], nextId: 1 }));
      const raw = fs.readFileSync(filePath, 'utf8');
      const storeObj = JSON.parse(raw || '{"items":[],"nextId":1}');
      const { items, nextId } = storeObj;
      // Map attributes into the app's expense shape
      const expenseItem = {
        id: nextId,
        amount: Number(attributes.amount || 0),
        category: attributes.category || attributes.category || 'Other',
        date: attributes.date || new Date().toISOString().slice(0, 10),
        description: attributes.description || attributes.note || '',
        tags: attributes.tags || []
      };
      items.push(expenseItem);
      const newStore = { items, nextId: nextId + 1 };
      fs.writeFileSync(filePath, JSON.stringify(newStore, null, 2), 'utf8');
      // attach a reference to the persisted expense id
      rec.persistentId = expenseItem.id;
    } catch (e) {
      // ignore persistence errors but log
      console.error('Expense persistence failed:', e.message);
    }
  }

  return rec;
}

function readData(id) {
  return store.get(id) || null;
}

function updateData(id, { attributes }) {
  const existing = store.get(id);
  if (!existing) return null;
  existing.attributes = { ...existing.attributes, ...attributes };
  existing.updatedAt = new Date().toISOString();
  store.set(id, existing);
  return existing;
}

function deleteData(id) {
  return store.delete(id);
}

// Middleware: simple API key check for executing actions via /ask when execute=true
function requireApiKey(req, res, next) {
  const header = req.headers['x-api-key'];
  if (!header || header !== MCP_API_KEY) return res.status(401).json({ error: 'Invalid API key' });
  next();
}

// GET /tools
app.get('/tools', (req, res) => {
  res.json(tools);
});

// CRUD endpoints
app.get('/data', (req, res) => {
  // Return both in-memory records and persisted expenses from .data/expenses.json
  try {
    const dataDir = path.resolve(__dirname, '..', '.data');
    const filePath = path.join(dataDir, 'expenses.json');
    let persisted = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const storeObj = JSON.parse(raw || '{"items":[],"nextId":1}');
      persisted = (storeObj.items || []).map(it => ({
        id: `persisted:${it.id}`,
        type: 'expense',
        attributes: {
          amount: Number(it.amount),
          currency: it.currency || 'USD',
          description: it.description || '',
          category: it.category || 'Other',
          date: it.date || ''
        },
        createdAt: null,
        updatedAt: null,
        persistentId: it.id
      }));
    }
    const combined = [...listData(), ...persisted];
    res.json(combined);
  } catch (e) {
    // fallback to in-memory only
    res.json(listData());
  }
});

app.post('/data', (req, res) => {
  const body = req.body || {};
  if (!body.type) return res.status(400).json({ error: 'Missing type in payload' });
  const validator = validators[body.type];
  if (!validator) return res.status(400).json({ error: `Unknown type: ${body.type}` });
  const ok = validator(body);
  if (!ok) return res.status(400).json({ error: 'Invalid payload for type', details: validator.errors });
  const rec = createData(body);
  res.status(201).json(rec);
});

app.get('/data/:id', (req, res) => {
  const rec = readData(req.params.id);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

app.put('/data/:id', (req, res) => {
  if (!req.body || typeof req.body !== 'object') return res.status(400).json({ error: 'Invalid payload' });
  const rec = updateData(req.params.id, req.body);
  if (!rec) return res.status(404).json({ error: 'Not found' });
  res.json(rec);
});

app.delete('/data/:id', (req, res) => {
  const ok = deleteData(req.params.id);
  if (!ok) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

// POST /ask: agent-friendly endpoint
// Body: { prompt: string, tool?: string, params?: object, execute?: boolean }
app.post('/ask', (req, res) => {
  (async () => {
  let { prompt, tool, params, execute, useLLM } = req.body || {};

    // Local heuristic suggester
    function heuristicSuggest(p) {
      if (!p) return { suggestion: 'listData', reason: 'No prompt provided' };
      const s = p.toLowerCase();
      if (s.includes('create') || s.includes('add') || s.includes('new')) return { suggestion: 'createData', reason: 'Detected create intent' };
      if (s.includes('update') || s.includes('change') || s.includes('edit')) return { suggestion: 'updateData', reason: 'Detected update intent' };
      if (s.includes('delete') || s.includes('remove')) return { suggestion: 'deleteData', reason: 'Detected delete intent' };
      if (s.includes('get') || s.includes('show') || s.includes('list') || s.includes('read')) return { suggestion: 'listData', reason: 'Detected list/read intent' };
      // If mention of expense, prefer create expense
      if (s.includes('expense') || s.includes('amount') || s.includes('pay')) return { suggestion: 'createData', reason: 'Detected expense keywords' };
      return { suggestion: 'listData', reason: 'Fallback to list' };
    }

    let chosen = tool;
    let reason = 'explicit tool provided';

    // If useLLM requested and API key available, call OpenAI to map prompt to tool
    if (!chosen && useLLM && process.env.OPENAI_API_KEY) {
      try {
        const axios = require('axios');
        const openaiKey = process.env.OPENAI_API_KEY;
        const system = `You are a tool-router. Given a short user instruction, respond with a JSON object with keys: \"tool\" and \"params\". \n- \"tool\" must be one of: ${tools.map(t=>t.id).join(', ')}.\n- \"params\" must be an object appropriate for the chosen tool (for createData include type and attributes).\nReturn valid JSON only.`;
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt || '' }
          ],
          temperature: 0
        }, { headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' } });

        const text = response.data?.choices?.[0]?.message?.content;
        if (text) {
          try {
            const parsed = JSON.parse(text);
            if (parsed.tool) {
              chosen = parsed.tool;
              reason = 'mapped by LLM';
              // if LLM returned params, use them (override only if not supplied explicitly)
              if (parsed.params && !params) params = parsed.params;
            }
          } catch (e) {
            // ignore parse error and fall back
          }
        }
      } catch (err) {
        // ignore LLM errors and fall back to heuristic
        console.error('LLM mapping failed:', err.message);
      }
    }

    if (!chosen) {
      const s = heuristicSuggest(prompt || '');
      chosen = s.suggestion;
      reason = s.reason;
    }

    // Execution path
    if (execute) {
      const header = req.headers['x-api-key'];
      if (!header || header !== MCP_API_KEY) return res.status(401).json({ error: 'Invalid API key for execution' });
      try {
        let result;
        switch (chosen) {
          case 'createData':
            // validate by type
            const body = params || {};
            if (!body.type) return res.status(400).json({ error: 'Missing type in create params' });
            const validator = validators[body.type];
            if (!validator) return res.status(400).json({ error: `Unknown type: ${body.type}` });
            if (!validator(body)) return res.status(400).json({ error: 'Invalid create params for type', details: validator.errors });
            result = createData(body);
            return res.status(201).json({ tool: chosen, result });
          case 'updateData':
            if (!params || !params.id) return res.status(400).json({ error: 'Missing id for update' });
            result = updateData(params.id, { attributes: params.attributes || {} });
            if (!result) return res.status(404).json({ error: 'Not found' });
            return res.json({ tool: chosen, result });
          case 'deleteData':
            if (!params || !params.id) return res.status(400).json({ error: 'Missing id for delete' });
            const ok = deleteData(params.id);
            if (!ok) return res.status(404).json({ error: 'Not found' });
            return res.status(204).send();
          case 'listData':
          default:
            result = listData();
            return res.json({ tool: chosen, result });
        }
      } catch (err) {
        return res.status(500).json({ error: 'Execution error', details: err.message });
      }
    }

    // Suggestion path
    const sample = (chosen === 'createData') ? { type: 'note', attributes: { text: 'Example' } } : undefined;
    res.json({ suggestion: chosen, reason, sample });
  })();
});

// Export app for testing; start server only when run directly
module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`MCP server listening on http://localhost:${port}`);
  });
}
