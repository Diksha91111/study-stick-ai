import React, { useState } from 'react';
import { Copy, Check, Code as CodeIcon } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Parse text into text chunks vs code blocks
  const codeBlockRegex = /```([a-zA-Z0-9_+-]*)\n([\s\S]*?)```/g;
  const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex, match.index),
      });
    }
    parts.push({
      type: 'code',
      language: match[1] || 'text',
      content: match[2].trim(),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.substring(lastIndex),
    });
  }

  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let trimmed = line.trim();

      // Headers
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={lineIdx} className="text-base font-bold text-slate-900 dark:text-white mt-3 mb-1.5">
            {renderInlineMarkdown(trimmed.slice(4))}
          </h4>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={lineIdx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 border-b border-slate-200 dark:border-slate-800 pb-1">
            {renderInlineMarkdown(trimmed.slice(3))}
          </h3>
        );
      }
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={lineIdx} className="text-xl font-extrabold text-slate-900 dark:text-white mt-4 mb-2">
            {renderInlineMarkdown(trimmed.slice(2))}
          </h2>
        );
      }

      // Bullet List
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={lineIdx} className="ml-4 list-disc text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
            {renderInlineMarkdown(trimmed.slice(2))}
          </li>
        );
      }

      // Numbered List
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        return (
          <li key={lineIdx} className="ml-5 list-decimal text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
            {renderInlineMarkdown(numMatch[2])}
          </li>
        );
      }

      // Empty line
      if (!trimmed) {
        return <div key={lineIdx} className="h-2" />;
      }

      // Regular Paragraph
      return (
        <p key={lineIdx} className="text-slate-700 dark:text-slate-300 my-1 leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      );
    });
  };

  const renderInlineMarkdown = (text: string) => {
    // Basic inline code & bold handling
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-mono text-xs border border-slate-200 dark:border-slate-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-slate-900 dark:text-slate-100">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-sm">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return (
            <div
              key={idx}
              className="my-3 rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-lg text-slate-100"
            >
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <CodeIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="uppercase font-semibold tracking-wider text-slate-300">
                    {part.language || 'code'}
                  </span>
                </div>
                <button
                  onClick={() => copyToClipboard(part.content, idx)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors duration-150 text-xs font-sans"
                >
                  {copiedIndex === idx ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto font-mono text-xs leading-relaxed text-slate-200">
                <code>{part.content}</code>
              </pre>
            </div>
          );
        }

        return <div key={idx}>{renderFormattedText(part.content)}</div>;
      })}
    </div>
  );
};
