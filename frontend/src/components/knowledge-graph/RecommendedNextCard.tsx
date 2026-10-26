import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Clock, Target } from 'lucide-react';

interface RecommendedNextCardProps {
  recommendation: {
    id: string;
    title: string;
    reason: string;
    estimatedMinutes: number;
  } | null;
}

export const RecommendedNextCard: React.FC<RecommendedNextCardProps> = ({
  recommendation,
}) => {
  const navigate = useNavigate();

  if (!recommendation) return null;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-indigo-950/30 border border-indigo-500/30 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0 mt-0.5">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
              Recommended Next Step
            </span>
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" />
              ~{recommendation.estimatedMinutes} mins
            </span>
          </div>
          <h3 className="text-base font-extrabold text-white">
            {recommendation.title}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            {recommendation.reason}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate('/learning-path')}
        className="shrink-0 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
      >
        <Target className="w-4 h-4" />
        Start Learning
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
