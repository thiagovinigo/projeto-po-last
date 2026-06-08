import { Injectable } from '@angular/core';
import * as mammoth from 'mammoth/mammoth.browser.js';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  async extractTextFromFile(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return this.extractTextFromPdf(file);
    } else if (extension === 'doc' || extension === 'docx') {
      return this.extractTextFromDocx(file);
    } else if (extension === 'txt' || extension === 'md' || extension === 'csv') {
      return file.text();
    } else {
      throw new Error(`Formato não suportado: .${extension}. Use PDF, DOCX, TXT ou MD.`);
    }
  }

  private async extractTextFromPdf(file: File): Promise<string> {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      const numPages = Math.min(pdf.numPages, 50);
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }
      return fullText.trim();
    } catch (error) {
      console.error('Erro ao extrair PDF:', error);
      throw new Error('Falha ao ler o PDF. O arquivo pode estar corrompido ou protegido.');
    }
  }

  private async extractTextFromDocx(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (!result.value?.trim()) {
        throw new Error('O documento Word não contém texto legível.');
      }
      return result.value.trim();
    } catch (error) {
      console.error('Erro ao extrair Word:', error);
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      throw new Error(`Falha ao ler o documento Word: ${msg}`);
    }
  }
}
