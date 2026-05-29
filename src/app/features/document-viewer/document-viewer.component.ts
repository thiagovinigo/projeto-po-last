import { ChangeDetectionStrategy, Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

declare var marked: any;

export interface GeneratedDocument {
  kind: 'prd' | 'spec';
  title: string;
  filename: string;
  markdown: string;
}

@Component({
  selector: 'app-document-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DocumentViewerComponent {
  doc = input<GeneratedDocument | null>(null);
  download = output<void>();
  close = output<void>();

  private sanitizer = inject(DomSanitizer);

  renderedHtml = computed<SafeHtml>(() => {
    const d = this.doc();
    if (!d) return this.sanitizer.bypassSecurityTrustHtml('');
    return this.markdownToHtml(d.markdown);
  });

  private markdownToHtml(content: string): SafeHtml {
    if (!content) return this.sanitizer.bypassSecurityTrustHtml('');
    if (typeof marked === 'undefined') {
      const escaped = new Option(content).innerHTML;
      return this.sanitizer.bypassSecurityTrustHtml(escaped.replace(/\n/g, '<br>'));
    }
    const rawHtml = marked.parse(content, { gfm: true, breaks: true });
    return this.sanitizer.bypassSecurityTrustHtml(rawHtml);
  }
}
