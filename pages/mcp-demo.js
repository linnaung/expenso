import { useEffect, useState } from 'react';
import mcpClient from '../lib/mcpClient';

export default function McpDemo() {
  const [tools, setTools] = useState([]);
  const [prompt, setPrompt] = useState('create a note');
  const [suggestion, setSuggestion] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    mcpClient.listTools().then(setTools).catch(err => console.error(err));
  }, []);

  async function handleSuggest() {
    setLoading(true);
    setSuggestion(null);
    setResult(null);
    try {
      const res = await mcpClient.ask(prompt, { execute: false });
      setSuggestion(res.suggestion || JSON.stringify(res));
    } catch (e) {
      setSuggestion('error: ' + (e.message || e));
    } finally {
      setLoading(false);
    }
  }

  async function handleExecute() {
    setLoading(true);
    setResult(null);
    try {
      // simple default params for create when executing
      const res = await mcpClient.ask(prompt, { execute: true, params: { type: 'note', attributes: { text: prompt } } });
      setResult(res);
    } catch (e) {
      setResult({ error: e.message || e });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto' }}>
      <h1>MCP demo</h1>
      <p>This page demonstrates tool discovery and using the MCP server via the Next.js proxy <code>/api/mcp</code>.</p>

      <section style={{ marginBottom: 16 }}>
        <h2>Discovered tools</h2>
        <ul>
          {tools.map(t => (
            <li key={t.id}><strong>{t.id}</strong>: {t.description}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 16 }}>
        <h2>Ask the MCP</h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input value={prompt} onChange={e => setPrompt(e.target.value)} style={{ flex: 1, padding: 8 }} />
          <button onClick={handleSuggest} disabled={loading}>Suggest</button>
          <button onClick={handleExecute} disabled={loading}>Execute</button>
        </div>
        {loading && <div>Loading…</div>}
        {suggestion && <div><strong>Suggestion:</strong> {typeof suggestion === 'string' ? suggestion : JSON.stringify(suggestion)}</div>}
        {result && <div style={{ marginTop: 8 }}><strong>Result:</strong> <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre></div>}
      </section>

      <section>
        <h2>Notes</h2>
        <ul>
          <li>This page calls <code>/api/mcp</code> which is proxied to the MCP server and injects the server-side <code>MCP_API_KEY</code>.</li>
          <li>Make sure your Next.js server environment includes <code>MCP_API_KEY</code> and (optionally) <code>MCP_URL</code> pointing to the MCP server.</li>
        </ul>
      </section>
    </div>
  );
}
