import AdmZip from 'adm-zip';
import { IResourceChunk } from '../../models/StudyResource.js';
import { ChunkingService } from './chunkingService.js';

export interface DocumentParseResult {
  extractedText: string;
  chunks: IResourceChunk[];
}

export class DocumentParser {
  /**
   * Parse DOCX or plain text buffer into structured text and chunks
   */
  static async parseDocument(
    buffer: Buffer,
    filename: string
  ): Promise<DocumentParseResult> {
    const ext = filename.split('.').pop()?.toLowerCase();

    if (ext === 'txt') {
      const text = buffer.toString('utf8').trim();
      if (!text) {
        throw new Error('Text document is empty.');
      }
      const chunks = ChunkingService.splitIntoChunks(text, {
        chunkSize: 800,
        chunkOverlap: 120,
      });
      return { extractedText: text, chunks };
    }

    if (ext === 'doc') {
      throw new Error(
        'Legacy binary .doc format is not supported. Please open and save as modern .docx or export to PDF before uploading.'
      );
    }

    if (ext === 'docx') {
      let zip: AdmZip;
      try {
        zip = new AdmZip(buffer);
      } catch (e) {
        throw new Error(
          'Corrupted or invalid DOCX archive. Please verify the document opens properly.'
        );
      }

      const docEntry = zip.getEntry('word/document.xml');
      if (!docEntry) {
        throw new Error('Invalid DOCX format: word/document.xml entry missing.');
      }

      const xml = docEntry.getData().toString('utf8');

      // Extract paragraphs: <w:p>...</w:p>
      const paragraphMatches = xml.match(/<w:p\b[^>]*>.*?<\/w:p>/gis) || [];
      const paragraphs: string[] = [];

      for (const pXml of paragraphMatches) {
        // Extract all text tokens in paragraph: <w:t>...</w:t>
        const textTokens = pXml.match(/<w:t\b[^>]*>(.*?)<\/w:t>/gis) || [];
        const pText = textTokens
          .map((t) => t.replace(/<\/?w:t\b[^>]*>/gis, ''))
          .join('')
          .trim();

        if (pText) {
          paragraphs.push(pText);
        }
      }

      const fullText = paragraphs.join('\n\n');
      if (!fullText.trim()) {
        throw new Error('Document contains no readable text.');
      }

      const chunks = ChunkingService.splitIntoChunks(fullText, {
        chunkSize: 800,
        chunkOverlap: 120,
      });

      return {
        extractedText: fullText,
        chunks,
      };
    }

    throw new Error(`Unsupported document extension .${ext}`);
  }
}
