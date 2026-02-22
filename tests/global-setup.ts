import { request } from '@playwright/test';

const PB_URL = process.env['PB_URL'] ?? 'http://localhost:8080';
const TEST_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
const TEST_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'testpassword123';

export default async function globalSetup(): Promise<void> {
  const api = await request.newContext({ baseURL: PB_URL });

  const authRes = await api.post('/api/collections/users/auth-with-password', {
    data: { identity: TEST_EMAIL, password: TEST_PASSWORD },
  });

  if (!authRes.ok()) {
    const createRes = await api.post('/api/collections/users/records', {
      data: { email: TEST_EMAIL, password: TEST_PASSWORD, passwordConfirm: TEST_PASSWORD },
    });
    if (!createRes.ok()) {
      throw new Error(`Failed to create test user: ${await createRes.text()}`);
    }
  }

  await api.dispose();
}
