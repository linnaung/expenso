const request = require('supertest');
const app = require('../index');

jest.mock('axios');
const axios = require('axios');

describe('/ask endpoint', () => {
  const KEY = process.env.MCP_API_KEY || 'changeme';
  afterEach(() => {
    if (axios.post && axios.post.mockReset) axios.post.mockReset();
    delete process.env.OPENAI_API_KEY;
  });

  test('suggestion returns suggestion field', async () => {
    const res = await request(app).post('/ask').send({ prompt: 'create a note' });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBeDefined();
  });

  test('execute without API key returns 401', async () => {
    const res = await request(app).post('/ask').send({ prompt: 'create a note', execute: true, params: { type: 'note', attributes: { text: 'x' } } });
    expect(res.status).toBe(401);
  });

  test('execute with API key creates record', async () => {
    const res = await request(app).post('/ask').set('x-api-key', KEY).send({ prompt: 'create a note', execute: true, params: { type: 'note', attributes: { text: 'created' } } });
    expect(res.status).toBe(201);
    expect(res.body.result).toHaveProperty('id');
    expect(res.body.result.type).toBe('note');
    expect(res.body.result.attributes.text).toBe('created');
  });

  test('useLLM mapping returns suggestion (mocked OpenAI)', async () => {
    process.env.OPENAI_API_KEY = 'testkey';
    axios.post.mockResolvedValue({ data: { choices: [{ message: { content: '{"tool":"createData","params":{"type":"note","attributes":{"text":"from LLM"}}}' } }] } });
    const res = await request(app).post('/ask').send({ prompt: 'please create a note', useLLM: true });
    expect(res.status).toBe(200);
    expect(res.body.suggestion).toBe('createData');
  });

  test('useLLM execute with API key creates via LLM mapping (mocked OpenAI)', async () => {
    process.env.OPENAI_API_KEY = 'testkey';
    axios.post.mockResolvedValue({ data: { choices: [{ message: { content: '{"tool":"createData","params":{"type":"note","attributes":{"text":"from LLM exec"}}}' } }] } });
    const res = await request(app).post('/ask').set('x-api-key', KEY).send({ prompt: 'please create a note', useLLM: true, execute: true });
    expect(res.status).toBe(201);
    expect(res.body.result).toBeDefined();
    expect(res.body.result.attributes.text).toBe('from LLM exec');
  });
});
