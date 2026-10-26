import React from 'react';
import { IKnowledgeSummary } from '../../services/knowledgeGraphService';
import {
  CheckCircle2,
  Play,
  AlertTriangle,
  RotateCw,
  Circle,
  Lock,
  BarChart2,
} from 'lucide-react';

interface KnowledgeOverviewBarProps {
  summary: IKnowledgeSummary;
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const KnowledgeOverviewBar: React.FC<KnowledgeOverviewBarProps> = ({
  summary,
  activeFilter,
  onSelectFilter,
}) => {
  const cards = [
    {
      id: 'MASTERED',
      label: 'Mastered',
      count: summary.mastered,
      icon: CheckCircle2,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
      activeRing: 'ring-2 ring-emerald-500 border-emerald-500',
    },
    {
      id: 'LEARNING',
      label: 'Learning',
      count: summary.learning,
      icon: Play,
      color: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40',
      activeRing: 'ring-2 ring-indigo-500 border-indigo-500',
    },
    {
      id: 'WEAK',
      label: 'Weak Areas',
      count: summary.weak,
      icon: AlertTriangle,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40',
      activeRing: 'ring-2 ring-amber-500 border-amber-500',
    },
    {
      id: 'NEEDS_REVISION',
      label: 'Needs Revision',
      count: summary.needsRevision,
      icon: RotateCw,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
      activeRing: 'ring-2 ring-rose-500 border-rose-500',
    },
    {
      id: 'AVAILABLE',
      label: 'Available',
      count: summary.available,
      icon: Circle,
      color: 'text-sky-600 dark:text-sky-400',
      bg: 'bg-sky-500/10 border-sky-500/20 hover:border-sky-500/40',
      activeRing: 'ring-2 ring-sky-500 border-sky-500',
    },
    {
      id: 'LOCKED',
      label: 'Locked',
      count: summary.locked,
      icon: Lock,
      color: 'text-slate-500 dark:text-slate-400',
      bg: 'bg-slate-500/10 border-slate-500/20 hover:border-slate-500/40',
      activeRing: 'ring-2 ring-slate-500 border-slate-500',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-500" />
          Knowledge Overview
        </h3>
        {summary.averageMastery !== null ? (
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Average Mastery:{' '}
            <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
              {summary.averageMastery}%
            </strong>{' '}
            across {summary.assessedCount} assessed concepts
          </span>
        ) : (
          <span className="text-xs text-slate-400 italic">
            No concepts assessed yet
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((card) => {
          const Icon = card.icon;
          const isActive = activeFilter === card.id;

          return (
            <button
              key={card.id}
              onClick={() => onSelectFilter(isActive ? 'ALL' : card.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer ${
                card.bg
              } ${isActive ? card.activeRing : ''}`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {card.label}
                </span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className={`text-2xl font-black font-mono ${card.color}`}>
                {card.count}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
