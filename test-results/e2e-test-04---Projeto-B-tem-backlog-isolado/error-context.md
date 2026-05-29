# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-test.spec.ts >> 04 - Projeto B tem backlog isolado
- Location: e2e-test.spec.ts:64:1

# Error details

```
TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
=========================== logs ===========================
waiting for navigation to "http://localhost:4200/" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - heading "PO Agent" [level=1] [ref=e7]
    - paragraph [ref=e8]: Valide e refine suas histórias com IA
  - generic [ref=e9]:
    - heading "Entrar" [level=2] [ref=e10]
    - generic [ref=e11]: Invalid login credentials
    - generic [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: E-mail
        - textbox "seu@email.com" [ref=e15]: thiago.vinigo@gmail.com
      - generic [ref=e16]:
        - generic [ref=e17]: Senha
        - textbox "••••••••" [ref=e18]: teste@1234
      - button "Entrar" [ref=e19] [cursor=pointer]
    - paragraph [ref=e20]:
      - text: Não tem conta?
      - link "Cadastre-se" [ref=e21] [cursor=pointer]:
        - /url: http://localhost:4200/register
```

# Test source

```ts
  1  | import { test, expect, Page } from '@playwright/test';
  2  | 
  3  | const URL = 'http://localhost:4200';
  4  | const EMAIL = 'thiago.vinigo@gmail.com';
  5  | const PASSWORD = 'teste@1234';
  6  | 
  7  | async function login(page: Page) {
  8  |   await page.goto(URL);
  9  |   await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  10 |   await page.fill('input[type="email"]', EMAIL);
  11 |   await page.fill('input[type="password"]', PASSWORD);
  12 |   await page.click('button[type="submit"]');
> 13 |   await page.waitForURL('http://localhost:4200/', { timeout: 15000 });
     |              ^ TimeoutError: page.waitForURL: Timeout 15000ms exceeded.
  14 |   await page.waitForSelector('text=Meus Projetos', { timeout: 10000 });
  15 | }
  16 | 
  17 | test('01 - Login e dashboard', async ({ page }) => {
  18 |   await login(page);
  19 |   await page.screenshot({ path: 'test-01-dashboard.png', fullPage: true });
  20 |   await expect(page.locator('text=Meus Projetos')).toBeVisible();
  21 |   console.log('PASS: Dashboard carregou com sucesso');
  22 | });
  23 | 
  24 | test('02 - Criar Projeto A e verificar area do projeto', async ({ page }) => {
  25 |   await login(page);
  26 |   const btnCriar = page.locator('button:has-text("Novo Projeto"), button:has-text("Criar primeiro projeto")').first();
  27 |   await btnCriar.click();
  28 |   await page.fill('input[type="text"]', 'Projeto A');
  29 |   await page.click('button:has-text("Criar")');
  30 |   await page.waitForURL('**/project/**', { timeout: 15000 });
  31 |   await page.screenshot({ path: 'test-02-projeto-a.png', fullPage: true });
  32 |   await expect(page.locator('text=Projeto A').first()).toBeVisible();
  33 |   await expect(page.locator('button:has-text("Analisar História")')).toBeVisible();
  34 |   await expect(page.locator('button:has-text("Importar Arquivos")')).toBeVisible();
  35 |   await expect(page.locator('text=Backlog vazio')).toBeVisible();
  36 |   console.log('PASS: Projeto A criado com backlog vazio');
  37 | });
  38 | 
  39 | test('03 - Analisador abre e botao Backlog volta', async ({ page }) => {
  40 |   await login(page);
  41 |   const card = page.locator('[class*="cursor-pointer"]').first();
  42 |   if (await card.count() === 0) {
  43 |     const btn = page.locator('button:has-text("Novo Projeto"), button:has-text("Criar primeiro projeto")').first();
  44 |     await btn.click();
  45 |     await page.fill('input[type="text"]', 'Projeto Teste');
  46 |     await page.click('button:has-text("Criar")');
  47 |     await page.waitForURL('**/project/**', { timeout: 15000 });
  48 |   } else {
  49 |     await card.click();
  50 |     await page.waitForURL('**/project/**', { timeout: 15000 });
  51 |   }
  52 |   await page.click('button:has-text("Analisar História")');
  53 |   await page.screenshot({ path: 'test-03a-analisador.png', fullPage: true });
  54 |   await expect(page.locator('text=IA Validadora')).toBeVisible();
  55 |   const btnBacklog = page.locator('button:has-text("Backlog")');
  56 |   await expect(btnBacklog).toBeVisible();
  57 |   console.log('PASS: Analisador abriu, botao Backlog visivel');
  58 |   await btnBacklog.click();
  59 |   await page.screenshot({ path: 'test-03b-volta-backlog.png', fullPage: true });
  60 |   await expect(page.locator('button:has-text("Analisar História")')).toBeVisible();
  61 |   console.log('PASS: Voltou ao backlog do projeto');
  62 | });
  63 | 
  64 | test('04 - Projeto B tem backlog isolado', async ({ page }) => {
  65 |   await login(page);
  66 |   await page.goto(URL);
  67 |   await page.waitForSelector('text=Meus Projetos');
  68 |   const btnCriar = page.locator('button:has-text("Novo Projeto"), button:has-text("Criar primeiro projeto")').first();
  69 |   await btnCriar.click();
  70 |   await page.fill('input[type="text"]', 'Projeto B');
  71 |   await page.click('button:has-text("Criar")');
  72 |   await page.waitForURL('**/project/**', { timeout: 15000 });
  73 |   await page.screenshot({ path: 'test-04-projeto-b.png', fullPage: true });
  74 |   await expect(page.locator('text=Backlog vazio')).toBeVisible();
  75 |   await expect(page.locator('text=Projeto B').first()).toBeVisible();
  76 |   console.log('PASS: Projeto B isolado com backlog vazio proprio');
  77 | });
  78 | 
```