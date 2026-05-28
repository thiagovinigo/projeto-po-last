import { Injectable } from '@angular/core';

const MAX_FILE_SIZE_MB = 5;
const MAX_PDF_PAGES = 50;

@Injectable({ providedIn: 'root' })
export class DocumentService {

  async extractTextFromFile(file: File): Promise<string> {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      throw new Error(`O arquivo '${file.name}' excede o limite de ${MAX_FILE_SIZE_MB}MB.`);
    }

    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return this.extractTextFromPdf(file);
    } else if (extension === 'doc' || extension === 'docx') {
      return this.extractTextFromDocx(file);
    } else if (extension === 'txt' || extension === 'md' || extension === 'csv') {
      return file.text();
    } else {
      throw new Error(`Formato não suportado: .${extension}. Use PDF, DOCX, TXT, MD ou CSV.`);
    }
  }

  private async extractTextFromPdf(file: File): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const numPages = Math.min(pdf.numPages, MAX_PDF_PAGES);
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = (textContent.items as any[])
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('[DocumentService] Erro ao extrair PDF:', error);
      throw new Error('Falha ao ler o PDF. O arquivo pode estar corrompido ou protegido.');
    }
  }

  private async extractTextFromDocx(file: File): Promise<string> {
    try {
      const mammoth = await import('mammoth');
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value.trim();
    } catch (error) {
      console.error('[DocumentService] Erro ao extrair DOCX:', error);
      throw new Error('Falha ao ler o documento Word.');
    }
  }
}
