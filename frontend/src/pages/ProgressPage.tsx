import React, { useState, useEffect } from 'react';
import { progressService, ProgressDashboardItem } from '../services/progressService';
import { BarChart, CheckCircle, AlertCircle, GraduationCap, RefreshCw } from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const [data, setData] = useState<ProgressDashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await progressService.getDashboard();
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load progress data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalAttempts = data.reduce((acc, item) => acc + item.attempts, 0);
  const totalCorrect = data.reduce((acc, item) => acc + item.correctAnswers, 0);
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Programming Progress</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Track your mastery of different programming topics. The AI teacher updates these metrics as you solve questions, take exams, and request hints.
        </p>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/50 p-4 border border-red-200 dark:border-red-800">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Error loading progress</h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadData}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 dark:text-red-100 dark:bg-red-800 dark:hover:bg-red-700"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="h-8 w-8 text-primary-500 animate-spin" />
          <span className="ml-3 text-gray-500 dark:text-gray-400">Loading your progress...</span>
        </div>
      ) : data.length === 0 && !error ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No progress data yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start practicing in CodeLab to see your topic-wise mastery.
          </p>
        </div>
      ) : !error && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Overall Accuracy</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{overallAccuracy}%</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Questions Attempted</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{totalAttempts}</span>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Topics Practiced</p>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">{data.length}</span>
              </div>
            </div>
          </div>

          {/* Topic Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Topic Mastery</h3>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((topic) => (
                <li key={topic.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {topic.topic}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                          ${topic.status === 'Mastered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            topic.status === 'Practicing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            topic.status === 'Needs Revision' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                          {topic.status}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {topic.correctAnswers}/{topic.attempts} Solved
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart className="w-4 h-4" />
                          {topic.hintsRequested} Hints Used
                        </span>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0">
                      {topic.mastery !== null ? (
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white">{topic.mastery}%</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Mastery</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500 italic dark:text-gray-400">Not enough data</span>
                      )}
                    </div>
                  </div>

                  {topic.recentErrors.length > 0 && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-100 dark:border-red-900/30">
                      <p className="text-sm font-medium text-red-800 dark:text-red-400 mb-1">Recent Errors to Review:</p>
                      <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                        {topic.recentErrors.map((err, idx) => (
                          <li key={idx}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
