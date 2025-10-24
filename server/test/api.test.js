const request = require('supertest');
const app = require('../index');

describe('MCP server basic CRUD', () => {
  let created;

  test('GET /tools returns array', async () => {
    const res = await request(app).get('/tools');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('POST /data creates record', async () => {
    const res = await request(app).post('/data').send({ type: 'note', attributes: { text: 'hi' } });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    created = res.body;
  });

  test('GET /data/:id returns record', async () => {
    const res = await request(app).get(`/data/${created.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
  });

  test('PUT /data/:id updates record', async () => {
    const res = await request(app).put(`/data/${created.id}`).send({ attributes: { text: 'updated' } });
    expect(res.status).toBe(200);
    expect(res.body.attributes.text).toBe('updated');
  });

  test('DELETE /data/:id deletes record', async () => {
    const res = await request(app).delete(`/data/${created.id}`);
    expect(res.status).toBe(204);
    const res2 = await request(app).get(`/data/${created.id}`);
    expect(res2.status).toBe(404);
  });
});
