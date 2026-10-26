import React, { useState, useEffect, useMemo } from 'react';
import {
  knowledgeGraphService,
  IKnowledgeGraphResponse,
  IKnowledgeNode,
} from '../services/knowledgeGraphService';
import { KnowledgeGraphCanvas } from '../components/knowledge-graph/KnowledgeGraphCanvas';
import { NodeDetailDrawer } from '../components/knowledge-graph/NodeDetailDrawer';
import { KnowledgeOverviewBar } from '../components/knowledge-graph/KnowledgeOverviewBar';
import { NeedsAttentionSection } from '../components/knowledge-graph/NeedsAttentionSection';
import { RecommendedNextCard } from '../components/knowledge-graph/RecommendedNextCard';
import {
  Network,
  Search,
  Filter,
  Layers,
  BookOpen,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const KnowledgeGraphPage: React.FC = () => {
  const [data, setData] = useState<IKnowledgeGraphResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [viewMode, setViewMode] = useState<'topics' | 'all'>('topics');

  // Selected Node Drawer
  const [selectedNode, setSelectedNode] = useState<IKnowledgeNode | null>(null);

  const fetchGraph = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await knowledgeGraphService.getKnowledgeGraph(viewMode === 'all');
      setData(result);
      if (selectedNode) {
        // Keep selected node reference updated
        const updated = result.nodes.find((n) => n.id === selectedNode.id);
        if (updated) setSelectedNode(updated);
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load Knowledge Graph');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [viewMode]);

  // Subject filtering
  const filteredNodes = useMemo(() => {
    if (!data) return [];
    return data.nodes.filter((node) => {
      if (viewMode === 'topics' && node.type === 'concept') return false;
      if (selectedSubject === 'ALL') return true;
      if (selectedSubject === 'programming') {
        return node.subject === 'Programming & Data Structures';
      }
      return node.subject === selectedSubject;
    });
  }, [data, selectedSubject, viewMode]);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-sm font-semibold text-slate-400">
          Mapping personalized knowledge graph...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">
          Unable to load Knowledge Graph
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto">{error}</p>
        <button
          onClick={fetchGraph}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    );
  }

  // Empty state check
  const hasLearningActivity = data.summary.assessedCount > 0 || data.summary.learning > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Knowledge Graph
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Visualize what you know, what needs improvement, and what to learn next.
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
            <button
              onClick={() => setViewMode('topics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'topics'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Core Topics
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'all'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Detailed Concepts
            </button>
          </div>
        </div>
      </div>

      {/* 2. Controls & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search concepts (e.g. Loops, Arrays, Recursion)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* Filter selectors */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {/* Subject Dropdown */}
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All Subjects</option>
            <option value="programming">Programming & Data Structures</option>
            {data.subjects
              .filter((s) => s.id !== 'programming')
              .map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="ALL">All States</option>
            <option value="MASTERED">Mastered</option>
            <option value="LEARNING">Currently Learning</option>
            <option value="WEAK">Weak Areas</option>
            <option value="NEEDS_REVISION">Needs Revision</option>
            <option value="AVAILABLE">Available</option>
            <option value="LOCKED">Locked</option>
          </select>
        </div>
      </div>

      {/* 3. Empty State Banner if no learning has occurred */}
      {!hasLearningActivity && (
        <div className="p-4 sm:p-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                Your Knowledge Graph will grow as you learn
              </h4>
              <p className="text-xs text-indigo-700 dark:text-indigo-300">
                Concepts will illuminate with real measured mastery as you practice and complete quizzes.
              </p>
            </div>
          </div>
          <Link
            to="/learning-path"
            className="shrink-0 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            Start Learning Path <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* 4. Recommended Next Step */}
      <RecommendedNextCard recommendation={data.summary.recommendedNext} />

      {/* 5. Interactive Graph Canvas */}
      <div className="space-y-2">
        <KnowledgeGraphCanvas
          nodes={filteredNodes}
          edges={data.edges}
          selectedNodeId={selectedNode?.id || null}
          onSelectNode={(node) => setSelectedNode(node)}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
        />
        <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center sm:text-left">
          Tip: Click any node to inspect performance evidence, unlock dependencies, or ask the AI tutor. Drag to pan, scroll to zoom.
        </p>
      </div>

      {/* 6. Real Knowledge Overview Summary */}
      <KnowledgeOverviewBar
        summary={data.summary}
        activeFilter={statusFilter}
        onSelectFilter={(f) => setStatusFilter(f)}
      />

      {/* 7. Needs Attention Section */}
      <NeedsAttentionSection
        nodes={data.nodes}
        onSelectNode={(node) => setSelectedNode(node)}
      />

      {/* 8. Node Detail Drawer */}
      <NodeDetailDrawer
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        allNodes={data.nodes}
        onSelectNode={(node) => setSelectedNode(node)}
      />
    </div>
  );
};
