import React from 'react';
import {
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Code2,
} from 'lucide-react';

interface CodeDiffViewerProps {
  originalCode: string;
  proposedCode: string;
  originalSnapshot: string;
  explanation: string;
  language: string;
  onApply: (newCode: string) => void;
  onReject: () => void;
  onUndo?: () => void;
  canUndo?: boolean;
}

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

/**
 * Computes a line-by-line diff between two text blocks
 */
function computeLineDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diffs: DiffLine[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldLines[oldIdx];
    const newLine = newLines[newIdx];

    if (oldLine === newLine) {
      diffs.push({
        type: 'unchanged',
        content: oldLine || '',
        oldLineNumber: oldIdx + 1,
        newLineNumber: newIdx + 1,
      });
      oldIdx++;
      newIdx++;
    } else {
      // Check if old line exists further down in newLines
      const matchInNew = newLines.indexOf(oldLine, newIdx);
      const matchInOld = oldLines.indexOf(newLine, oldIdx);

      if (matchInOld !== -1 && (matchInNew === -1 || matchInOld < matchInNew)) {
        diffs.push({
          type: 'removed',
          content: oldLine,
          oldLineNumber: oldIdx + 1,
        });
        oldIdx++;
      } else if (matchInNew !== -1) {
        diffs.push({
          type: 'added',
          content: newLine,
          newLineNumber: newIdx + 1,
        });
        newIdx++;
      } else {
        if (oldIdx < oldLines.length) {
          diffs.push({
            type: 'removed',
            content: oldLine,
            oldLineNumber: oldIdx + 1,
          });
          oldIdx++;
        }
        if (newIdx < newLines.length) {
          diffs.push({
            type: 'added',
            content: newLine,
            newLineNumber: newIdx + 1,
          });
          newIdx++;
        }
      }
    }
  }

  return diffs;
}

export const CodeDiffViewer: React.FC<CodeDiffViewerProps> = ({
  originalCode,
  proposedCode,
  originalSnapshot,
  explanation,
  language,
  onApply,
  onReject,
  onUndo,
  canUndo,
}) => {
  const isStale = originalCode !== originalSnapshot;
  const diffLines = computeLineDiff(originalCode, proposedCode);

  const addedCount = diffLines.filter((l) => l.type === 'added').length;
  const removedCount = diffLines.filter((l) => l.type === 'removed').length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="w-full max-w-5xl h-[85vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans">
        {/* Modal Header */}
        <div className="h-16 px-6 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white">Review AI Code Proposal</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                  {language}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Compare original code vs AI proposed changes before applying
              </p>
            </div>
          </div>

          {/* Stats & Diff Badge */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
              +{addedCount} lines
            </span>
            <span className="text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-lg">
              -{removedCount} lines
            </span>
            <button
              onClick={onReject}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Stale Code Warning Banner */}
        {isStale && (
          <div className="px-6 py-2.5 bg-amber-950/60 border-b border-amber-800/80 text-amber-200 text-xs flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Stale Suggestion Notice:</strong> You edited the editor code after this AI suggestion was generated. Applying will overwrite current edits.
              </span>
            </div>
            <span className="text-[10px] font-mono bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50">
              Source Changed
            </span>
          </div>
        )}

        {/* Explanation Header */}
        {explanation && (
          <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 text-xs text-slate-300 shrink-0 max-h-24 overflow-y-auto">
            <strong className="text-indigo-400 font-semibold flex items-center gap-1.5 mb-1">
              <Code2 className="w-3.5 h-3.5" />
              AI Explanation:
            </strong>
            <p className="text-slate-300 leading-relaxed font-sans">{explanation}</p>
          </div>
        )}

        {/* Main Diff Code Body */}
        <div className="flex-1 bg-[#1e1e1e] font-mono text-xs overflow-auto p-4 leading-relaxed selection:bg-indigo-500 selection:text-white">
          <div className="space-y-0.5 min-w-max">
            {diffLines.map((line, idx) => (
              <div
                key={idx}
                className={`flex items-start px-3 py-0.5 rounded-xs transition-colors ${
                  line.type === 'added'
                    ? 'bg-emerald-950/40 text-emerald-300 border-l-2 border-emerald-500'
                    : line.type === 'removed'
                    ? 'bg-rose-950/40 text-rose-300 border-l-2 border-rose-500 line-through opacity-80'
                    : 'text-slate-300 hover:bg-slate-800/40'
                }`}
              >
                {/* Line Numbers */}
                <div className="w-12 text-slate-600 select-none text-right pr-3 font-mono text-[11px] shrink-0">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : line.newLineNumber}
                </div>

                {/* Symbol indicator */}
                <div className="w-4 font-bold select-none shrink-0 opacity-70">
                  {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                </div>

                {/* Code Line Content */}
                <div className="flex-1 whitespace-pre">{line.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="h-16 px-6 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {canUndo && onUndo && (
              <button
                onClick={onUndo}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
                title="Undo last applied suggestion"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Undo Last Apply
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Reject Button */}
            <button
              onClick={onReject}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4 text-slate-400" />
              Reject Changes
            </button>

            {/* Apply Button */}
            <button
              onClick={() => onApply(proposedCode)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer active:scale-95"
            >
              <Check className="w-4 h-4" />
              Apply Changes to Editor
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
