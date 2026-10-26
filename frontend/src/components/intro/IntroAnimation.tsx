import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckSquare,
  Calendar,
  Clock,
  Target,
  BarChart2,
  BookMarked,
  Zap,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Layers,
  Compass,
  Award,
  RefreshCw
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface IntroAnimationProps {
  onComplete: () => void;
}

export const IntroAnimation: React.FC<IntroAnimationProps> = ({ onComplete }) => {
  const { theme } = useTheme();
  // Phase 1 (0-0.7s), Phase 2 (0.7-1.5s), Phase 3 (1.5-2.2s), Phase 4 (2.2-2.8s), Phase 5 (2.8-3.5s), Phase 6 (3.5-4.0s fade out)
  const [phase, setPhase] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    // Timeline timers matching requirements:
    // 0 - 0.7s: Phase 1 (Floating scattered elements)
    // 0.7 - 1.5s: Phase 2 (Converge into AI logo)
    // 1.5 - 2.2s: Phase 3 (Generic Today's Study Plan)
    // 2.2 - 2.8s: Phase 4 (Progress animation: Plan -> Learn -> Practice -> Progress -> Goal)
    // 2.8 - 3.5s: Phase 5 (Study Stick AI logo + Tagline)
    // 3.5 - 4.0s: Phase 6 (Fade out into Landing Page)

    const timer1 = setTimeout(() => setPhase(2), 700);
    const timer2 = setTimeout(() => setPhase(3), 1500);
    const timer3 = setTimeout(() => setPhase(4), 2200);
    const timer4 = setTimeout(() => setPhase(5), 2800);
    const timer5 = setTimeout(() => {
      setPhase(6);
      setFadingOut(true);
    }, 3500);
    const timer6 = setTimeout(() => {
      onComplete();
    }, 3950);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
      clearTimeout(timer6);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 300);
  };

  // 7 Generic Scattered Study Workload Elements
  const studyElements = [
    { id: 'books', icon: BookOpen, label: 'Books', color: 'from-purple-500 to-indigo-500', pos: '-translate-x-32 -translate-y-28 sm:-translate-x-56 sm:-translate-y-40' },
    { id: 'tasks', icon: CheckSquare, label: 'Task Card', color: 'from-blue-500 to-indigo-500', pos: 'translate-x-36 -translate-y-24 sm:translate-x-56 sm:-translate-y-36' },
    { id: 'calendar', icon: Calendar, label: 'Calendar', color: 'from-purple-600 to-pink-500', pos: '-translate-x-44 translate-y-6 sm:-translate-x-64 sm:translate-y-10' },
    { id: 'clock', icon: Clock, label: 'Clock', color: 'from-amber-500 to-orange-500', pos: 'translate-x-40 translate-y-8 sm:translate-x-64 sm:translate-y-12' },
    { id: 'goal', icon: Target, label: 'Goal', color: 'from-emerald-500 to-teal-500', pos: '-translate-x-28 translate-y-32 sm:-translate-x-40 sm:translate-y-44' },
    { id: 'chart', icon: BarChart2, label: 'Progress Chart', color: 'from-indigo-500 to-violet-600', pos: 'translate-x-28 translate-y-32 sm:translate-x-44 sm:translate-y-44' },
    { id: 'notes', icon: BookMarked, label: 'Study Notes', color: 'from-violet-500 to-purple-600', pos: 'translate-y-[-140px] sm:translate-y-[-190px]' }
  ];

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-opacity duration-500 ease-in-out select-none ${
        fadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${
        theme === 'dark'
          ? 'bg-slate-950 text-white'
          : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Background Decorative Ambient Particles & Glowing Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl transition-all duration-1000 ${
            theme === 'dark' ? 'bg-purple-900/30' : 'bg-purple-300/40'
          }`}
        />
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full blur-2xl transition-all duration-1000 delay-300 ${
            theme === 'dark' ? 'bg-indigo-900/40' : 'bg-indigo-300/40'
          }`}
        />

        {/* Soft Floating Particles */}
        <div className="absolute top-1/4 left-1/5 w-3 h-3 rounded-full bg-purple-400/40 animate-ping" />
        <div className="absolute bottom-1/3 right-1/4 w-2 h-2 rounded-full bg-indigo-400/50 animate-pulse" />
        <div className="absolute top-1/3 right-1/5 w-2.5 h-2.5 rounded-full bg-amber-400/40 animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-3 h-3 rounded-full bg-emerald-400/40 animate-ping" />
      </div>

      {/* Skip Button (Accessibility & UX control) */}
      <button
        onClick={handleSkip}
        className="absolute top-6 right-6 z-20 px-3.5 py-1.5 rounded-full bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 backdrop-blur-md transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
      >
        <span>Skip</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Main Animation Display Container */}
      <div className="relative z-10 w-full max-w-xl px-4 flex flex-col items-center justify-center min-h-[420px]">
        {/* ==================== PHASE 1 & 2: SCATTERED ELEMENTS CONVERGING INTO AI ==================== */}
        {(phase === 1 || phase === 2) && (
          <div className="relative w-full h-[360px] flex items-center justify-center">
            {/* Center AI Sparkle Icon (Appears in Phase 2) */}
            <div
              className={`absolute z-20 transition-all duration-700 transform flex flex-col items-center justify-center ${
                phase === 2
                  ? 'scale-100 opacity-100 rotate-0'
                  : 'scale-0 opacity-0 -rotate-45'
              }`}
            >
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-2xl shadow-purple-500/40 border-2 border-white/80 dark:border-slate-700 animate-pulse">
                  <Zap className="w-12 h-12 fill-current text-white animate-bounce-subtle" />
                </div>
                <Sparkles className="w-8 h-8 text-amber-300 absolute -top-3 -right-3 animate-spin-slow fill-current" />
              </div>
              <span className="mt-3 text-xs font-black tracking-widest uppercase text-purple-600 dark:text-purple-400">
                AI Understanding Workload
              </span>
            </div>

            {/* Scattered Study Workload Items */}
            {studyElements.map((item) => {
              const IconComp = item.icon;
              return (
                <div
                  key={item.id}
                  className={`absolute z-10 p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-purple-100 dark:border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-2.5 transition-all duration-700 ease-in-out transform ${
                    phase === 1
                      ? `${item.pos} opacity-100 scale-100 animate-float`
                      : 'translate-x-0 translate-y-0 opacity-0 scale-30'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center shadow-xs shrink-0`}
                  >
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap hidden sm:inline">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* ==================== PHASE 3: GENERIC TODAY'S STUDY PLAN ==================== */}
        {phase === 3 && (
          <div className="w-full max-w-sm sm:max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border-2 border-purple-500/80 dark:border-purple-500 shadow-2xl shadow-purple-500/20 space-y-4 animate-scale-up">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  TODAY'S STUDY PLAN
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                ✨ AI Personalized
              </span>
            </div>

            {/* Generic List Items (No Specific Subjects) */}
            <div className="space-y-2.5">
              {[
                { title: 'Study Session', type: 'Focus Block', icon: BookOpen, color: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950' },
                { title: 'Assignment', type: 'Task Module', icon: CheckSquare, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950' },
                { title: 'Revision', type: 'Spaced Review', icon: RefreshCw, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950' },
                { title: 'Practice', type: 'Quiz & Self Test', icon: Target, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950' },
                { title: 'Goal', type: 'Milestone Target', icon: Award, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950' }
              ].map((item, idx) => {
                const ItemIcon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 transition-all hover:border-purple-300"
                    style={{ animationDelay: `${idx * 100}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                        <ItemIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {item.title}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {item.type}
                        </div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================== PHASE 4: PROGRESS ANIMATION ==================== */}
        {phase === 4 && (
          <div className="w-full max-w-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-purple-200 dark:border-purple-900/60 shadow-2xl space-y-6 text-center animate-scale-up">
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400">
                Continuous Learning Journey
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Progress Flow Matrix
              </h3>
            </div>

            {/* Horizontal Progress Timeline: Plan -> Learn -> Practice -> Progress -> Goal */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {[
                { title: 'Plan', icon: Compass, color: 'from-purple-500 to-purple-600' },
                { title: 'Learn', icon: BookOpen, color: 'from-indigo-500 to-indigo-600' },
                { title: 'Practice', icon: CheckSquare, color: 'from-blue-500 to-blue-600' },
                { title: 'Progress', icon: TrendingUp, color: 'from-violet-500 to-violet-600' },
                { title: 'Goal', icon: Target, color: 'from-emerald-500 to-emerald-600' }
              ].map((step, idx) => {
                const StepIcon = step.icon;
                return (
                  <div key={step.title} className="flex flex-col items-center gap-2 group">
                    <div
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr ${step.color} text-white flex items-center justify-center shadow-lg shadow-purple-500/20 transition-all transform hover:scale-110`}
                      style={{ animation: `pulse-subtle 1.5s ease-in-out infinite ${idx * 200}ms` }}
                    >
                      <StepIcon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Animated Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
              <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 h-full rounded-full w-full transition-all duration-700 ease-out animate-pulse" />
            </div>
          </div>
        )}

        {/* ==================== PHASE 5: BRAND REVEAL & TAGLINE ==================== */}
        {(phase === 5 || phase === 6) && (
          <div className="text-center space-y-6 max-w-md animate-scale-up">
            {/* Logo Icon */}
            <div className="inline-flex relative">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-2xl shadow-purple-600/40 border-2 border-white/80 dark:border-slate-700 mx-auto">
                <Zap className="w-10 h-10 fill-current" />
              </div>
              <Sparkles className="w-7 h-7 text-amber-300 absolute -top-2 -right-2 animate-ping" />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                  Study Stick
                </h1>
                <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-black tracking-wider uppercase shadow-sm">
                  AI
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
                Plan. Learn. Practice. Analyze. Adapt. Improve.
              </p>
            </div>

            {/* Soft Spinner Indicator */}
            <div className="pt-2 flex justify-center items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
              <span>Entering Workspace...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
