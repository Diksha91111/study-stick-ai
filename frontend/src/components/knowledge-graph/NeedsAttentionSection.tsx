import React from 'react';
import { useNavigate } from 'react-router-dom';
import { IKnowledgeNode } from '../../services/knowledgeGraphService';
import {
  AlertTriangle,
  RotateCw,
  BookOpen,
  Target,
  Bot,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface NeedsAttentionSectionProps {
  nodes: IKnowledgeNode[];
  onSelectNode: (node: IKnowledgeNode) => void;
}

export const NeedsAttentionSection: React.FC<NeedsAttentionSectionProps> = ({
  nodes,
  onSelectNode,
}) => {
  const navigate = useNavigate();

  // Filter and sort concepts needing attention (weak or needs revision)
  const attentionNodes = nodes
    .filter(
      (n) =>
        n.weakConcept ||
        n.status === 'WEAK' ||
        n.status === 'NEEDS_REVISION'
    )
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0));

  if (attentionNodes.length === 0) return null;

  return (
    <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Needs Attention ({attentionNodes.length})
            </h3>
            <p className="text-xs text-slate-400">
              Reinforce these concepts to maintain mastery and unlock dependent topics
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {attentionNodes.map((node) => {
          const isWeak = node.weakConcept || node.status === 'WEAK';

          return (
            <div
              key={node.id}
              className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/70 hover:border-slate-600 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      isWeak
                        ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                        : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {isWeak ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <RotateCw className="w-3 h-3" />
                    )}
                    {isWeak ? 'Weak Area' : 'Revision Due'}
                  </span>

                  <span className="text-xs font-mono font-bold text-slate-200">
                    {node.mastery !== null ? `${node.mastery}% mastery` : 'Not assessed'}
                  </span>
                </div>

                <h4
                  onClick={() => onSelectNode(node)}
                  className="text-sm font-bold text-white hover:text-indigo-400 cursor-pointer transition-colors"
                >
                  {node.title}
                </h4>

                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {node.weakReason || node.description}
                </p>
              </div>

              {/* Progress bar */}
              {node.mastery !== null && (
                <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      node.mastery >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${node.mastery}%` }}
                  />
                </div>
              )}

              {/* Actions row */}
              <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-700/50">
                <button
                  onClick={() => navigate('/learning-path')}
                  className="py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  title="Review lesson material"
                >
                  <BookOpen className="w-3 h-3" />
                  Review
                </button>
                <button
                  onClick={() => navigate('/learning-path')}
                  className="py-1.5 px-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  title="Take practice quiz"
                >
                  <Target className="w-3 h-3" />
                  Practice
                </button>
                <button
                  onClick={() =>
                    navigate('/assistant', {
                      state: {
                        conceptId: node.id,
                        conceptTitle: node.title,
                        mastery: node.mastery,
                        weakReason: node.weakReason,
                      },
                    })
                  }
                  className="py-1.5 px-2 rounded-lg border border-indigo-500/40 hover:bg-indigo-950/40 text-indigo-400 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  title="Ask AI Study Assistant"
                >
                  <Bot className="w-3 h-3" />
                  Ask AI
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
