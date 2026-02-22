import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env['TEST_USER_EMAIL'] ?? 'test@example.com';
const TEST_PASSWORD = process.env['TEST_USER_PASSWORD'] ?? 'testpassword123';

test.describe('Login', () => {
  test('redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email', { exact: true }).fill('wrong@example.com');
    await page.getByLabel('Password', { exact: true }).fill('wrongpassword');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
  });

  test('redirects to todo list on valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Todo List' })).toBeVisible();
  });
});

test.describe('Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
    await page.getByLabel('Email', { exact: true }).fill(TEST_EMAIL);
    await page.getByLabel('Password', { exact: true }).fill(TEST_PASSWORD);
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page).toHaveURL('/');
  });

  test('sign out button redirects to login page', async ({ page }) => {
    await page.getByTestId('sign-out').click();
    await expect(page).toHaveURL('/auth/login');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('after sign out, navigating to / redirects to login', async ({ page }) => {
    await page.getByTestId('sign-out').click();
    await page.goto('/');
    await expect(page).toHaveURL('/auth/login');
  });
});
