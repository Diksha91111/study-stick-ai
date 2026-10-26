import React, { useState } from 'react';
import { X, Sparkles, Lock, Globe, Clock, Users, AlertCircle } from 'lucide-react';
import { studyRoomService, CreateRoomInput } from '../../services/studyRoomService';
import { useNavigate } from 'react-router-dom';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateRoomInput>({
    name: '',
    description: '',
    goal: '',
    privacy: 'PRIVATE',
    maxMembers: 15,
    defaultFocusDurationMinutes: 45,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.goal.trim()) {
      setError('Room name and study goal are required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const room = await studyRoomService.createRoom(formData);
      if (onCreated) onCreated();
      onClose();
      navigate(`/study-rooms/${room._id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create study room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Study Room</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Set up a focused group study space</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Room Name <span className="text-rose-500">*</span>
            </label>
            <input
              id="room-name-input"
              type="text"
              required
              autoFocus
              placeholder="e.g. DSA & Algorithms Intensive"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Study Goal <span className="text-rose-500">*</span>
            </label>
            <input
              id="room-goal-input"
              type="text"
              required
              placeholder="e.g. Master Binary Trees and practice 5 LeetCode mediums"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Description <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add key milestones, topics covered, or ground rules..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Privacy Option */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Privacy Settings
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, privacy: 'PRIVATE' })}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  formData.privacy === 'PRIVATE'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs">Private Room</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Invite code only</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormData({ ...formData, privacy: 'PUBLIC' })}
                className={`p-3 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  formData.privacy === 'PUBLIC'
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs">Public Room</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Visible to all peers</div>
                </div>
              </button>
            </div>
          </div>

          {/* Duration & Max Members */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Focus Session
              </label>
              <select
                value={formData.defaultFocusDurationMinutes}
                onChange={(e) => setFormData({ ...formData, defaultFocusDurationMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 transition-all"
              >
                <option value={25}>25 minutes (Pomodoro)</option>
                <option value={45}>45 minutes (Standard)</option>
                <option value={60}>60 minutes (Deep Work)</option>
                <option value={90}>90 minutes (Ultra Focus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-500" /> Max Members
              </label>
              <input
                type="number"
                min={2}
                max={50}
                value={formData.maxMembers}
                onChange={(e) => setFormData({ ...formData, maxMembers: Math.max(2, Math.min(50, Number(e.target.value))) })}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 transition-all"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              id="create-room-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-semibold shadow-md shadow-indigo-500/20 hover:from-indigo-500 hover:to-violet-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Creating Room...' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
