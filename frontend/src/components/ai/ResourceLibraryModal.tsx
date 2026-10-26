import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  FileText,
  Presentation,
  Image as ImageIcon,
  Video,
  Link2,
  Trash2,
  PlusCircle,
  AlertCircle,
  Clock,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';
import { resourceService, StudyResourceItem } from '../../services/resourceService';

interface ResourceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAttachResource: (resource: StudyResourceItem) => void;
  attachedResourceIds: string[];
}

export const ResourceLibraryModal: React.FC<ResourceLibraryModalProps> = ({
  isOpen,
  onClose,
  onAttachResource,
  attachedResourceIds,
}) => {
  const [resources, setResources] = useState<StudyResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadResources();
    }
  }, [isOpen]);

  const loadResources = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await resourceService.getResources();
      setResources(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load study resources.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}" from your study library?`)) return;
    try {
      await resourceService.deleteResource(id);
      setResources((prev) => prev.filter((r) => r._id !== id));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete resource.');
    }
  };

  if (!isOpen) return null;

  const filteredResources = resources.filter((res) => {
    const matchesSearch = res.originalFilename
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (selectedType === 'all') return matchesSearch;
    return matchesSearch && res.resourceType === selectedType;
  });

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-500" />;
      case 'presentation':
      case 'pptx':
        return <Presentation className="w-4 h-4 text-orange-500" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-500" />;
      case 'video':
        return <Video className="w-4 h-4 text-indigo-500" />;
      case 'video_link':
        return <Link2 className="w-4 h-4 text-cyan-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                My Study Resources
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Browse, attach, and manage your uploaded materials across study sessions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls: Search & Filters */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto scrollbar-none">
            {['all', 'pdf', 'presentation', 'document', 'image', 'video', 'video_link'].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedType(t)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium capitalize transition-colors ${
                  selectedType === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {t === 'presentation' ? 'PPT' : t === 'video_link' ? 'Links' : t}
              </button>
            ))}
          </div>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading resources...</div>
          ) : filteredResources.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No study resources found. Upload documents, PDFs, or PPTs to get started.
              </p>
            </div>
          ) : (
            filteredResources.map((res) => {
              const isAttached = attachedResourceIds.includes(res._id);
              const isReady = res.processingStatus === 'READY';

              return (
                <div
                  key={res._id}
                  className="p-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs group"
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      {getResourceIcon(res.resourceType)}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200 truncate">
                        {res.originalFilename}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span className="uppercase font-medium">{res.resourceType}</span>
                        {res.fileSize > 0 && <span>• {formatSize(res.fileSize)}</span>}
                        {res.metadata?.pageCount && (
                          <span>• {res.metadata.pageCount} pages</span>
                        )}
                        {res.metadata?.slideCount && (
                          <span>• {res.metadata.slideCount} slides</span>
                        )}
                        <span>
                          • {new Date(res.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status badge */}
                    {res.processingStatus === 'READY' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        Ready
                      </span>
                    ) : res.processingStatus === 'FAILED' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400" title={res.errorMessage}>
                        <AlertCircle className="w-3 h-3" />
                        Failed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        <Clock className="w-3 h-3 animate-spin" />
                        Processing
                      </span>
                    )}

                    {/* Attach action */}
                    {isReady && (
                      <button
                        onClick={() => onAttachResource(res)}
                        disabled={isAttached}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isAttached
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 cursor-default'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xs'
                        }`}
                      >
                        {isAttached ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Attached</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="w-3 h-3" />
                            <span>Attach</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      onClick={() => handleDelete(res._id, res.originalFilename)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete resource"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
