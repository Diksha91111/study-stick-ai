"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PDFParser = void 0;
const pdf_parse_1 = require("pdf-parse");
const chunkingService_js_1 = require("./chunkingService.js");
class PDFParser {
    /**
     * Parse PDF buffer into text and structured page chunks
     */
    static async parsePDF(buffer) {
        try {
            const parser = new pdf_parse_1.PDFParse({ data: buffer });
            const parseResult = await parser.getText();
            const pageCount = parseResult.total || parseResult.pages?.length || 1;
            const fullText = (parseResult.text || '').trim();
            // Check if scanned or image-only PDF
            const isScannedOrImageOnly = fullText.length < 50 && pageCount > 0;
            if (isScannedOrImageOnly) {
                throw new Error('Scanned or image-only PDF detected with no readable text layer. Please use a text-based document or upload page images directly.');
            }
            // Generate structured chunks preserving page numbers
            const allChunks = [];
            let globalChunkIndex = 0;
            if (parseResult.pages && parseResult.pages.length > 0) {
                for (const pageItem of parseResult.pages) {
                    const pageNum = pageItem.num || 1;
                    const pageText = (pageItem.text || '').trim();
                    if (!pageText)
                        continue;
                    const pageChunks = chunkingService_js_1.ChunkingService.splitIntoChunks(pageText, {
                        chunkSize: 800,
                        chunkOverlap: 120,
                        pageNumber: pageNum,
                        sectionTitle: `Page ${pageNum}`,
                    });
                    for (const c of pageChunks) {
                        allChunks.push({
                            ...c,
                            chunkIndex: globalChunkIndex++,
                        });
                    }
                }
            }
            else {
                const fallbackChunks = chunkingService_js_1.ChunkingService.splitIntoChunks(fullText, {
                    chunkSize: 800,
                    chunkOverlap: 120,
                });
                allChunks.push(...fallbackChunks);
            }
            return {
                extractedText: fullText,
                chunks: allChunks,
                pageCount,
                isScannedOrImageOnly: false,
            };
        }
        catch (err) {
            if (err.message && err.message.includes('Scanned or image-only')) {
                throw err;
            }
            if (err.message &&
                (err.message.toLowerCase().includes('password') || err.name === 'PasswordException')) {
                throw new Error('Encrypted or password-protected PDF cannot be read.');
            }
            throw new Error(`PDF extraction failed: ${err.message || 'Corrupted or unreadable PDF'}`);
        }
    }
}
exports.PDFParser = PDFParser;
