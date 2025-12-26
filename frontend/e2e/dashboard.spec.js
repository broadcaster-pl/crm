import { test, expect } from '@playwright/test';

test('dashboard loads and basic navigation works', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('StreamFlow')).toBeVisible();
  await expect(page.getByText('Wykryte wydarzenia')).toBeVisible();

  await page.getByRole('button', { name: 'Events' }).click();
  await expect(page.getByPlaceholder('Szukaj wydarzeń...')).toBeVisible();
});
