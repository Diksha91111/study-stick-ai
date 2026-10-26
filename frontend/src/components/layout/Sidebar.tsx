import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  GraduationCap,
  Moon,
  UserCircle,
  Zap,
  Sparkles,
  Bot,
  BarChart3,
  Network,
  Code2,
  Map,
  Layers,
  Users
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainNavLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/planner', label: 'Unified Planner', icon: CalendarDays },
    { to: '/study-rooms', label: 'Study Rooms', icon: Users },
    { to: '/assistant', label: 'AI Study Assistant', icon: Bot },
    { to: '/codelab', label: 'AI Code Lab', icon: Code2 },
    { to: '/progress', label: 'AI Code Progress', icon: BarChart3 },
    { to: '/learning-path', label: 'AI Learning Path', icon: Map },
    { to: '/knowledge-graph', label: 'Knowledge Graph', icon: Network },
    { to: '/revision', label: 'AI Flashcards', icon: Layers },
    { to: '/timetable', label: 'Weekly Timetable', icon: CalendarDays },
    { to: '/academic', label: 'Academics & Tasks', icon: BookOpen },
    { to: '/exams', label: 'Exams & Countdowns', icon: GraduationCap },
    { to: '/sleep', label: 'Sleep & Routine', icon: Moon },
    { to: '/profile', label: 'Student Profile', icon: UserCircle },
  ];

  const upcomingModules: Array<{ label: string; icon: any }> = [
    { label: 'Virtual Hackathon', icon: Sparkles },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800/80 flex flex-col justify-between shrink-0 transition-colors duration-300 select-none">
      <div>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200/80 dark:border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 transition-transform duration-300 hover:scale-105">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white">
                Study Stick
              </span>
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-xs">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              Academics + Exam Prep
            </p>
          </div>
        </div>

        {/* Primary Navigation */}
        <div className="px-3 py-4 space-y-1">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
            Planning & Routine
          </p>
          {mainNavLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ease-out ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-50 to-indigo-50/40 text-indigo-600 dark:from-indigo-950/70 dark:to-indigo-950/20 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 shadow-sm shadow-indigo-500/10'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 hover:translate-x-0.5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-indigo-500 to-violet-600 dark:from-indigo-400 dark:to-violet-400 shadow-sm shadow-indigo-500/50 animate-fade-in" />
                    )}
                    <Icon
                      className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400'
                      }`}
                    />
                    <span className="truncate">{link.label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Upcoming Modules Section */}
        <div className="px-3 pt-2">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50/70 to-slate-100/50 dark:from-slate-900/60 dark:via-slate-900/40 dark:to-indigo-950/20 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 animate-pulse" />
                Upcoming Modules
              </span>
            </div>
            <div className="space-y-1.5">
              {upcomingModules.map((module) => {
                const Icon = module.icon;
                return (
                  <div
                    key={module.label}
                    className="group flex items-center gap-2.5 text-xs font-medium text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/40 shadow-2xs hover:shadow-md hover:shadow-indigo-500/10 hover:border-indigo-300/70 dark:hover:border-indigo-700/60 hover:bg-white dark:hover:bg-slate-800 hover:-translate-y-0.5 transition-all duration-250 ease-out cursor-default"
                  >
                    <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/80 transition-all duration-200">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="truncate">{module.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end">
        <span className="text-[11px] font-mono font-medium text-slate-400 dark:text-slate-500 tracking-wider">
          v1.0.0
        </span>
      </div>
    </aside>
  );
};

