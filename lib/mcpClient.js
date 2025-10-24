const BASE = process.env.NEXT_PUBLIC_MCP_BASE || '/api/mcp';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}/${path}`, opts);
  const text = await res.text();
  try { return JSON.parse(text); } catch (e) { return text; }
}

export async function listTools() {
  return request('tools');
}

export async function listData() {
  return request('data');
}

export async function readData(id) {
  return request(`data/${id}`);
}

export async function createData(payload) {
  return request('data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function updateData(id, payload) {
  return request(`data/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
}

export async function deleteData(id) {
  return request(`data/${id}`, { method: 'DELETE' });
}

export async function ask(prompt, options = {}) {
  return request('ask', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt, ...options }) });
}

export default { listTools, listData, readData, createData, updateData, deleteData, ask };
