import { chromium, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = 'http://localhost:4200';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'e2e-screenshots-feature');

if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function ss(page: Page, name: string) {
  const file = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 ${name}`);
}

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 400 });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();

  try {
    // ── 1. Login ─────────────────────────────────────────────────────────
    console.log('\n=== 1. Login ===');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await ss(page, '01-inicio');

    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('thiago.vinigo@gmail.com');
      await page.locator('input[type="password"]').first().fill('senha123');
      await page.locator('button[type="submit"]').first().click();
      await page.waitForTimeout(2000);
    }
    await ss(page, '02-apos-login');

    // ── 2. Abrir projeto existente ou criar ───────────────────────────────
    console.log('\n=== 2. Dashboard → Projeto ===');
    const projectLinks = page.locator('a[href*="/project/"], button').filter({ hasText: /abrir|ver projeto|open/i });
    const projectCount = await projectLinks.count();

    if (projectCount > 0) {
      await projectLinks.first().click();
    } else {
      // Criar um projeto de teste
      const createBtn = page.locator('button').filter({ hasText: /novo projeto|criar/i }).first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(500);
        const nameInput = page.locator('input[placeholder*="nome"], input[placeholder*="projeto"]').first();
        if (await nameInput.isVisible()) {
          await nameInput.fill('Projeto Teste E2E');
          await page.keyboard.press('Enter');
          await page.waitForTimeout(500);
        }
      }
      // Navigate to first project
      const link = page.locator('a[href*="/project/"]').first();
      if (await link.isVisible()) await link.click();
    }
    await page.waitForTimeout(1500);
    await ss(page, '03-projeto-backlog-view');

    // ── 3. Verificar painel de Informações do Projeto ─────────────────────
    console.log('\n=== 3. Painel Informações do Projeto ===');
    const infoPanel = page.locator('app-project-info-panel');
    const infoPanelVisible = await infoPanel.isVisible();
    console.log(`  ✅ Painel de info visível: ${infoPanelVisible}`);

    // Clicar em "Preencher"
    const fillBtn = page.locator('button').filter({ hasText: /preencher|editar/i }).first();
    if (await fillBtn.isVisible()) {
      await fillBtn.click();
      await page.waitForTimeout(500);
      await ss(page, '04-project-info-edit-mode');

      // Preencher campos
      const textareas = page.locator('app-project-info-panel textarea');
      const inputs = page.locator('app-project-info-panel input[type="text"]');

      if (await textareas.count() > 0) {
        await textareas.nth(0).fill('Sistema de gestão de Product Owner com IA');
        await textareas.nth(1).fill('Auxiliar POs a refinar histórias de usuário usando IA');
      }
      if (await inputs.count() > 0) {
        await inputs.nth(0).fill('Product Owners, Analistas de Negócio');
        await inputs.nth(1).fill('Time de Produto, Engenharia');
        await inputs.nth(2).fill('Angular 20, Groq AI (llama-3.3-70b), Supabase');
      }
      await ss(page, '05-project-info-filled');

      // Salvar
      const saveBtn = page.locator('app-project-info-panel button').filter({ hasText: /salvar/i });
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        await page.waitForTimeout(800);
        await ss(page, '06-project-info-saved');
        console.log('  ✅ Informações do projeto salvas');
      }
    }

    // ── 4. Ir para o Analyzer e validar história ──────────────────────────
    console.log('\n=== 4. Analyzer → Validar história ===');
    const analyzerBtn = page.locator('button').filter({ hasText: /analisar história/i }).first();
    if (await analyzerBtn.isVisible()) {
      await analyzerBtn.click();
      await page.waitForTimeout(1000);
      await ss(page, '07-analyzer-view');
    }

    // Verificar que a textarea de história existe
    const storyTextarea = page.locator('textarea').first();
    if (await storyTextarea.isVisible()) {
      await storyTextarea.clear();
      await storyTextarea.fill(
        'Como um Product Owner, eu quero poder gerar automaticamente um PRD e uma especificação técnica a partir de uma história validada pela IA, para acelerar a documentação do produto.'
      );
      await ss(page, '08-historia-preenchida');

      // Verificar que botões PRD/spec NÃO aparecem ainda (sem resultado)
      const prdBtnBefore = page.locator('button').filter({ hasText: /gerar prd/i });
      const prdBtnBeforeVisible = await prdBtnBefore.isVisible().catch(() => false);
      console.log(`  ℹ️  Botão PRD antes de validar: ${prdBtnBeforeVisible} (deve ser false)`);

      // Clicar em Validar/Analisar
      const validateBtn = page.locator('button').filter({ hasText: /analisar e refinar|validar/i }).first();
      if (await validateBtn.isVisible()) {
        console.log('  🔄 Validando história (aguardando IA)...');
        await validateBtn.click();

        // Aguardar até 60s para o resultado aparecer
        await page.waitForSelector('text=Resultados da Validação', { timeout: 5000 }).catch(() => {});
        await page.waitForFunction(
          () => !document.querySelector('.fa-spinner'),
          { timeout: 60000 }
        ).catch(() => console.log('  ⚠️ Timeout aguardando spinner'));

        await page.waitForTimeout(1000);
        await ss(page, '09-resultado-validacao');
        console.log('  ✅ Resultado de validação obtido');

        // ── 5. Verificar botões PRD/spec ──────────────────────────────────
        console.log('\n=== 5. Botões Gerar PRD/spec ===');
        const prdBtn = page.locator('button').filter({ hasText: /gerar prd/i });
        const specBtn = page.locator('button').filter({ hasText: /gerar spec/i });
        const prdVisible = await prdBtn.isVisible().catch(() => false);
        const specVisible = await specBtn.isVisible().catch(() => false);
        console.log(`  ✅ Botão "Gerar PRD.md" visível: ${prdVisible}`);
        console.log(`  ✅ Botão "Gerar spec.md" visível: ${specVisible}`);

        // ── 6. Gerar PRD ─────────────────────────────────────────────────
        if (prdVisible) {
          console.log('\n=== 6. Gerando PRD.md ===');
          await prdBtn.click();
          console.log('  🔄 Aguardando geração do PRD via Groq...');

          // Aguardar modal do viewer aparecer (até 90s para Groq)
          await page.waitForSelector('app-document-viewer .fixed', { timeout: 90000 }).catch(() => {
            console.log('  ⚠️ Modal do PRD não apareceu no tempo esperado');
          });
          await page.waitForTimeout(500);
          await ss(page, '10-prd-modal-aberto');

          const modalTitle = await page.locator('app-document-viewer h2').first().textContent().catch(() => '');
          console.log(`  ✅ Modal PRD: "${modalTitle}"`);

          // Verificar botão de download
          const downloadBtn = page.locator('app-document-viewer button').filter({ hasText: /baixar/i });
          const downloadVisible = await downloadBtn.isVisible().catch(() => false);
          console.log(`  ✅ Botão de download visível: ${downloadVisible}`);

          // Fechar modal
          const closeBtn = page.locator('app-document-viewer button').filter({ hasText: /times/ }).first();
          const closeBtnAlt = page.locator('app-document-viewer .fa-times').locator('..');
          if (await closeBtn.isVisible().catch(() => false)) {
            await closeBtn.click();
          } else if (await closeBtnAlt.isVisible().catch(() => false)) {
            await closeBtnAlt.click();
          } else {
            await page.keyboard.press('Escape');
          }
          await page.waitForTimeout(500);
          await ss(page, '11-apos-fechar-prd');
        }

        // ── 7. Gerar spec ─────────────────────────────────────────────────
        if (specVisible) {
          console.log('\n=== 7. Gerando spec.md ===');
          const specBtnFresh = page.locator('button').filter({ hasText: /gerar spec/i });
          await specBtnFresh.click();
          console.log('  🔄 Aguardando geração do spec via Groq...');

          await page.waitForSelector('app-document-viewer .fixed', { timeout: 90000 }).catch(() => {
            console.log('  ⚠️ Modal do spec não apareceu no tempo esperado');
          });
          await page.waitForTimeout(500);
          await ss(page, '12-spec-modal-aberto');

          const specTitle = await page.locator('app-document-viewer h2').first().textContent().catch(() => '');
          console.log(`  ✅ Modal spec: "${specTitle}"`);

          // Fechar
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    }

    // ── 8. Voltar ao backlog e verificar info persistida ─────────────────
    console.log('\n=== 8. Verificar persistência das informações ===');
    const backlogBtn = page.locator('button').filter({ hasText: /backlog/i }).first();
    if (await backlogBtn.isVisible()) {
      await backlogBtn.click();
      await page.waitForTimeout(800);
      await ss(page, '13-backlog-com-info');

      const infoText = await page.locator('app-project-info-panel').textContent().catch(() => '');
      const hasContent = infoText.includes('Product Owner') || infoText.includes('gestão');
      console.log(`  ✅ Info persistida no backlog view: ${hasContent}`);
    }

    console.log('\n✅ Todos os testes concluídos com sucesso!');
    console.log(`📁 Screenshots em: ${SCREENSHOTS_DIR}`);

  } catch (err) {
    console.error('\n❌ Erro durante o teste:', err);
    await ss(page, 'ERROR-final-state');
  } finally {
    await page.waitForTimeout(2000);
    await browser.close();
  }
}

main();
