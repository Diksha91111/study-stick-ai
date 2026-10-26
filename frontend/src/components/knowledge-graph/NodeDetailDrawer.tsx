import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IKnowledgeNode,
  knowledgeGraphService,
} from '../../services/knowledgeGraphService';
import {
  X,
  BookOpen,
  Sparkles,
  Bot,
  BrainCircuit,
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Clock,
  Layers,
  Check,
  ChevronRight,
  Target,
  ArrowRight,
  HelpCircle,
  Loader2,
} from 'lucide-react';

interface NodeDetailDrawerProps {
  node: IKnowledgeNode | null;
  onClose: () => void;
  allNodes: IKnowledgeNode[];
  onSelectNode: (node: IKnowledgeNode) => void;
}

export const NodeDetailDrawer: React.FC<NodeDetailDrawerProps> = ({
  node,
  onClose,
  allNodes,
  onSelectNode,
}) => {
  const navigate = useNavigate();
  const [isExplainingWeakness, setIsExplainingWeakness] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);

  if (!node) return null;

  const nodeMap = new Map<string, IKnowledgeNode>(allNodes.map((n) => [n.id, n]));

  // Handle Learn / Review click -> navigates to Learning Path
  const handleLearnReview = () => {
    navigate('/learning-path');
  };

  // Handle Quiz Me click -> navigates to Learning Path quiz
  const handleQuizMe = () => {
    navigate('/learning-path');
  };

  // Handle Review Flashcards
  const handleReviewFlashcards = () => {
    navigate('/revision');
  };

  // Handle Ask AI -> navigates to AI Study Assistant passing safe concept context
  const handleAskAI = () => {
    navigate('/assistant', {
      state: {
        conceptId: node.id,
        conceptTitle: node.title,
        topic: node.topic || node.title,
        mastery: node.mastery,
        weakReason: node.weakReason,
        initialPrompt: `I would like help mastering "${node.title}" (${
          node.mastery !== null ? `${node.mastery}% mastery` : 'Not assessed yet'
        }). ${
          node.weakReason ? `Specifically, I need help with: ${node.weakReason}.` : ''
        } Can you explain the core concepts and guide me through a practice example?`,
      },
    });
  };

  // Handle On-Demand AI Weakness Explanation
  const handleExplainWeakness = async () => {
    if (isExplainingWeakness) return;
    setIsExplainingWeakness(true);
    setAiExplanation(null);
    try {
      const explanation = await knowledgeGraphService.explainWeakness(
        node.title,
        node.mastery,
        node.weakReason
      );
      setAiExplanation(explanation);
    } catch {
      setAiExplanation(
        'Focus on core syntax, trace code execution line-by-line, and test boundary conditions to master this topic!'
      );
    } finally {
      setIsExplainingWeakness(false);
    }
  };

  const getStatusBadge = () => {
    if (node.weakConcept || node.status === 'WEAK') {
      return {
        label: 'Weak Concept',
        icon: AlertTriangle,
        badgeClass: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    }
    switch (node.status) {
      case 'MASTERED':
        return {
          label: 'Mastered',
          icon: CheckCircle2,
          badgeClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
      case 'LEARNING':
        return {
          label: 'Learning',
          icon: Play,
          badgeClass: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
        };
      case 'NEEDS_REVISION':
        return {
          label: 'Needs Revision',
          icon: RotateCw,
          badgeClass: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'AVAILABLE':
        return {
          label: 'Available to Learn',
          icon: Target,
          badgeClass: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
        };
      case 'LOCKED':
      default:
        return {
          label: 'Locked (Prerequisites Incomplete)',
          icon: Lock,
          badgeClass: 'bg-slate-500/15 text-slate-500 dark:text-slate-400 border-slate-500/30',
        };
    }
  };

  const statusBadge = getStatusBadge();
  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-50 flex flex-col transition-transform duration-300 animate-slide-left">
      {/* Drawer Header */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusBadge.badgeClass}`}
            >
              <StatusIcon className="w-3.5 h-3.5" />
              {statusBadge.label}
            </span>
            <span className="text-xs text-slate-400 font-medium capitalize">
              {node.type}
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white truncate">
            {node.title}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {node.subject}
          </p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Close details"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Overview
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {node.description}
          </p>
        </div>

        {/* Real Mastery Gauge */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Mastery Level
            </span>
            {node.mastery !== null ? (
              <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                {node.mastery}%
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 italic">
                Not assessed yet
              </span>
            )}
          </div>

          {node.mastery !== null && (
            <div className="w-full bg-indigo-200/50 dark:bg-indigo-950/60 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  node.mastery >= 80
                    ? 'bg-emerald-500'
                    : node.mastery >= 60
                    ? 'bg-indigo-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${node.mastery}%` }}
              />
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
            <span>Confidence: {node.confidence}%</span>
            <span>
              {node.evidence.totalCorrectAnswers}/{node.evidence.totalQuestionsAttempted} Questions Correct
            </span>
          </div>
        </div>

        {/* Real Evidence Explanation */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <BrainCircuit className="w-4 h-4 text-indigo-500" />
            Mastery Evidence
          </h4>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 space-y-2.5 text-xs">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
              {node.evidence.evidenceSummary}
            </p>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-slate-500 dark:text-slate-400">
              <div>
                <span className="block text-[11px] text-slate-400">Quiz Attempts</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {node.assessmentCount}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Accuracy</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {node.evidence.accuracyPercentage !== null
                    ? `${node.evidence.accuracyPercentage}%`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Flashcards Due</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {node.flashcardsDue}
                </span>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400">Last Practiced</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {node.lastPracticedAt
                    ? new Date(node.lastPracticedAt).toLocaleDateString()
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weak Concept Banner & AI Explanation */}
        {node.weakConcept && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Detected Weakness
                </h5>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                  {node.weakReason || 'Identified struggles on recent quizzes.'}
                </p>
              </div>
            </div>

            {aiExplanation ? (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-lg text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-amber-200 dark:border-amber-900/40">
                <p className="font-bold text-indigo-500 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> AI Pedagogical Advice
                </p>
                <div className="whitespace-pre-line">{aiExplanation}</div>
              </div>
            ) : (
              <button
                onClick={handleExplainWeakness}
                disabled={isExplainingWeakness}
                className="w-full py-2 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                {isExplainingWeakness ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Analyzing weakness...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    Explain Weakness with AI
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Prerequisites */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5" />
            Prerequisites ({node.prerequisites.length})
          </h4>
          {node.prerequisites.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              None. This is a foundational topic.
            </p>
          ) : (
            <div className="space-y-1.5">
              {node.prerequisites.map((pId) => {
                const prereqNode = nodeMap.get(pId);
                const isPrereqMastered = prereqNode?.status === 'MASTERED';
                return (
                  <div
                    key={pId}
                    onClick={() => prereqNode && onSelectNode(prereqNode)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-400 cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {isPrereqMastered ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Lock className="w-4 h-4 text-slate-400" />
                      )}
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {prereqNode?.title || pId}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isPrereqMastered ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Unlocks / Dependencies */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 text-indigo-500" />
            Unlocks ({node.dependencies.length})
          </h4>
          {node.dependencies.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Advanced milestone topic.
            </p>
          ) : (
            <div className="space-y-1.5">
              {node.dependencies.map((dId) => {
                const depNode = nodeMap.get(dId);
                return (
                  <div
                    key={dId}
                    onClick={() => depNode && onSelectNode(depNode)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 hover:border-indigo-400 cursor-pointer transition-colors text-xs"
                  >
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {depNode?.title || dId}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Drawer Action Footer */}
      <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {/* Learn / Review */}
          <button
            onClick={handleLearnReview}
            disabled={node.status === 'LOCKED'}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            {node.status === 'MASTERED' ? 'Review Material' : 'Learn Topic'}
          </button>

          {/* Quiz Me */}
          <button
            onClick={handleQuizMe}
            disabled={node.status === 'LOCKED'}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold text-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition-all"
          >
            <Target className="w-4 h-4" />
            Quiz Me
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Ask AI Tutor */}
          <button
            onClick={handleAskAI}
            className="py-2.5 px-4 rounded-xl border border-indigo-200 dark:border-indigo-800/70 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Bot className="w-4 h-4" />
            Ask AI Tutor
          </button>

          {/* Review Flashcards */}
          <button
            onClick={handleReviewFlashcards}
            className="py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Layers className="w-4 h-4" />
            Flashcards ({node.flashcardsDue} due)
          </button>
        </div>
      </div>
    </div>
  );
};
