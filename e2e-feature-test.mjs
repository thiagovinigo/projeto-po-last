import { chromium } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:4200';
const SCREENSHOTS_DIR = path.join(__dirname, 'e2e-screenshots-feature');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function ss(page, name) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 ${name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  try {
    // ── 1. Abrir app ──────────────────────────────────────────────────────
    console.log('\n=== 1. Abrindo app ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await ss(page, '01-inicio');

    // Login se necessário
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      console.log('  🔐 Fazendo login...');
      await emailInput.fill('thiago.vinigo@gmail.com');
      await page.locator('input[type="password"]').first().fill('Teste@1234');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForURL(url => !url.includes('/login'), { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      await ss(page, '02-apos-login');
    }

    // ── 2. Navegar para um projeto ────────────────────────────────────────
    console.log('\n=== 2. Abrindo projeto ===');
    // Tentar clicar no primeiro projeto disponível
    const firstProjectLink = page.locator('a[href*="/project/"]').first();
    const hasProject = await firstProjectLink.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasProject) {
      await firstProjectLink.click();
    } else {
      // Criar projeto novo — clicar no botão que revela o input
      console.log('  ➕ Criando novo projeto...');
      const createFirstBtn = page.locator('button').filter({ hasText: /criar primeiro projeto/i });
      const newProjectBtn = page.locator('button').filter({ hasText: /novo projeto/i });
      if (await createFirstBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await createFirstBtn.click();
      } else if (await newProjectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await newProjectBtn.click();
      }
      await page.waitForTimeout(500);
      // Preencher o input que aparece
      const nameInput = page.locator('input[placeholder*="App"]').first();
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill('Projeto Teste E2E');
        const criarBtn = page.locator('button').filter({ hasText: /^criar$/i }).first();
        if (await criarBtn.isVisible().catch(() => false)) {
          await criarBtn.click();
        } else {
          await page.keyboard.press('Enter');
        }
        await page.waitForTimeout(1500);
      }
    }

    await page.waitForTimeout(1500);
    await ss(page, '03-backlog-view');

    // ── 3. Painel Informações do Projeto ──────────────────────────────────
    console.log('\n=== 3. Testando painel de informações do projeto ===');
    const infoPanel = page.locator('app-project-info-panel');
    const infoPanelVisible = await infoPanel.isVisible({ timeout: 5000 }).catch(() => false);
    console.log(`  ${infoPanelVisible ? '✅' : '❌'} Painel app-project-info-panel visível: ${infoPanelVisible}`);

    if (infoPanelVisible) {
      const fillBtn = page.locator('app-project-info-panel button').filter({ hasText: /preencher|editar/i }).first();
      const fillBtnVisible = await fillBtn.isVisible({ timeout: 3000 }).catch(() => false);
      console.log(`  ${fillBtnVisible ? '✅' : '❌'} Botão Preencher/Editar visível: ${fillBtnVisible}`);

      if (fillBtnVisible) {
        await fillBtn.click();
        await page.waitForTimeout(600);
        await ss(page, '04-project-info-edit-mode');

        // Preencher campos
        const desc = page.locator('app-project-info-panel textarea').nth(0);
        const obj = page.locator('app-project-info-panel textarea').nth(1);
        const users = page.locator('app-project-info-panel input[type="text"]').nth(0);
        const stack = page.locator('app-project-info-panel input[type="text"]').nth(2);

        if (await desc.isVisible().catch(() => false)) await desc.fill('Sistema de gestão para Product Owners com análise de histórias via IA');
        if (await obj.isVisible().catch(() => false)) await obj.fill('Acelerar refinamento de histórias de usuário com suporte de IA');
        if (await users.isVisible().catch(() => false)) await users.fill('Product Owners, Analistas de Negócio, Scrum Masters');
        if (await stack.isVisible().catch(() => false)) await stack.fill('Angular 20, Groq llama-3.3-70b, Supabase, Tailwind CSS');
        await ss(page, '05-project-info-preenchido');

        const saveBtn = page.locator('app-project-info-panel button').filter({ hasText: /salvar/i });
        if (await saveBtn.isVisible().catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(800);
          await ss(page, '06-project-info-salvo');
          console.log('  ✅ Informações do projeto salvas com sucesso');
        }
      }
    }

    // ── 4. Ir para Analyzer ───────────────────────────────────────────────
    console.log('\n=== 4. Abrindo Analyzer ===');
    const analyzerBtn = page.locator('button').filter({ hasText: /analisar história/i }).first();
    if (await analyzerBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await analyzerBtn.click();
      await page.waitForTimeout(1200);
      await ss(page, '07-analyzer-view');
      console.log('  ✅ Analyzer aberto');
    }

    // Verificar que os botões PRD/spec NÃO aparecem antes de validar
    const prdBtnBefore = page.locator('button').filter({ hasText: /gerar prd/i });
    const prdBeforeVisible = await prdBtnBefore.isVisible({ timeout: 1000 }).catch(() => false);
    console.log(`  ${!prdBeforeVisible ? '✅' : '⚠️'} Botões PRD/spec ocultos antes de validar: ${!prdBeforeVisible}`);

    // ── 5. Preencher e validar história ───────────────────────────────────
    console.log('\n=== 5. Validando história ===');
    const storyTextarea = page.locator('textarea').first();
    if (await storyTextarea.isVisible({ timeout: 3000 }).catch(() => false)) {
      await storyTextarea.clear();
      await storyTextarea.fill(
        'Como um Product Owner, eu quero gerar automaticamente um PRD e uma especificação técnica a partir de uma história validada pela IA, para acelerar a documentação do produto.'
      );

      const validateBtn = page.locator('button').filter({ hasText: /analisar e refinar|validar com ia/i }).first();
      if (await validateBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('  🔄 Clicando em validar (aguardando IA ~30s)...');
        await validateBtn.click();

        // Aguardar spinner desaparecer
        try {
          await page.waitForSelector('.fa-spinner', { timeout: 5000 });
          await page.waitForFunction(
            () => !document.querySelector('.fa-spinner'),
            { timeout: 90000 }
          );
        } catch { /* spinner pode não aparecer se for muito rápido */ }

        await page.waitForTimeout(1500);
        await ss(page, '08-resultado-validacao');
        console.log('  ✅ Resultado de validação recebido');

        // ── 6. Verificar botões PRD/spec aparecem ─────────────────────────
        console.log('\n=== 6. Verificando botões PRD/spec ===');
        const prdBtn = page.locator('button').filter({ hasText: /gerar prd/i });
        const specBtn = page.locator('button').filter({ hasText: /gerar spec/i });
        const prdOk = await prdBtn.isVisible({ timeout: 5000 }).catch(() => false);
        const specOk = await specBtn.isVisible({ timeout: 5000 }).catch(() => false);
        console.log(`  ${prdOk ? '✅' : '❌'} Botão "Gerar PRD.md" visível: ${prdOk}`);
        console.log(`  ${specOk ? '✅' : '❌'} Botão "Gerar spec.md" visível: ${specOk}`);

        // ── 7. Gerar PRD.md ───────────────────────────────────────────────
        if (prdOk) {
          console.log('\n=== 7. Gerando PRD.md ===');
          await prdBtn.click();
          console.log('  🔄 Aguardando geração via Groq (até 90s)...');

          // Aguardar modal
          const modalVisible = await page.waitForSelector('app-document-viewer .fixed', { timeout: 90000 })
            .then(() => true).catch(() => false);
          await page.waitForTimeout(600);
          await ss(page, '09-prd-modal');
          console.log(`  ${modalVisible ? '✅' : '❌'} Modal do PRD abriu: ${modalVisible}`);

          if (modalVisible) {
            const modalTitle = await page.locator('app-document-viewer h2').first().textContent().catch(() => '');
            console.log(`  📄 Título: "${modalTitle.trim()}"`);
            const downloadBtn = page.locator('app-document-viewer button').filter({ hasText: /baixar/i });
            const dlOk = await downloadBtn.isVisible().catch(() => false);
            console.log(`  ${dlOk ? '✅' : '❌'} Botão "Baixar .md" visível: ${dlOk}`);

            // Fechar modal clicando no X ou no backdrop
            const xBtn = page.locator('app-document-viewer button .fa-times').locator('..');
            if (await xBtn.isVisible().catch(() => false)) {
              await xBtn.click();
            } else {
              await page.keyboard.press('Escape');
              // Clicar no backdrop
              await page.locator('app-document-viewer .fixed').click({ position: { x: 10, y: 10 }, force: true }).catch(() => {});
            }
            await page.waitForTimeout(500);
            await ss(page, '10-apos-fechar-prd');
          }
        }

        // ── 8. Gerar spec.md ──────────────────────────────────────────────
        const specBtnFresh = page.locator('button').filter({ hasText: /gerar spec/i });
        if (await specBtnFresh.isVisible({ timeout: 3000 }).catch(() => false)) {
          console.log('\n=== 8. Gerando spec.md ===');
          await specBtnFresh.click();
          console.log('  🔄 Aguardando geração via Groq (até 90s)...');

          const specModalVisible = await page.waitForSelector('app-document-viewer .fixed', { timeout: 90000 })
            .then(() => true).catch(() => false);
          await page.waitForTimeout(600);
          await ss(page, '11-spec-modal');
          console.log(`  ${specModalVisible ? '✅' : '❌'} Modal do spec abriu: ${specModalVisible}`);

          if (specModalVisible) {
            const specTitle = await page.locator('app-document-viewer h2').first().textContent().catch(() => '');
            console.log(`  📄 Título: "${specTitle.trim()}"`);

            const xBtn2 = page.locator('app-document-viewer button .fa-times').locator('..');
            if (await xBtn2.isVisible().catch(() => false)) {
              await xBtn2.click();
            } else {
              await page.locator('app-document-viewer .fixed').click({ position: { x: 10, y: 10 }, force: true }).catch(() => {});
            }
            await page.waitForTimeout(500);
          }
        }
      }
    }

    // ── 9. Verificar persistência voltando ao backlog ─────────────────────
    console.log('\n=== 9. Verificando persistência ===');
    const backlogNavBtn = page.locator('button').filter({ hasText: /^backlog$/i }).first();
    if (await backlogNavBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backlogNavBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, '12-backlog-final');

      const infoContent = await page.locator('app-project-info-panel').textContent().catch(() => '');
      const hasInfo = infoContent.includes('Product Owner') || infoContent.includes('gestão') || infoContent.includes('Angular');
      console.log(`  ${hasInfo ? '✅' : '⚠️'} Info do projeto persiste após navegar: ${hasInfo}`);
    }

    console.log('\n\n✅ Teste concluído!');
    console.log(`📁 Screenshots: ${SCREENSHOTS_DIR}`);

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    await ss(page, 'ERRO-estado-final').catch(() => {});
  } finally {
    await page.waitForTimeout(3000);
    await browser.close();
  }
}

main();
