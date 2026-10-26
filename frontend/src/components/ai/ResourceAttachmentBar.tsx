import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip,
  Plus,
  Image as ImageIcon,
  FileText,
  Presentation,
  FileCode,
  Video,
  Link2,
  FolderOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  resourceService,
  StudyResourceItem,
  ResourceProcessingStatus,
  ResourceType,
} from '../../services/resourceService';

export interface PendingAttachment {
  tempId: string;
  resourceId?: string;
  filename: string;
  resourceType: ResourceType;
  fileSize: number;
  status: ResourceProcessingStatus;
  progress?: number;
  errorMessage?: string;
  pageCount?: number;
  slideCount?: number;
}

interface AttachmentPreviewChipsProps {
  attachments: PendingAttachment[];
  onRemoveAttachment: (tempId: string) => void;
  onRetryAttachment: (attachment: PendingAttachment) => void;
}

export const AttachmentPreviewChips: React.FC<AttachmentPreviewChipsProps> = ({
  attachments,
  onRemoveAttachment,
  onRetryAttachment,
}) => {
  if (attachments.length === 0) return null;

  const getIconForType = (type: ResourceType) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-rose-500" />;
      case 'pptx':
        return <Presentation className="w-3.5 h-3.5 text-orange-500" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />;
      case 'video':
        return <Video className="w-3.5 h-3.5 text-indigo-500" />;
      case 'video_link':
        return <Link2 className="w-3.5 h-3.5 text-cyan-500" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-indigo-500" />;
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 mb-2 px-1">
      {attachments.map((att) => (
        <div
          key={att.tempId}
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all shadow-2xs ${
            att.status === 'READY'
              ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
              : att.status === 'FAILED'
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400'
              : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/50 text-indigo-700 dark:text-indigo-300'
          }`}
        >
          <div className="shrink-0">{getIconForType(att.resourceType)}</div>

          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={att.filename}>
            {att.filename}
          </span>

          {/* Status indicator */}
          {att.status === 'UPLOADING' && (
            <span className="flex items-center gap-1 text-[11px] text-indigo-600 dark:text-indigo-400 font-normal">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{att.progress || 0}%</span>
            </span>
          )}

          {att.status === 'PROCESSING' && (
            <span className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-normal">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing...</span>
            </span>
          )}

          {att.status === 'READY' && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3 h-3" />
              <span>
                {att.pageCount
                  ? `${att.pageCount}p`
                  : att.slideCount
                  ? `${att.slideCount} slides`
                  : 'Ready'}
              </span>
            </span>
          )}

          {att.status === 'FAILED' && (
            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-rose-600 dark:text-rose-400" title={att.errorMessage}>
                Failed
              </span>
              {att.resourceId && (
                <button
                  type="button"
                  onClick={() => onRetryAttachment(att)}
                  className="p-0.5 rounded hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300"
                  title="Retry processing"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemoveAttachment(att.tempId)}
            className="p-0.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-0.5"
            title="Remove attachment"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
};

interface AttachmentMenuButtonProps {
  onFileUpload: (file: File, type: ResourceType) => void;
  onOpenVideoLinkModal: () => void;
  onOpenLibraryModal: () => void;
  disabled?: boolean;
}

export const AttachmentMenuButton: React.FC<AttachmentMenuButtonProps> = ({
  onFileUpload,
  onOpenVideoLinkModal,
  onOpenLibraryModal,
  disabled,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const pptInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={imageInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onFileUpload(e.target.files[0], 'image');
          e.target.value = '';
        }}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={pdfInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onFileUpload(e.target.files[0], 'pdf');
          e.target.value = '';
        }}
        accept="application/pdf,.pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={pptInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onFileUpload(e.target.files[0], 'pptx');
          e.target.value = '';
        }}
        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        className="hidden"
      />
      <input
        type="file"
        ref={docInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onFileUpload(e.target.files[0], 'docx');
          e.target.value = '';
        }}
        accept=".docx,.doc,.txt,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />
      <input
        type="file"
        ref={videoInputRef}
        onChange={(e) => {
          if (e.target.files?.[0]) onFileUpload(e.target.files[0], 'video');
          e.target.value = '';
        }}
        accept="video/mp4,video/webm,video/x-matroska,video/quicktime,.mp4,.webm,.mkv,.mov"
        className="hidden"
      />

      <button
        type="button"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        disabled={disabled}
        className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-all flex items-center justify-center shadow-2xs border border-transparent disabled:opacity-40"
        title="Attach study material"
      >
        <Paperclip className="w-4 h-4" />
      </button>

      {isMenuOpen && (
        <div className="absolute bottom-12 left-0 z-40 w-56 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl py-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Attach Study Material
          </div>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              imageInputRef.current?.click();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            <span>Upload Image (PNG, JPG, WEBP)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              pdfInputRef.current?.click();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span>Upload PDF</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              pptInputRef.current?.click();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <Presentation className="w-4 h-4 text-orange-500" />
            <span>Upload PPT / PPTX</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              docInputRef.current?.click();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <FileCode className="w-4 h-4 text-blue-500" />
            <span>Upload Document (DOCX, TXT)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              videoInputRef.current?.click();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <Video className="w-4 h-4 text-indigo-500" />
            <span>Upload Video</span>
          </button>

          <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onOpenVideoLinkModal();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
          >
            <Link2 className="w-4 h-4 text-cyan-500" />
            <span>Add Video Link (YouTube)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsMenuOpen(false);
              onOpenLibraryModal();
            }}
            className="w-full px-3 py-2 text-xs flex items-center gap-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left font-medium"
          >
            <FolderOpen className="w-4 h-4 text-amber-500" />
            <span>My Study Resources</span>
          </button>
        </div>
      )}
    </div>
  );
};
