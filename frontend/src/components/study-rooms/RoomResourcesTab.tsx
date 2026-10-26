import React, { useState, useEffect } from 'react';
import { IRoomResource } from '../../types/studyRoom';
import {
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  Upload,
  Plus,
  ExternalLink,
  Download,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { studyRoomService } from '../../services/studyRoomService';
import { resourceService, StudyResourceItem } from '../../services/resourceService';

interface RoomResourcesTabProps {
  roomId: string;
  resources: IRoomResource[];
  onRefreshResources: () => void;
}

export const RoomResourcesTab: React.FC<RoomResourcesTabProps> = ({
  roomId,
  resources,
  onRefreshResources,
}) => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [userResources, setUserResources] = useState<StudyResourceItem[]>([]);
  const [selectedResourceId, setSelectedResourceId] = useState<string>('');
  const [shareNotes, setShareNotes] = useState<string>('');
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const openShareModal = async () => {
    setIsShareModalOpen(true);
    setIsLoadingLibrary(true);
    setError(null);
    try {
      const items = await resourceService.getResources();
      setUserResources(items || []);
      if (items && items.length > 0) {
        setSelectedResourceId(items[0]._id);
      }
    } catch (err: any) {
      console.error('Failed to load user resources:', err);
    } finally {
      setIsLoadingLibrary(false);
    }
  };

  const handleShareExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResourceId) {
      setError('Please select a resource to share.');
      return;
    }

    setIsSharing(true);
    setError(null);
    try {
      await studyRoomService.shareResource(roomId, {
        resourceId: selectedResourceId,
        notes: shareNotes.trim() || undefined,
      });
      setIsShareModalOpen(false);
      setShareNotes('');
      onRefreshResources();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to share resource.');
    } finally {
      setIsSharing(false);
    }
  };

  const handleUploadAndShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const uploaded = await resourceService.uploadFile(uploadFile);
      await studyRoomService.shareResource(roomId, {
        resourceId: uploaded._id,
        notes: shareNotes.trim() || undefined,
      });
      setIsShareModalOpen(false);
      setUploadFile(null);
      setShareNotes('');
      onRefreshResources();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload and share resource.');
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'docx':
      case 'doc':
      case 'txt':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'video':
      case 'video_link':
        return <FileCode className="w-5 h-5 text-violet-500" />;
      default:
        return <File className="w-5 h-5 text-indigo-500" />;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Shared Room Resources</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Reference notes, PDFs, code snippets, and study material shared with members.
          </p>
        </div>

        <button
          onClick={openShareModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Share Resource</span>
        </button>
      </div>

      {/* Resources Grid */}
      {resources.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Shared Resources Yet</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Share study guides, cheatsheets, or documents from your library to collaborate with your room.
          </p>
          <button
            onClick={openShareModal}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-xs hover:bg-indigo-100 transition-colors"
          >
            Share First Resource
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {resources.map((item) => {
            const res = item.resourceId;
            const sharedByName = typeof item.sharedBy === 'string' ? 'Member' : item.sharedBy?.name || 'Peer';

            return (
              <div
                key={item._id}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getFileIcon(res?.fileType)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {item.title || res?.title || res?.fileName || 'Study Document'}
                      </h4>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {formatFileSize(res?.fileSize)} • {res?.fileType?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="mt-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 italic">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500">
                    Shared by <span className="font-semibold text-slate-700 dark:text-slate-300">{sharedByName}</span>
                  </span>

                  {res?.fileUrl && (
                    <a
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Share Resource Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Share Resource into Room</h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-5">
              {error && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Select Existing Resource from Library */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select From My Library
                </label>

                {isLoadingLibrary ? (
                  <div className="py-6 flex items-center justify-center text-xs text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Loading your resources...
                  </div>
                ) : userResources.length === 0 ? (
                  <p className="text-xs text-slate-400">No resources found in your personal library. Upload one below!</p>
                ) : (
                  <select
                    value={selectedResourceId}
                    onChange={(e) => setSelectedResourceId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {userResources.map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.originalFilename} ({item.resourceType?.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Study Notes / Key Highlights
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Read chapters 3 and 4 before tonight's quiz"
                    value={shareNotes}
                    onChange={(e) => setShareNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleShareExisting}
                  disabled={isSharing || !selectedResourceId}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                >
                  {isSharing ? 'Sharing...' : 'Share Selected Resource'}
                </button>
              </div>

              {/* Or Upload New File */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Or Upload New File (PDF, DOCX, TXT)
                </label>
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt,.png,.jpg,.jpeg"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-950/60 dark:file:text-indigo-300 hover:file:bg-indigo-100 cursor-pointer"
                />

                <button
                  type="button"
                  onClick={handleUploadAndShare}
                  disabled={isUploading || !uploadFile}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                >
                  {isUploading ? 'Uploading & Sharing...' : 'Upload & Share Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
