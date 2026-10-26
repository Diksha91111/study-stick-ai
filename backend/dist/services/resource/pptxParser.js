"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PPTXParser = void 0;
const adm_zip_1 = __importDefault(require("adm-zip"));
const chunkingService_js_1 = require("./chunkingService.js");
class PPTXParser {
    /**
     * Parse PPTX presentation buffer into slides and structured slide chunks
     */
    static async parsePPTX(buffer) {
        let zip;
        try {
            zip = new adm_zip_1.default(buffer);
        }
        catch (e) {
            throw new Error('Unable to parse presentation archive. If this is a legacy .ppt file, please re-save as modern .pptx or export to PDF.');
        }
        const zipEntries = zip.getEntries();
        // Filter slide xml files: ppt/slides/slide1.xml, slide2.xml, etc.
        const slideEntries = zipEntries.filter((entry) => entry.entryName.match(/^ppt\/slides\/slide\d+\.xml$/i));
        if (slideEntries.length === 0) {
            throw new Error('No presentation slides found in this PPTX archive. The file may be empty or corrupted.');
        }
        // Sort slide entries numerically
        slideEntries.sort((a, b) => {
            const numA = parseInt(a.entryName.match(/\d+/)[0], 10);
            const numB = parseInt(b.entryName.match(/\d+/)[0], 10);
            return numA - numB;
        });
        const slideCount = slideEntries.length;
        const allChunks = [];
        let fullExtractedText = '';
        let globalChunkIndex = 0;
        for (let i = 0; i < slideEntries.length; i++) {
            const slideEntry = slideEntries[i];
            const slideNumber = i + 1;
            const xmlContent = slideEntry.getData().toString('utf8');
            // Extract text content inside <a:t>...</a:t>
            const textMatches = xmlContent.match(/<a:t[^>]*>([^<]+)<\/a:t>/gi) || [];
            const textLines = [];
            for (const match of textMatches) {
                const text = match.replace(/<\/?a:t[^>]*>/gi, '').trim();
                if (text) {
                    textLines.push(text);
                }
            }
            // Check for slide title (first text line usually acts as title)
            const slideTitle = textLines.length > 0 ? textLines[0] : `Slide ${slideNumber}`;
            const slideContent = textLines.join('\n');
            if (slideContent.trim()) {
                const slideHeader = `--- Slide ${slideNumber}: ${slideTitle} ---\n`;
                fullExtractedText += slideHeader + slideContent + '\n\n';
                const chunks = chunkingService_js_1.ChunkingService.splitIntoChunks(slideContent, {
                    chunkSize: 800,
                    chunkOverlap: 100,
                    slideNumber,
                    sectionTitle: `Slide ${slideNumber}: ${slideTitle}`,
                });
                for (const chunk of chunks) {
                    allChunks.push({
                        ...chunk,
                        chunkIndex: globalChunkIndex++,
                    });
                }
            }
        }
        if (!fullExtractedText.trim()) {
            throw new Error('The presentation does not contain any readable text. It may contain only embedded images.');
        }
        return {
            extractedText: fullExtractedText.trim(),
            chunks: allChunks,
            slideCount,
        };
    }
}
exports.PPTXParser = PPTXParser;
