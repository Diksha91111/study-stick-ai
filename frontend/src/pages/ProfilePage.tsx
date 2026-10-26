import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { CompetitiveGoal } from '../types';
import {
  UserCircle,
  GraduationCap,
  Sparkles,
  Save,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
} from 'lucide-react';
import { NotificationSettingsCard } from '../components/profile/NotificationSettingsCard';

export const ProfilePage: React.FC = () => {
  const { user, profile, refreshProfile, changePassword } = useAuth();

  const [collegeName, setCollegeName] = useState('');
  const [degree, setDegree] = useState('B.Tech / B.E.');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [currentSemester, setCurrentSemester] = useState(5);
  const [currentYear, setCurrentYear] = useState(3);
  const [targetDailyStudyHours, setTargetDailyStudyHours] = useState(6);
  const [chronotype, setChronotype] = useState<
    'early_bird' | 'night_owl' | 'intermediate'
  >('intermediate');
  const [pomodoroWorkMins, setPomodoroWorkMins] = useState(45);
  const [pomodoroBreakMins, setPomodoroBreakMins] = useState(10);

  // Competitive goals
  const [competitiveExams, setCompetitiveExams] = useState<CompetitiveGoal[]>([]);
  const [newExamName, setNewExamName] = useState('');
  const [newExamYear, setNewExamYear] = useState(new Date().getFullYear() + 1);

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [isChangingPwd, setIsChangingPwd] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setCollegeName(profile.collegeName || '');
      setDegree(profile.degree || 'B.Tech / B.E.');
      setBranch(profile.branch || 'Computer Science');
      setCurrentSemester(profile.currentSemester || 5);
      setCurrentYear(profile.currentYear || 3);
      setTargetDailyStudyHours(profile.targetDailyStudyHours || 6);
      setChronotype(profile.chronotype || 'intermediate');
      setPomodoroWorkMins(profile.pomodoroWorkMins || 45);
      setPomodoroBreakMins(profile.pomodoroBreakMins || 10);
      setCompetitiveExams(profile.targetCompetitiveExams || []);
    }
  }, [profile]);

  const addCompetitiveGoal = () => {
    if (!newExamName.trim()) return;
    setCompetitiveExams((prev) => [
      ...prev,
      { examName: newExamName.trim(), targetYear: Number(newExamYear) },
    ]);
    setNewExamName('');
  };

  const removeCompetitiveGoal = (idx: number) => {
    setCompetitiveExams((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPwdError('New passwords do not match.');
      return;
    }

    setIsChangingPwd(true);
    try {
      const res = await changePassword(currentPassword, newPassword, confirmNewPassword);
      setPwdSuccess(res.message || 'Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => setPwdSuccess(null), 4000);
    } catch (err: any) {
      setPwdError(err.response?.data?.message || 'Failed to update password.');
    } finally {
      setIsChangingPwd(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);

    try {
      await authService.updateProfile({
        collegeName,
        degree,
        branch,
        currentSemester: Number(currentSemester),
        currentYear: Number(currentYear),
        targetDailyStudyHours: Number(targetDailyStudyHours),
        chronotype,
        pomodoroWorkMins: Number(pomodoroWorkMins),
        pomodoroBreakMins: Number(pomodoroBreakMins),
        targetCompetitiveExams: competitiveExams,
      });

      await refreshProfile();
      setSuccessMessage('Profile and study preferences updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCircle className="w-6 h-6 text-indigo-600" />
          Student Academic Profile & Aspirations
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
          Personalize your university program details, competitive exam targets (GATE, UPSC, etc.), and daily study goals
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Identity Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Student Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                disabled
                value={user?.name || ''}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* University & Degree Details */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-500" />
            University Academic Track
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                College / Institute Name
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g. National Institute of Technology"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Degree Program
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="e.g. B.Tech / B.E."
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Branch / Discipline
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="e.g. Computer Science"
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Current Semester
              </label>
              <input
                type="number"
                min="1"
                max="12"
                value={currentSemester}
                onChange={(e) => setCurrentSemester(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Academic Year
              </label>
              <input
                type="number"
                min="1"
                max="6"
                value={currentYear}
                onChange={(e) => setCurrentYear(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Competitive Exam Goals */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Competitive Exam Aspirations (GATE, UPSC, SSC, GRE, etc.)
          </h3>

          <div className="flex gap-2">
            <input
              type="text"
              value={newExamName}
              onChange={(e) => setNewExamName(e.target.value)}
              placeholder="e.g. GATE Computer Science, UPSC CSE, CAT"
              className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="number"
              value={newExamYear}
              onChange={(e) => setNewExamYear(Number(e.target.value))}
              className="w-28 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="button"
              onClick={addCompetitiveGoal}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add Goal
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {competitiveExams.map((goal, idx) => (
              <div
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold"
              >
                <span>
                  {goal.examName} ({goal.targetYear})
                </span>
                <button
                  type="button"
                  onClick={() => removeCompetitiveGoal(idx)}
                  className="hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Study Habits & Pomodoro Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            Study Habits & Focus Preferences
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Target Daily Study Hours
              </label>
              <input
                type="number"
                min="1"
                max="18"
                value={targetDailyStudyHours}
                onChange={(e) => setTargetDailyStudyHours(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chronotype Preference
              </label>
              <select
                value={chronotype}
                onChange={(e: any) => setChronotype(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="early_bird">🌅 Early Bird (Morning Focus)</option>
                <option value="night_owl">🌙 Night Owl (Late Night Focus)</option>
                <option value="intermediate">⚡ Intermediate / Balanced</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Focus Session / Break (Mins)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={pomodoroWorkMins}
                  onChange={(e) => setPomodoroWorkMins(Number(e.target.value))}
                  placeholder="Work"
                  className="w-1/2 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  value={pomodoroBreakMins}
                  onChange={(e) => setPomodoroBreakMins(Number(e.target.value))}
                  placeholder="Break"
                  className="w-1/2 px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Saving Profile...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>

      {/* Study Notifications & Reminders Card */}
      <NotificationSettingsCard />

      {/* Change Password Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-rose-500" />
          Account Security & Change Password
        </h3>

        {pwdError && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900">
            {pwdError}
          </div>
        )}
        {pwdSuccess && (
          <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />{pwdSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, show: showCurrentPwd, toggle: () => setShowCurrentPwd(s => !s) },
              { label: 'New Password (Min 6 chars)', value: newPassword, setter: setNewPassword, show: showNewPwd, toggle: () => setShowNewPwd(s => !s) },
              { label: 'Confirm New Password', value: confirmNewPassword, setter: setConfirmNewPassword, show: showConfirmPwd, toggle: () => setShowConfirmPwd(s => !s) },
            ].map(({ label, value, setter, show, toggle }) => (
              <div key={label}>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    value={value}
                    onChange={(e) => setter(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isChangingPwd}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md shadow-rose-600/25 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              <ShieldCheck className="w-4 h-4" />
              {isChangingPwd ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
