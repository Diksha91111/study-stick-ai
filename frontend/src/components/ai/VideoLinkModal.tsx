import React, { useState } from 'react';
import { X, Link2, AlertCircle, Loader2, CheckCircle2, Youtube } from 'lucide-react';
import { resourceService, StudyResourceItem } from '../../services/resourceService';

interface VideoLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId?: string;
  onSuccess: (resource: StudyResourceItem) => void;
}

export const VideoLinkModal: React.FC<VideoLinkModalProps> = ({
  isOpen,
  onClose,
  conversationId,
  onSuccess,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      setError('Please provide a valid video URL.');
      return;
    }

    // Basic format check
    if (!trimmed.includes('youtube.com') && !trimmed.includes('youtu.be')) {
      setError('Currently, YouTube video URLs with accessible captions are supported.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const resource = await resourceService.addVideoLink(trimmed, conversationId);
      if (resource.processingStatus === 'FAILED') {
        setError(resource.errorMessage || 'Failed to extract transcript. Captions may not be enabled on this video.');
        setIsLoading(false);
        return;
      }
      onSuccess(resource);
      setUrl('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to process video link.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center">
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Video Study Link
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Extract verified captions & transcripts for AI grounding
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              YouTube Video URL
            </label>
            <div className="relative">
              <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>
            <p className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed">
              <strong>Notice:</strong> Only videos with accessible subtitle / transcript tracks will be processed. The AI will not fabricate facts or hallucinate content for unavailable videos.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm shadow-indigo-500/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting Transcript...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Attach Video</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
