import React from 'react';
import { FileText, Presentation, Image, Video, Link2, BookOpen } from 'lucide-react';
import { AISourceItem } from '../../services/aiService';

interface SourceCitationsProps {
  sources?: AISourceItem[];
}

export const SourceCitations: React.FC<SourceCitationsProps> = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  const getSourceIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <FileText className="w-3 h-3 text-rose-500" />;
    if (ext === 'ppt' || ext === 'pptx') return <Presentation className="w-3 h-3 text-orange-500" />;
    if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return <Image className="w-3 h-3 text-emerald-500" />;
    if (['mp4', 'webm', 'mov', 'mkv'].includes(ext || '')) return <Video className="w-3 h-3 text-indigo-500" />;
    if (filename.startsWith('http')) return <Link2 className="w-3 h-3 text-cyan-500" />;
    return <BookOpen className="w-3 h-3 text-indigo-500" />;
  };

  const formatSourceLabel = (src: AISourceItem) => {
    const parts: string[] = [src.filename];
    if (src.pageNumber) parts.push(`Page ${src.pageNumber}`);
    if (src.slideNumber) parts.push(`Slide ${src.slideNumber}`);
    if (src.timestamp) parts.push(src.timestamp);
    if (src.sectionTitle && !src.pageNumber && !src.slideNumber) parts.push(src.sectionTitle);
    return parts.join(' • ');
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 flex items-center gap-1.5">
        <BookOpen className="w-3 h-3" />
        <span>Referenced Study Materials</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sources.map((src, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 shadow-2xs hover:bg-slate-200/60 transition-colors"
            title={src.filename}
          >
            {getSourceIcon(src.filename)}
            <span className="truncate max-w-[220px]">{formatSourceLabel(src)}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
