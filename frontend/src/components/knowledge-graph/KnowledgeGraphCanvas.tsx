import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  IKnowledgeNode,
  IKnowledgeEdge,
  KnowledgeNodeStatus,
} from '../../services/knowledgeGraphService';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Compass,
  Lock,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Circle,
  HelpCircle,
} from 'lucide-react';

interface KnowledgeGraphCanvasProps {
  nodes: IKnowledgeNode[];
  edges: IKnowledgeEdge[];
  selectedNodeId: string | null;
  onSelectNode: (node: IKnowledgeNode) => void;
  searchQuery?: string;
  statusFilter?: string;
}

export const KnowledgeGraphCanvas: React.FC<KnowledgeGraphCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  searchQuery = '',
  statusFilter = 'ALL',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<IKnowledgeNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Filter nodes according to status filter
  const visibleNodes = useMemo(() => {
    return nodes.filter((node) => {
      if (statusFilter === 'ALL') return true;
      if (statusFilter === 'MASTERED') return node.status === 'MASTERED';
      if (statusFilter === 'LEARNING') return node.status === 'LEARNING';
      if (statusFilter === 'WEAK') return node.status === 'WEAK' || node.weakConcept;
      if (statusFilter === 'NEEDS_REVISION') return node.status === 'NEEDS_REVISION';
      if (statusFilter === 'AVAILABLE') return node.status === 'AVAILABLE';
      if (statusFilter === 'LOCKED') return node.status === 'LOCKED';
      return true;
    });
  }, [nodes, statusFilter]);

  const visibleNodeIds = useMemo(
    () => new Set(visibleNodes.map((n) => n.id)),
    [visibleNodes]
  );

  // Visible edges connect two visible nodes
  const visibleEdges = useMemo(() => {
    return edges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [edges, visibleNodeIds]);

  // Node position map for edge endpoints
  const nodeMap = useMemo(() => {
    const map = new Map<string, IKnowledgeNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  // Fit view calculation
  const handleFitView = useCallback(() => {
    if (!containerRef.current || visibleNodes.length === 0) return;
    const { clientWidth, clientHeight } = containerRef.current;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    for (const n of visibleNodes) {
      minX = Math.min(minX, n.position.x);
      maxX = Math.max(maxX, n.position.x + 220);
      minY = Math.min(minY, n.position.y);
      maxY = Math.max(maxY, n.position.y + 110);
    }

    const padding = 80;
    const graphWidth = maxX - minX + padding * 2;
    const graphHeight = maxY - minY + padding * 2;

    const scaleX = clientWidth / graphWidth;
    const scaleY = clientHeight / graphHeight;
    const fitScale = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.3);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    setScale(fitScale);
    setOffset({
      x: clientWidth / 2 - centerX * fitScale,
      y: clientHeight / 2 - centerY * fitScale,
    });
  }, [visibleNodes]);

  // Auto-fit on initial render or when nodes change
  useEffect(() => {
    handleFitView();
  }, [nodes.length, handleFitView]);

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary mouse button
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Wheel zoom with cursor focus
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newScale = Math.min(Math.max(scale * zoomFactor, 0.35), 2.2);

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered on cursor
    const newOffsetX = mouseX - (mouseX - offset.x) * (newScale / scale);
    const newOffsetY = mouseY - (mouseY - offset.y) * (newScale / scale);

    setScale(newScale);
    setOffset({ x: newOffsetX, y: newOffsetY });
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Helpers for node styling
  const getStatusBadge = (status: KnowledgeNodeStatus, weakConcept: boolean) => {
    if (weakConcept || status === 'WEAK') {
      return {
        label: 'Weak Concept',
        icon: AlertTriangle,
        bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        nodeBorder: 'border-amber-400 dark:border-amber-500/80 shadow-amber-500/10',
        dot: 'bg-amber-500',
      };
    }
    switch (status) {
      case 'MASTERED':
        return {
          label: 'Mastered',
          icon: CheckCircle2,
          bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          nodeBorder: 'border-emerald-400 dark:border-emerald-500/80 shadow-emerald-500/10',
          dot: 'bg-emerald-500',
        };
      case 'LEARNING':
        return {
          label: 'Learning',
          icon: Play,
          bg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
          nodeBorder: 'border-indigo-500 shadow-indigo-500/20 ring-2 ring-indigo-500/20',
          dot: 'bg-indigo-500 animate-pulse',
        };
      case 'NEEDS_REVISION':
        return {
          label: 'Needs Revision',
          icon: RotateCw,
          bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
          nodeBorder: 'border-rose-400 dark:border-rose-500/80 shadow-rose-500/10',
          dot: 'bg-rose-500',
        };
      case 'AVAILABLE':
        return {
          label: 'Available',
          icon: Circle,
          bg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
          nodeBorder: 'border-sky-300 dark:border-sky-600/70 shadow-sky-500/5',
          dot: 'bg-sky-500',
        };
      case 'LOCKED':
      default:
        return {
          label: 'Locked',
          icon: Lock,
          bg: 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-400/20',
          nodeBorder: 'border-slate-200 dark:border-slate-800 opacity-65',
          dot: 'bg-slate-400',
        };
    }
  };

  // Node width & height constants
  const NODE_WIDTH = 220;
  const NODE_HEIGHT = 105;

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-xl transition-all select-none ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : 'h-[620px]'
      }`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
    >
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.18]"
        style={{
          backgroundImage: `radial-gradient(circle, #6366f1 1px, transparent 1px)`,
          backgroundSize: `${30 * scale}px ${30 * scale}px`,
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      />

      {/* SVG Container for Edges and Nodes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ transformOrigin: '0 0' }}
      >
        <defs>
          {/* Arrow markers for edges */}
          <marker
            id="arrowhead-prereq"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" opacity="0.9" />
          </marker>
          <marker
            id="arrowhead-partof"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" opacity="0.6" />
          </marker>
        </defs>

        <g transform={`translate(${offset.x}, ${offset.y}) scale(${scale})`}>
          {/* 1. EDGES */}
          {visibleEdges.map((edge) => {
            const sourceNode = nodeMap.get(edge.source);
            const targetNode = nodeMap.get(edge.target);
            if (!sourceNode || !targetNode) return null;

            // Connection anchor coordinates: right of source to left of target
            const x1 = sourceNode.position.x + NODE_WIDTH;
            const y1 = sourceNode.position.y + NODE_HEIGHT / 2;
            const x2 = targetNode.position.x;
            const y2 = targetNode.position.y + NODE_HEIGHT / 2;

            // Smooth cubic bezier curve control points
            const dx = Math.max(Math.abs(x2 - x1) * 0.48, 50);
            const pathData = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            const isHighlighted =
              selectedNodeId === edge.source || selectedNodeId === edge.target;

            const isPartOf = edge.type === 'PART_OF';

            return (
              <g key={edge.id} className="transition-opacity duration-200">
                {/* Edge path shadow/glow if selected */}
                {isHighlighted && (
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="6"
                    opacity="0.3"
                  />
                )}
                {/* Main edge path */}
                <path
                  d={pathData}
                  fill="none"
                  stroke={
                    isHighlighted
                      ? '#a5b4fc'
                      : isPartOf
                      ? '#64748b'
                      : '#4f46e5'
                  }
                  strokeWidth={isHighlighted ? 3 : isPartOf ? 1.5 : 2}
                  strokeDasharray={isPartOf ? '4,4' : undefined}
                  markerEnd={
                    isPartOf ? 'url(#arrowhead-partof)' : 'url(#arrowhead-prereq)'
                  }
                  opacity={isHighlighted ? 1 : isPartOf ? 0.5 : 0.75}
                  className={!isPartOf && isHighlighted ? 'animate-pulse' : undefined}
                />
              </g>
            );
          })}

          {/* 2. NODES */}
          {visibleNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const badge = getStatusBadge(node.status, node.weakConcept);
            const BadgeIcon = badge.icon;

            const isSearchMatch =
              searchQuery.trim().length > 1 &&
              (node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (node.topic && node.topic.toLowerCase().includes(searchQuery.toLowerCase())));

            return (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                onMouseEnter={(e) => {
                  setHoveredNode(node);
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer group"
                style={{
                  transition: 'transform 0.15s ease-out, filter 0.15s ease-out',
                }}
              >
                {/* Search Match Halo Pulse */}
                {isSearchMatch && (
                  <rect
                    x="-6"
                    y="-6"
                    width={NODE_WIDTH + 12}
                    height={NODE_HEIGHT + 12}
                    rx="22"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    className="animate-ping opacity-70"
                  />
                )}

                {/* Selection Halo */}
                {isSelected && (
                  <rect
                    x="-4"
                    y="-4"
                    width={NODE_WIDTH + 8}
                    height={NODE_HEIGHT + 8}
                    rx="20"
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    className="opacity-90"
                  />
                )}

                {/* Main Node Card ForeignObject */}
                <foreignObject
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                  className="overflow-visible"
                >
                  <div
                    className={`w-full h-full p-3 rounded-2xl border transition-all duration-200 backdrop-blur-md shadow-lg ${
                      isSelected
                        ? 'bg-slate-800/95 border-indigo-500 shadow-indigo-500/25 ring-2 ring-indigo-500/30'
                        : isSearchMatch
                        ? 'bg-slate-800/95 border-amber-500 shadow-amber-500/20'
                        : `bg-slate-800/85 hover:bg-slate-800/95 ${badge.nodeBorder}`
                    }`}
                  >
                    {/* Header Row: Status badge & Confidence dot */}
                    <div className="flex items-center justify-between gap-1.5 mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>

                      {/* Mastery badge or "Not assessed" */}
                      {node.mastery !== null ? (
                        <span className="text-xs font-black text-indigo-400 font-mono">
                          {node.mastery}%
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Not assessed
                        </span>
                      )}
                    </div>

                    {/* Node Title */}
                    <h4
                      className={`text-xs font-bold leading-snug line-clamp-2 transition-colors ${
                        isSelected
                          ? 'text-white'
                          : node.status === 'LOCKED'
                          ? 'text-slate-400'
                          : 'text-slate-200 group-hover:text-white'
                      }`}
                    >
                      {node.title}
                    </h4>

                    {/* Footer Row: Progress bar & Confidence */}
                    <div className="mt-2 space-y-1">
                      {node.mastery !== null ? (
                        <div className="w-full bg-slate-700/60 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              node.mastery >= 80
                                ? 'bg-emerald-500'
                                : node.mastery >= 60
                                ? 'bg-indigo-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${node.mastery}%` }}
                          />
                        </div>
                      ) : (
                        <div className="w-full bg-slate-700/30 h-1 rounded-full" />
                      )}

                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="truncate max-w-[120px]">
                          {node.type === 'concept' ? `Concept` : `Core Topic`}
                        </span>
                        {node.assessmentCount > 0 ? (
                          <span>
                            {node.assessmentCount} quiz{node.assessmentCount > 1 ? 'zes' : ''}
                          </span>
                        ) : (
                          <span>0 quizzes</span>
                        )}
                      </div>
                    </div>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Toolbar Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 p-1.5 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl shadow-xl z-20">
        <button
          onClick={() => setScale((s) => Math.min(s * 1.2, 2.2))}
          className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(s * 0.8, 0.35))}
          className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitView}
          className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          title="Fit Graph to View"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setScale(1);
            setOffset({ x: 50, y: 50 });
          }}
          className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          title="Reset Position"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-slate-700 my-auto" />
        <button
          onClick={toggleFullscreen}
          className="p-2 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Zoom scale indicator */}
      <div className="absolute bottom-4 left-4 px-3 py-1 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-xl text-[11px] font-mono text-slate-400 z-10">
        {Math.round(scale * 100)}%
      </div>

      {/* Graph Legend */}
      <div className="absolute top-4 left-4 flex flex-wrap items-center gap-2 p-2 bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl text-[11px] text-slate-300 z-10">
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="w-3 h-3" /> Mastered
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Play className="w-3 h-3" /> Learning
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-400">
          <AlertTriangle className="w-3 h-3" /> Weak
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-rose-500/10 text-rose-400">
          <RotateCw className="w-3 h-3" /> Revision
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-sky-500/10 text-sky-400">
          <Circle className="w-3 h-3" /> Available
        </span>
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-slate-700/50 text-slate-400">
          <Lock className="w-3 h-3" /> Locked
        </span>
      </div>

      {/* Hover Tooltip */}
      {hoveredNode && !isDragging && (
        <div
          className="fixed pointer-events-none z-50 p-3 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl text-xs text-white max-w-xs space-y-1.5 animate-fade-in"
          style={{
            left: Math.min(tooltipPos.x + 15, window.innerWidth - 300),
            top: Math.min(tooltipPos.y + 15, window.innerHeight - 150),
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-100">{hoveredNode.title}</span>
            <span className="font-mono text-indigo-400 font-bold">
              {hoveredNode.mastery !== null ? `${hoveredNode.mastery}%` : 'Not assessed'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 line-clamp-2">
            {hoveredNode.description}
          </p>
          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
            <span>Prerequisites: {hoveredNode.prerequisites.length}</span>
            <span>Unlocks: {hoveredNode.dependencies.length}</span>
          </div>
        </div>
      )}
    </div>
  );
};
