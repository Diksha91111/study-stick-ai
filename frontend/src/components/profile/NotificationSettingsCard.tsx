import React, { useState, useEffect } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  Clock,
  Moon,
  Globe,
  CheckCircle2,
  AlertCircle,
  Send,
  ShieldAlert,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import { NotificationPreferences } from '../../types';

export const NotificationSettingsCard: React.FC = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    inAppEnabled: true,
    emailEnabled: true,
    whatsappEnabled: false,
    categories: {
      studySessions: true,
      tasks: true,
      exams: true,
      learningPath: true,
      flashcards: true,
      dailyPlan: true,
      weeklySummary: true,
    },
    reminderTimings: {
      studySessions: 15,
      tasks: 1440,
      exams: 4320,
      dailyPlanTime: '08:00',
      weeklySummaryDay: 0,
      weeklySummaryTime: '19:00',
    },
    quietHours: {
      enabled: true,
      startTime: '22:30',
      endTime: '07:00',
    },
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
    whatsapp: {
      phoneNumber: '',
      consentGiven: false,
      verificationStatus: 'unverified',
    },
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Test send state
  const [testStatus, setTestStatus] = useState<{
    channel: 'email' | 'whatsapp' | null;
    loading: boolean;
    success?: boolean;
    isSimulated?: boolean;
    statusText?: string;
    error?: string;
  }>({
    channel: null,
    loading: false,
  });

  // Load preferences from backend
  useEffect(() => {
    const fetchPrefs = async () => {
      try {
        setIsLoading(true);
        const data = await notificationService.getPreferences();
        if (data) {
          setPreferences((prev) => ({
            ...prev,
            ...data,
            categories: { ...prev.categories, ...(data.categories || {}) },
            reminderTimings: { ...prev.reminderTimings, ...(data.reminderTimings || {}) },
            quietHours: { ...prev.quietHours, ...(data.quietHours || {}) },
            whatsapp: { ...prev.whatsapp, ...(data.whatsapp || {}) },
          }));
        }
      } catch (err: any) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPrefs();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    // Validation for WhatsApp if enabled
    if (preferences.whatsappEnabled) {
      if (!preferences.whatsapp.phoneNumber || !preferences.whatsapp.phoneNumber.startsWith('+')) {
        setSaveError('Please enter a valid international phone number starting with + (e.g. +919876543210).');
        setIsSaving(false);
        return;
      }
      if (!preferences.whatsapp.consentGiven) {
        setSaveError('You must grant explicit consent to receive WhatsApp study notifications.');
        setIsSaving(false);
        return;
      }
    }

    try {
      const updated = await notificationService.updatePreferences(preferences);
      setPreferences(updated);
      setSaveSuccess('Notification preferences saved successfully!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to save preferences';
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async (channel: 'email' | 'whatsapp') => {
    setTestStatus({ channel, loading: true });
    try {
      const res = await notificationService.sendTestNotification(channel);
      setTestStatus({
        channel,
        loading: false,
        success: res.success,
        isSimulated: res.isSimulated,
        statusText: res.status,
        error: res.error,
      });
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Test notification failed';
      setTestStatus({
        channel,
        loading: false,
        success: false,
        error: msg,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 animate-pulse text-xs text-slate-400 text-center py-10">
        Loading notification settings...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-500" />
            Study Notifications & Reminders
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Personalize real-time study alerts across In-App, Email, and official WhatsApp channels.
          </p>
        </div>

        <button
          type="button"
          onClick={() => handleSave()}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto transition-all"
        >
          <Save className="w-3.5 h-3.5" />
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
          {saveSuccess}
        </div>
      )}

      {saveError && (
        <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-200 dark:border-rose-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          {saveError}
        </div>
      )}

      {/* SECTION 1: DELIVERY CHANNELS */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          1. Delivery Channels
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* In-App Channel */}
          <div
            onClick={() =>
              setPreferences((p) => ({ ...p, inAppEnabled: !p.inAppEnabled }))
            }
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferences.inAppEnabled
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">In-App Alerts</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Bell icon & popup panel</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.inAppEnabled}
                onChange={() => {}}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          {/* Email Channel */}
          <div
            onClick={() =>
              setPreferences((p) => ({ ...p, emailEnabled: !p.emailEnabled }))
            }
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferences.emailEnabled
                ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Email Alerts</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Branded email digest</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={() => {}}
                className="w-4 h-4 text-indigo-600 rounded"
              />
            </div>
          </div>

          {/* WhatsApp Channel */}
          <div
            onClick={() =>
              setPreferences((p) => ({ ...p, whatsappEnabled: !p.whatsappEnabled }))
            }
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              preferences.whatsappEnabled
                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">WhatsApp Reminders</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Official provider API</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.whatsappEnabled}
                onChange={() => {}}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>
          </div>
        </div>
      </div>

      {/* WHATSAPP SETUP DRAWER (if WhatsApp is enabled or toggled) */}
      {preferences.whatsappEnabled && (
        <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">
                Official WhatsApp Study Reminders Setup
              </span>
              <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                Study Stick AI delivers direct, timely session reminders and exam countdowns via an official WhatsApp API provider. We protect your privacy and you can opt out at any time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp Phone Number (E.164 with Country Code)
              </label>
              <input
                type="tel"
                value={preferences.whatsapp.phoneNumber}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    whatsapp: { ...p.whatsapp, phoneNumber: e.target.value },
                  }))
                }
                placeholder="+919876543210"
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Format: +[CountryCode][Number], e.g. +91 9876543210 (India), +1 5551234567 (USA)
              </span>
            </div>

            <div className="flex items-center">
              <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={preferences.whatsapp.consentGiven}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      whatsapp: { ...p.whatsapp, consentGiven: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 text-emerald-600 rounded mt-0.5"
                />
                <span className="leading-tight text-[11px]">
                  <strong>Explicit Consent:</strong> I agree to receive automated study session and exam reminders via WhatsApp. I can revoke this permission anytime.
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: STUDY REMINDER CATEGORIES */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          2. Categories
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {[
            { key: 'studySessions', label: 'Study Sessions', desc: 'Starting alerts & rescheduling' },
            { key: 'tasks', label: 'Tasks & Deadlines', desc: 'Due date alerts & milestones' },
            { key: 'exams', label: 'Exams & Countdown', desc: 'Upcoming college & competitive exams' },
            { key: 'flashcards', label: 'Flashcard Reviews', desc: 'Spaced repetition due alerts' },
            { key: 'learningPath', label: 'Learning Path', desc: 'Recommended next concepts' },
            { key: 'dailyPlan', label: 'Daily Study Plan', desc: 'Morning schedule overview' },
            { key: 'weeklySummary', label: 'Weekly Summary', desc: 'Persisted study analytics' },
          ].map(({ key, label, desc }) => {
            const isChecked = (preferences.categories as any)[key] ?? true;
            return (
              <label
                key={key}
                className="flex items-start gap-2.5 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      categories: { ...p.categories, [key]: e.target.checked },
                    }))
                  }
                  className="w-4 h-4 text-indigo-600 rounded mt-0.5"
                />
                <div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{desc}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: REMINDER TIMINGS */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-indigo-500" />
          3. Reminder Timings & Schedules
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Study Sessions Reminder
            </label>
            <select
              value={preferences.reminderTimings.studySessions}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  reminderTimings: {
                    ...p.reminderTimings,
                    studySessions: Number(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value={10}>10 minutes before</option>
              <option value={15}>15 minutes before</option>
              <option value={30}>30 minutes before</option>
              <option value={60}>1 hour before</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Task Deadline Reminder
            </label>
            <select
              value={preferences.reminderTimings.tasks}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  reminderTimings: {
                    ...p.reminderTimings,
                    tasks: Number(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value={60}>1 hour before</option>
              <option value={1440}>1 day before</option>
              <option value={2880}>2 days before</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Exam Reminder
            </label>
            <select
              value={preferences.reminderTimings.exams}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  reminderTimings: {
                    ...p.reminderTimings,
                    exams: Number(e.target.value),
                  },
                }))
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value={1440}>1 day before</option>
              <option value={4320}>3 days before</option>
              <option value={10080}>1 week before</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Daily Study Plan Time
            </label>
            <input
              type="time"
              value={preferences.reminderTimings.dailyPlanTime}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  reminderTimings: {
                    ...p.reminderTimings,
                    dailyPlanTime: e.target.value,
                  },
                }))
              }
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Weekly Progress Summary (Day & Time)
            </label>
            <div className="flex gap-2">
              <select
                value={preferences.reminderTimings.weeklySummaryDay}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    reminderTimings: {
                      ...p.reminderTimings,
                      weeklySummaryDay: Number(e.target.value),
                    },
                  }))
                }
                className="w-1/2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value={0}>Sunday</option>
                <option value={1}>Monday</option>
                <option value={5}>Friday</option>
                <option value={6}>Saturday</option>
              </select>
              <input
                type="time"
                value={preferences.reminderTimings.weeklySummaryTime}
                onChange={(e) =>
                  setPreferences((p) => ({
                    ...p,
                    reminderTimings: {
                      ...p.reminderTimings,
                      weeklySummaryTime: e.target.value,
                    },
                  }))
                }
                className="w-1/2 px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: QUIET HOURS & TIMEZONE */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
            <Moon className="w-3.5 h-3.5 text-indigo-500" />
            4. Quiet Hours & User Timezone
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={preferences.quietHours.enabled}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  quietHours: { ...p.quietHours, enabled: e.target.checked },
                }))
              }
              className="w-4 h-4 text-indigo-600 rounded"
            />
            Enable Quiet Hours
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quiet Hours Start
            </label>
            <input
              type="time"
              disabled={!preferences.quietHours.enabled}
              value={preferences.quietHours.startTime}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  quietHours: { ...p.quietHours, startTime: e.target.value },
                }))
              }
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Quiet Hours End
            </label>
            <input
              type="time"
              disabled={!preferences.quietHours.enabled}
              value={preferences.quietHours.endTime}
              onChange={(e) =>
                setPreferences((p) => ({
                  ...p,
                  quietHours: { ...p.quietHours, endTime: e.target.value },
                }))
              }
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-500" />
              Your Timezone
            </label>
            <select
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences((p) => ({ ...p, timezone: e.target.value }))
              }
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="Asia/Kolkata">Asia/Kolkata (IST, UTC+5:30)</option>
              <option value="UTC">UTC (Coordinated Universal Time)</option>
              <option value="America/New_York">America/New_York (EST/EDT)</option>
              <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
              <option value="Europe/London">Europe/London (GMT/BST)</option>
              <option value="Europe/Berlin">Europe/Berlin (CET)</option>
              <option value="Asia/Dubai">Asia/Dubai (GST, UTC+4)</option>
              <option value="Asia/Singapore">Asia/Singapore (SGT, UTC+8)</option>
            </select>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Reminders that fall during quiet hours will be held safely and delivered right after quiet hours end, ensuring uninterrupted sleep.
        </p>
      </div>

      {/* SECTION 5: TEST NOTIFICATIONS */}
      <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          5. Channel Diagnostics & Delivery Test
        </label>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Send a simulated test notification to verify your email or WhatsApp configuration.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={testStatus.loading}
            onClick={() => handleTestSend('email')}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <Mail className="w-3.5 h-3.5 text-blue-500" />
            {testStatus.loading && testStatus.channel === 'email'
              ? 'Sending Test Email...'
              : 'Send Test Email'}
          </button>

          <button
            type="button"
            disabled={
              testStatus.loading ||
              !preferences.whatsapp.consentGiven ||
              !preferences.whatsapp.phoneNumber
            }
            onClick={() => handleTestSend('whatsapp')}
            title={
              !preferences.whatsapp.consentGiven
                ? 'Requires explicit WhatsApp consent'
                : 'Send test WhatsApp reminder'
            }
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
            {testStatus.loading && testStatus.channel === 'whatsapp'
              ? 'Sending Test WhatsApp...'
              : 'Send Test WhatsApp'}
          </button>
        </div>

        {testStatus.channel && !testStatus.loading && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
              testStatus.success
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            {testStatus.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">
                {testStatus.success
                  ? `${testStatus.channel.toUpperCase()} Test Completed Successfully`
                  : `${testStatus.channel.toUpperCase()} Test Failed`}
              </div>
              <div className="text-[11px] mt-0.5 opacity-90">
                {testStatus.isSimulated
                  ? 'Status: Simulated Delivery (Logged on backend in development mode without sending actual third-party message).'
                  : testStatus.error || `Status: ${testStatus.statusText || 'Sent'}`}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
