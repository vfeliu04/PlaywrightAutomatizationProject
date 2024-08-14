import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://www.auto-ecole-pittet.ch/cours?gad_source=1&gclid=EAIaIQobChMI6vLOqL7lhwMVCZGDBx1xqSYAEAAYASAAEgKYt_D_BwE');
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await page.waitForTimeout(3000)
  await page.locator('#email').fill('vicentemariafeliu@gmail.com');
  await page.getByLabel('Mot de passe', { exact: true }).click();
  await page.getByLabel('Mot de passe', { exact: true }).fill('vmfeliu1');
  await page.waitForTimeout(3000)
  await page.getByRole('button', { name: 'Connexion' }).click();
  await page.waitForTimeout(3000)
  await page.getByTitle('Mes rendez-vous').getByRole('button').click();
  await page.waitForTimeout(3000)
});