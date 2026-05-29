import { test, expect, Page } from '@playwright/test';

const URL = 'http://localhost:4200';
const EMAIL = 'thiago.vinigo@gmail.com';
const PASSWORD = 'teste@1234';

async function login(page: Page) {
  await page.goto(URL);
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('http://localhost:4200/', { timeout: 15000 });
  await page.waitForSelector('text=Meus Projetos', { timeout: 10000 });
}

test('01 - Login e dashboard', async ({ page }) => {
  await login(page);
  await page.screenshot({ path: 'test-01-dashboard.png', fullPage: true });
  await expect(page.locator('text=Meus Projetos')).toBeVisible();
  console.log('PASS: Dashboard carregou com sucesso');
});

test('02 - Criar Projeto A e verificar area do projeto', async ({ page }) => {
  await login(page);
  const btnCriar = page.locator('button:has-text("Novo Projeto"), button:has-text("Criar primeiro projeto")').first();
  await btnCriar.click();
  await page.fill('input[type="text"]', 'Projeto A');
  await page.click('button:has-text("Criar")');
  await page.waitForURL('**/project/**', { timeout: 15000 });
  await page.screenshot({ path: 'test-02-projeto-a.png', fullPage: true });
  await expect(page.locator('text=Projeto A').first()).toBeVisible();
  await expect(page.locator('button:has-text("Analisar História")')).toBeVisible();
  await expect(page.locator('button:has-text("Importar Arquivos")')).toBeVisible();
  await expect(page.locator('text=Backlog vazio')).toBeVisible();
  console.log('PASS: Projeto A criado com backlog vazio');
});

test('03 - Analisador abre e botao Backlog volta', async ({ page }) => {
  await login(page);
  const card = page.locator('[class*="cursor-pointer"]').first();
  if (await card.count() === 0) {
    const btn = page.locator('button:has-text("Novo Projeto"), button:has-text("Criar primeiro projeto")').first();
    await btn.click();
    await page.fill('input[type="text"]', 'Projeto Teste');
    await page.click('button:has-text("Criar")');
    await page.waitForURL('**/project/**', { timeout: 15000 });
  } else {
    await card.click();
    await page.waitForURL('**/project/**', { timeout: 15000 });
  }
  await page.click('button:has-text("Analisar História")');
  await page.screenshot({ path: 'test-03a-analisador.png', fullPage: true });
  await expect(page.locator('text=IA Validadora')).toBeVisible();
  const btnBacklog = page.locator('button:has-text("Backlog")');
  await expect(btnBacklog).toBeVisible();
  console.log('PASS: Analisador abriu, botao Backlog visivel');
  await btnBacklog.click();
  await page.screenshot({ path: 'test-03b-volta-backlog.png', fullPage: true });
  await expect(page.locator('button:has-text("Analisar História")')).toBeVisible();
  console.log('PASS: Voltou ao backlog do projeto');
});

test('04 - Projeto B tem backlog isolado', async ({ page }) => {
  await login(page);
  await page.goto(URL);
  await page.waitForSelector('text=Meus Projetos');
  const btnCriar = page.locator('button:has-text("Novo Projeto"), button:has-text("Criar primeiro projeto")').first();
  await btnCriar.click();
  await page.fill('input[type="text"]', 'Projeto B');
  await page.click('button:has-text("Criar")');
  await page.waitForURL('**/project/**', { timeout: 15000 });
  await page.screenshot({ path: 'test-04-projeto-b.png', fullPage: true });
  await expect(page.locator('text=Backlog vazio')).toBeVisible();
  await expect(page.locator('text=Projeto B').first()).toBeVisible();
  console.log('PASS: Projeto B isolado com backlog vazio proprio');
});
