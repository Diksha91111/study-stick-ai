import React, { useState, useEffect } from 'react';

interface CountdownTimerProps {
  targetDate: string | Date;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showSeconds?: boolean;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  targetDate,
  label,
  size = 'md',
  showSeconds = true,
}) => {
  const calculateTimeLeft = () => {
    const diff = new Date(targetDate).getTime() - new Date().getTime();
    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isPassed: true };
    }

    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isPassed: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (timeLeft.isPassed) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
        Deadline Passed
      </span>
    );
  }

  const isUrgent = timeLeft.days === 0 && timeLeft.hours < 24;

  if (size === 'sm') {
    return (
      <div className={`inline-flex items-center gap-1 font-mono text-xs font-semibold ${
        isUrgent ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-slate-600 dark:text-slate-400'
      }`}>
        <span>{timeLeft.days}d</span>
        <span>{timeLeft.hours}h</span>
        <span>{timeLeft.minutes}m</span>
      </div>
    );
  }

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center">
        {label && <p className="text-xs uppercase tracking-wider text-indigo-200 mb-2 font-medium">{label}</p>}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20 min-w-[56px] sm:min-w-[70px]">
            <span className="font-mono text-xl sm:text-3xl font-extrabold text-white">{timeLeft.days}</span>
            <span className="text-[10px] sm:text-xs text-indigo-200 font-medium">Days</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-white/60">:</span>
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20 min-w-[56px] sm:min-w-[70px]">
            <span className="font-mono text-xl sm:text-3xl font-extrabold text-white">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[10px] sm:text-xs text-indigo-200 font-medium">Hours</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-white/60">:</span>
          <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20 min-w-[56px] sm:min-w-[70px]">
            <span className="font-mono text-xl sm:text-3xl font-extrabold text-white">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[10px] sm:text-xs text-indigo-200 font-medium">Mins</span>
          </div>
          {showSeconds && (
            <>
              <span className="text-xl sm:text-2xl font-bold text-white/60">:</span>
              <div className="flex flex-col items-center bg-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20 min-w-[56px] sm:min-w-[70px]">
                <span className="font-mono text-xl sm:text-3xl font-extrabold text-amber-300">{String(timeLeft.seconds).padStart(2, '0')}</span>
                <span className="text-[10px] sm:text-xs text-indigo-200 font-medium">Secs</span>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Medium (default)
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border font-mono text-sm font-semibold ${
      isUrgent
        ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/40 dark:border-rose-800/60 dark:text-rose-400'
        : 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
    }`}>
      <span>{timeLeft.days}d</span>:
      <span>{String(timeLeft.hours).padStart(2, '0')}h</span>:
      <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
      {showSeconds && <span>:{String(timeLeft.seconds).padStart(2, '0')}s</span>}
    </div>
  );
};
