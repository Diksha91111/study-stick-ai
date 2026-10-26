"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChunkingService = void 0;
class ChunkingService {
    /**
     * Split plain text into overlapping chunks
     */
    static splitIntoChunks(text, options = {}) {
        const { chunkSize = 800, chunkOverlap = 150, pageNumber, slideNumber, sectionTitle, } = options;
        const cleaned = text.replace(/\r\n/g, '\n').replace(/\t/g, ' ').trim();
        if (!cleaned)
            return [];
        // If text is smaller than chunkSize, return single chunk
        if (cleaned.length <= chunkSize) {
            return [
                {
                    chunkIndex: 0,
                    text: cleaned,
                    pageNumber,
                    slideNumber,
                    sectionTitle,
                },
            ];
        }
        const chunks = [];
        let start = 0;
        let chunkIndex = 0;
        while (start < cleaned.length) {
            let end = start + chunkSize;
            if (end >= cleaned.length) {
                end = cleaned.length;
            }
            else {
                // Try to break at paragraph or sentence boundary
                const naturalBreak = cleaned.lastIndexOf('\n', end);
                if (naturalBreak > start + chunkSize / 2) {
                    end = naturalBreak;
                }
                else {
                    const sentenceBreak = cleaned.lastIndexOf('. ', end);
                    if (sentenceBreak > start + chunkSize / 2) {
                        end = sentenceBreak + 1;
                    }
                }
            }
            const chunkText = cleaned.substring(start, end).trim();
            if (chunkText.length > 0) {
                chunks.push({
                    chunkIndex,
                    text: chunkText,
                    pageNumber,
                    slideNumber,
                    sectionTitle,
                });
                chunkIndex++;
            }
            if (end >= cleaned.length)
                break;
            start = Math.max(start + 1, end - chunkOverlap);
        }
        return chunks;
    }
    /**
     * Search and retrieve the most relevant chunks for a user query
     */
    static findRelevantChunks(query, allChunks, maxChunks = 5) {
        if (!query || allChunks.length === 0) {
            return allChunks.slice(0, maxChunks);
        }
        const queryTerms = query
            .toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter((term) => term.length > 2);
        // If query mentions "page X" or "slide Y", prioritize matching page/slide chunks!
        const pageMatch = query.match(/\bpage\s*(\d+)\b/i);
        const requestedPage = pageMatch ? parseInt(pageMatch[1], 10) : null;
        const slideMatch = query.match(/\bslide\s*(\d+)\b/i);
        const requestedSlide = slideMatch ? parseInt(slideMatch[1], 10) : null;
        const scored = allChunks.map((chunk) => {
            let score = 0;
            const lowerText = chunk.text.toLowerCase();
            // Explicit page/slide targeting bonus
            if (requestedPage !== null && chunk.pageNumber === requestedPage) {
                score += 50;
            }
            if (requestedSlide !== null && chunk.slideNumber === requestedSlide) {
                score += 50;
            }
            // Keyword frequency matching
            for (const term of queryTerms) {
                const regex = new RegExp(`\\b${term}\\b`, 'g');
                const matches = lowerText.match(regex);
                if (matches) {
                    score += matches.length * 3;
                }
                else if (lowerText.includes(term)) {
                    score += 1;
                }
            }
            return { chunk, score };
        });
        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);
        // If top scored has positive score, return top ones; otherwise return representative initial chunks
        const topScored = scored.filter((s) => s.score > 0);
        if (topScored.length > 0) {
            return topScored.slice(0, maxChunks).map((s) => s.chunk);
        }
        return allChunks.slice(0, maxChunks);
    }
}
exports.ChunkingService = ChunkingService;
