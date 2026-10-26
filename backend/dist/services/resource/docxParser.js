"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentParser = void 0;
const adm_zip_1 = __importDefault(require("adm-zip"));
const chunkingService_js_1 = require("./chunkingService.js");
class DocumentParser {
    /**
     * Parse DOCX or plain text buffer into structured text and chunks
     */
    static async parseDocument(buffer, filename) {
        const ext = filename.split('.').pop()?.toLowerCase();
        if (ext === 'txt') {
            const text = buffer.toString('utf8').trim();
            if (!text) {
                throw new Error('Text document is empty.');
            }
            const chunks = chunkingService_js_1.ChunkingService.splitIntoChunks(text, {
                chunkSize: 800,
                chunkOverlap: 120,
            });
            return { extractedText: text, chunks };
        }
        if (ext === 'doc') {
            throw new Error('Legacy binary .doc format is not supported. Please open and save as modern .docx or export to PDF before uploading.');
        }
        if (ext === 'docx') {
            let zip;
            try {
                zip = new adm_zip_1.default(buffer);
            }
            catch (e) {
                throw new Error('Corrupted or invalid DOCX archive. Please verify the document opens properly.');
            }
            const docEntry = zip.getEntry('word/document.xml');
            if (!docEntry) {
                throw new Error('Invalid DOCX format: word/document.xml entry missing.');
            }
            const xml = docEntry.getData().toString('utf8');
            // Extract paragraphs: <w:p>...</w:p>
            const paragraphMatches = xml.match(/<w:p\b[^>]*>.*?<\/w:p>/gis) || [];
            const paragraphs = [];
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
            const chunks = chunkingService_js_1.ChunkingService.splitIntoChunks(fullText, {
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
exports.DocumentParser = DocumentParser;
