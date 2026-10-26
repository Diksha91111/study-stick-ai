import React, { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import {
  Play,
  RotateCcw,
  Terminal,
  ShieldCheck,
  ShieldAlert,
  Clock,
  HardDrive,
  Code2,
  AlertCircle,
  CheckCircle2,
  FileCode2,
  Sliders,
  ChevronDown,
  Info,
  Sparkles,
} from 'lucide-react';
import {
  runCode,
  SupportedLanguage,
  ExecutionResponseData,
} from '../services/executionService';
import { CodeAssistantPanel } from '../components/codelab/CodeAssistantPanel';
import { CodeDiffViewer } from '../components/codelab/CodeDiffViewer';

const DEFAULT_SNIPPETS: Record<SupportedLanguage, string> = {
  python: `# Python Code Lab Demo
def calculate_fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("🐍 Fibonacci Sequence (first 10 terms):")
print(calculate_fibonacci(10))
`,
  javascript: `// JavaScript Code Lab Demo
function greetStudent(name, course) {
  console.log(\`🚀 Welcome to AI Code Lab, \${name}!\`);
  console.log(\`📚 Enrolled Course: \${course}\`);
  
  const scores = [88, 92, 95, 100, 94];
  const average = scores.reduce((acc, curr) => acc + curr, 0) / scores.length;
  console.log("Average Score:", average.toFixed(2));
}

greetStudent("Alex", "Computer Science 101");
`,
  c: `// C Code Lab Demo
#include <stdio.h>

int main() {
    printf("⚡ Hello from Sandboxed C Program!\\n");
    int sum = 0;
    for (int i = 1; i <= 10; i++) {
        sum += i;
    }
    printf("Sum of first 10 integers: %d\\n", sum);
    return 0;
}
`,
  cpp: `// C++ Code Lab Demo
#include <iostream>
#include <vector>

int main() {
    std::cout << "🚀 C++ Sandboxed Execution Engine\\n";
    std::vector<int> numbers = {10, 20, 30, 40, 50};
    int total = 0;
    for (int n : numbers) {
        total += n;
    }
    std::cout << "Vector sum: " << total << std::endl;
    return 0;
}
`,
  java: `// Java Code Lab Demo
public class Main {
    public static void main(String[] args) {
        System.out.println("☕ Hello from Sandboxed Java Execution Engine!");
        int result = multiply(7, 6);
        System.out.println("7 * 6 = " + result);
    }

    private static int multiply(int a, int b) {
        return a * b;
    }
}
`,
};

const LANGUAGE_LABELS: Record<SupportedLanguage, { label: string; monacoLang: string; color: string }> = {
  python: { label: 'Python 3', monacoLang: 'python', color: 'from-amber-500 to-yellow-600' },
  javascript: { label: 'JavaScript (Node.js)', monacoLang: 'javascript', color: 'from-yellow-400 to-amber-500' },
  c: { label: 'C (GCC)', monacoLang: 'c', color: 'from-blue-500 to-indigo-600' },
  cpp: { label: 'C++ (G++)', monacoLang: 'cpp', color: 'from-indigo-500 to-violet-600' },
  java: { label: 'Java (OpenJDK)', monacoLang: 'java', color: 'from-red-500 to-rose-600' },
};

export const CodeLabPage: React.FC = () => {
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState<string>(DEFAULT_SNIPPETS['python']);
  const [stdin, setStdin] = useState<string>('');
  const [showStdin, setShowStdin] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'stdout' | 'stderr' | 'stdin' | 'security'>('stdout');
  const [executionResult, setExecutionResult] = useState<ExecutionResponseData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // AI Assistant & Diff Preview state
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [selectedCode, setSelectedCode] = useState<string>('');
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [diffProposal, setDiffProposal] = useState<{
    explanation: string;
    proposedCode: string;
    originalSnapshot: string;
    language: string;
  } | null>(null);

  // Layout & Resizing State
  const editorRef = useRef<any>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);
  const activeDivider = useRef<'d1' | 'd2' | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Proportional widths for Desktop
  // Closed: Editor ~55%, Terminal ~45%
  // Open: Editor ~45%, Terminal ~30%, Copilot ~25%
  const [openWidths, setOpenWidths] = useState({ editor: 45, terminal: 30, copilot: 25 });
  const [closedWidths, setClosedWidths] = useState({ editor: 55, terminal: 45 });

  const [isDesktop, setIsDesktop] = useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Mobile / Tablet bottom active tab
  const [mobileBottomTab, setMobileBottomTab] = useState<'terminal' | 'copilot'>('terminal');

  // Track desktop breakpoint & resize Monaco
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      editorRef.current?.layout();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Trigger Monaco layout when panel state changes
  useEffect(() => {
    const triggerMonacoLayout = () => {
      editorRef.current?.layout();
    };

    triggerMonacoLayout();
    const t1 = setTimeout(triggerMonacoLayout, 100);
    const t2 = setTimeout(triggerMonacoLayout, 320);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [isCopilotOpen, openWidths, closedWidths, isDesktop, mobileBottomTab]);

  // Dragging event listeners for Desktop panel resizing
  const handleMouseDownDivider1 = (e: React.MouseEvent) => {
    e.preventDefault();
    activeDivider.current = 'd1';
    setIsDragging(true);
  };

  const handleMouseDownDivider2 = (e: React.MouseEvent) => {
    e.preventDefault();
    activeDivider.current = 'd2';
    setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeDivider.current || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const totalWidth = rect.width;
      if (totalWidth <= 0) return;

      const mouseX = e.clientX - rect.left;
      const mousePercent = (mouseX / totalWidth) * 100;

      if (activeDivider.current === 'd1') {
        if (isCopilotOpen) {
          const maxEditor = 100 - openWidths.copilot - 20;
          const newEditor = Math.max(25, Math.min(maxEditor, mousePercent));
          const newTerminal = 100 - openWidths.copilot - newEditor;
          setOpenWidths((prev) => ({
            ...prev,
            editor: Math.round(newEditor * 10) / 10,
            terminal: Math.round(newTerminal * 10) / 10,
          }));
        } else {
          const newEditor = Math.max(25, Math.min(75, mousePercent));
          setClosedWidths({
            editor: Math.round(newEditor * 10) / 10,
            terminal: Math.round((100 - newEditor) * 10) / 10,
          });
        }
      } else if (activeDivider.current === 'd2' && isCopilotOpen) {
        const newCopilot = Math.max(18, Math.min(45, 100 - mousePercent));
        const newTerminal = 100 - openWidths.editor - newCopilot;
        if (newTerminal >= 20) {
          setOpenWidths((prev) => ({
            ...prev,
            copilot: Math.round(newCopilot * 10) / 10,
            terminal: Math.round(newTerminal * 10) / 10,
          }));
        }
      }
      editorRef.current?.layout();
    };

    const handleMouseUp = () => {
      if (activeDivider.current) {
        activeDivider.current = null;
        setIsDragging(false);
        editorRef.current?.layout();
      }
    };

    if (isDragging) {
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }

    return () => {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isCopilotOpen, openWidths]);

  // Switch snippet when language changes
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    setCode(DEFAULT_SNIPPETS[newLang]);
    setExecutionResult(null);
    setErrorMsg(null);
    setSelectedCode('');
  };

  const handleResetCode = () => {
    setCode(DEFAULT_SNIPPETS[language]);
    setExecutionResult(null);
    setErrorMsg(null);
    setSelectedCode('');
  };

  const handleApplyCodeChange = (newCode: string) => {
    setUndoStack((prev) => [...prev, code]);
    setCode(newCode);
    setDiffProposal(null);
  };

  const handleUndoCodeChange = () => {
    if (undoStack.length === 0) return;
    const previousCode = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setCode(previousCode);
  };

  const handleExecute = async () => {
    if (isRunning) return;
    setIsRunning(true);
    setErrorMsg(null);

    try {
      const result = await runCode(language, code, showStdin ? stdin : undefined);
      setExecutionResult(result);

      if (result.status === 'compilation_error' || result.status === 'runtime_error') {
        setActiveTab('stderr');
      } else {
        setActiveTab('stdout');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || err?.message || 'Execution request failed.');
    } finally {
      setIsRunning(false);
    }
  };

  // Keyboard shortcut Ctrl+Enter / Cmd+Enter to run code
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleExecute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [language, code, stdin, showStdin, isRunning]);

  return (
    <div className="h-[calc(100vh-7rem)] lg:h-[calc(100vh-8rem)] min-h-[580px] flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans rounded-2xl border border-slate-800 shadow-2xl">
      {/* Top Navigation & Toolbar Header */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 select-none gap-2">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">AI Code Lab</h1>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap hidden md:inline-block">
                Sandboxed Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden xl:block truncate">
              Isolated multi-language execution (Python, JS, C, C++, Java)
            </p>
          </div>
        </div>

        {/* Controls: Language Selector + Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="appearance-none bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs font-semibold px-4 py-2.5 pr-9 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all shadow-sm"
            >
              {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((langKey) => (
                <option key={langKey} value={langKey} className="bg-slate-900 text-slate-200">
                  {LANGUAGE_LABELS[langKey].label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
          </div>

          {/* Stdin Toggle Button */}
          <button
            onClick={() => setShowStdin(!showStdin)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
              showStdin
                ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Stdin Input"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Input (Stdin)</span>
          </button>

          {/* AI Copilot Toggle Button */}
          <button
            onClick={() => {
              setIsCopilotOpen((prev) => {
                const next = !prev;
                if (next && !isDesktop) {
                  setMobileBottomTab('copilot');
                }
                return next;
              });
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isCopilotOpen
                ? 'bg-indigo-900/70 border-indigo-500/80 text-indigo-200 shadow-sm shadow-indigo-500/20 ring-1 ring-indigo-500/30'
                : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle AI Copilot Panel"
            aria-label="Toggle AI Copilot Panel"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Copilot</span>
          </button>

          {/* Reset Code Button */}
          <button
            onClick={handleResetCode}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition-all"
            title="Reset to sample snippet"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Run Code Button */}
          <button
            onClick={handleExecute}
            disabled={isRunning}
            className="group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 cursor-pointer"
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current transition-transform group-hover:scale-110" />
                <span>Run Code</span>
                <span className="hidden lg:inline text-[10px] font-mono opacity-80 bg-black/20 px-1.5 py-0.5 rounded">
                  Ctrl+Enter
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Helper Render Functions */}
      {(() => {
        const renderEditor = () => (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Editor Header Bar */}
            <div className="h-10 border-b border-slate-800/80 bg-slate-900/60 px-4 flex items-center justify-between text-xs text-slate-400 font-medium select-none shrink-0">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <span className="font-mono text-slate-300">
                  main.{language === 'python' ? 'py' : language === 'javascript' ? 'js' : language}
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Monaco Editor • UTF-8</span>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 relative bg-[#1e1e1e] min-h-0">
              <Editor
                height="100%"
                language={LANGUAGE_LABELS[language].monacoLang}
                value={code}
                onChange={(value) => setCode(value || '')}
                theme="vs-dark"
                onMount={(editor) => {
                  editorRef.current = editor;
                  editor.onDidChangeCursorSelection((e) => {
                    const model = editor.getModel();
                    if (model && e.selection) {
                      const text = model.getValueInRange(e.selection);
                      setSelectedCode(text && text.trim() !== '' ? text : '');
                    }
                  });
                }}
                options={{
                  fontSize: 14,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 12, bottom: 12 },
                  tabSize: 4,
                  fontFamily: 'Fira Code, Menlo, Monaco, Consolas, monospace',
                  fontLigatures: true,
                }}
              />
            </div>

            {/* Collapsible Stdin Input Panel */}
            {showStdin && (
              <div className="border-t border-slate-800 bg-slate-900 p-3 space-y-1.5 transition-all shrink-0">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                    Program Input (Stdin)
                  </label>
                  <span className="text-[10px] text-slate-500">Provide input lines for input() / scanf</span>
                </div>
                <textarea
                  value={stdin}
                  onChange={(e) => setStdin(e.target.value)}
                  placeholder="Enter standard input text here..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            )}
          </div>
        );

        const renderTerminal = () => (
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
            {/* Panel Header */}
            <div className="h-10 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between select-none shrink-0">
              {/* Tabs */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('stdout')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'stdout'
                      ? 'bg-slate-800 text-slate-100 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  Terminal
                </button>

                <button
                  onClick={() => setActiveTab('stderr')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative cursor-pointer ${
                    activeTab === 'stderr'
                      ? 'bg-slate-800 text-slate-100 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                  Stderr
                  {executionResult?.stderr ? (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  ) : null}
                </button>

                <button
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === 'security'
                      ? 'bg-slate-800 text-slate-100 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Sandbox
                </button>
              </div>

              {/* Sandbox Security Badge */}
              {executionResult && (
                <div>
                  {executionResult.sandboxIsolated ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="w-3 h-3" />
                      Container Isolated
                    </span>
                  ) : (
                    <span
                      className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30"
                      title={executionResult.warning}
                    >
                      <ShieldAlert className="w-3 h-3" />
                      Dev Sandbox Adapter
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status & Execution Metrics Bar */}
            {executionResult && (
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between text-xs shrink-0">
                {/* Status Pill */}
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-extrabold text-[11px] uppercase tracking-wider ${
                      executionResult.status === 'success'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : executionResult.status === 'timeout'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {executionResult.status === 'success' && <CheckCircle2 className="w-3 h-3" />}
                    {executionResult.status}
                  </span>

                  <span className="text-slate-400 text-[11px] font-mono">
                    Exit Code: {executionResult.exitCode ?? 'N/A'}
                  </span>
                </div>

                {/* Execution Metrics */}
                <div className="flex items-center gap-3 text-slate-400 text-xs font-mono">
                  <span className="flex items-center gap-1" title="Execution Time">
                    <Clock className="w-3.5 h-3.5 text-indigo-400" />
                    {executionResult.executionTime} ms
                  </span>
                  <span className="flex items-center gap-1" title="Memory Usage">
                    <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                    {(executionResult.memoryUsage / 1024).toFixed(1)} MB
                  </span>
                </div>
              </div>
            )}

            {/* Output Content Display */}
            <div className="flex-1 bg-slate-950 p-4 font-mono text-xs overflow-auto min-h-0 selection:bg-indigo-500 selection:text-white">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-800/60 text-rose-300 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Execution Failed
                  </div>
                  <p>{errorMsg}</p>
                </div>
              )}

              {!executionResult && !errorMsg && !isRunning && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2 select-none">
                  <Terminal className="w-8 h-8 opacity-40" />
                  <p className="text-xs">Click "Run Code" or press Ctrl+Enter to execute program</p>
                </div>
              )}

              {isRunning && (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                  <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-sans font-medium">Executing code inside sandboxed environment...</p>
                </div>
              )}

              {executionResult && !isRunning && (
                <>
                  {/* Stdout View */}
                  {activeTab === 'stdout' && (
                    <div className="space-y-1">
                      {executionResult.stdout ? (
                        <pre className="whitespace-pre-wrap text-slate-200 leading-relaxed font-mono">
                          {executionResult.stdout}
                        </pre>
                      ) : (
                        <span className="text-slate-500 italic">[Program produced no output to stdout]</span>
                      )}
                    </div>
                  )}

                  {/* Stderr View */}
                  {activeTab === 'stderr' && (
                    <div className="space-y-1">
                      {executionResult.stderr ? (
                        <pre className="whitespace-pre-wrap text-rose-400 leading-relaxed font-mono">
                          {executionResult.stderr}
                        </pre>
                      ) : (
                        <span className="text-slate-500 italic">[No errors reported to stderr]</span>
                      )}
                    </div>
                  )}

                  {/* Security View */}
                  {activeTab === 'security' && (
                    <div className="space-y-3 font-sans text-xs text-slate-300">
                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-slate-100">
                          <Info className="w-4 h-4 text-indigo-400" />
                          Sandbox Policy & Security Governance
                        </div>
                        <ul className="space-y-1.5 text-slate-400 text-[11px] list-disc list-inside">
                          <li>
                            <strong className="text-slate-200">Execution Adapter:</strong>{' '}
                            {executionResult.sandboxType}
                          </li>
                          <li>
                            <strong className="text-slate-200">Container Isolation:</strong>{' '}
                            {executionResult.sandboxIsolated ? 'FULL DOCKER CONTAINER' : 'DEV ADAPTER (LOCAL)'}
                          </li>
                          <li>
                            <strong className="text-slate-200">Network Access:</strong> Disabled (No internet)
                          </li>
                          <li>
                            <strong className="text-slate-200">Secrets & Env Purging:</strong> All backend secrets & Mongo credentials explicitly stripped
                          </li>
                          <li>
                            <strong className="text-slate-200">Output Limit:</strong> Capped at 64 KB
                          </li>
                        </ul>
                      </div>

                      {executionResult.warning && (
                        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 space-y-1 text-[11px]">
                          <div className="font-bold flex items-center gap-1.5">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            Development Sandbox Notice
                          </div>
                          <p>{executionResult.warning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );

        const renderCopilot = () => (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
            <CodeAssistantPanel
              currentLanguage={language}
              currentCode={code}
              selectedCode={selectedCode}
              stderr={executionResult?.stderr}
              stdout={executionResult?.stdout}
              onOpenProposalDiff={(explanation, proposedCode, originalSnapshot, lang) => {
                setDiffProposal({
                  explanation,
                  proposedCode,
                  originalSnapshot,
                  language: lang,
                });
              }}
              onClose={() => {
                setIsCopilotOpen(false);
                setMobileBottomTab('terminal');
              }}
            />
          </div>
        );

        if (isDesktop) {
          return (
            <div
              ref={splitContainerRef}
              className="flex-1 flex flex-row overflow-hidden min-h-0 relative select-none"
            >
              {/* Monaco Code Editor Panel */}
              <div
                style={{
                  width: `${isCopilotOpen ? openWidths.editor : closedWidths.editor}%`,
                }}
                className={`flex flex-col border-r border-slate-800/80 min-h-0 min-w-[200px] ${
                  !isDragging
                    ? 'transition-[width] duration-300 ease-in-out motion-reduce:transition-none'
                    : ''
                }`}
              >
                {renderEditor()}
              </div>

              {/* Draggable Divider 1: Editor | Terminal */}
              <div
                onMouseDown={handleMouseDownDivider1}
                className="flex items-center justify-center w-1.5 hover:w-2 bg-slate-800/90 hover:bg-indigo-500 cursor-col-resize transition-all shrink-0 group select-none relative z-10"
                title="Drag to resize Editor and Terminal"
              >
                <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
              </div>

              {/* Terminal & Output Panel */}
              <div
                style={{
                  width: `${isCopilotOpen ? openWidths.terminal : closedWidths.terminal}%`,
                }}
                className={`flex flex-col bg-slate-900/95 min-h-0 min-w-[180px] ${
                  !isDragging
                    ? 'transition-[width] duration-300 ease-in-out motion-reduce:transition-none'
                    : ''
                }`}
              >
                {renderTerminal()}
              </div>

              {/* Draggable Divider 2 & AI Copilot Adjacent Right-Side Panel */}
              {isCopilotOpen && (
                <>
                  <div
                    onMouseDown={handleMouseDownDivider2}
                    className="flex items-center justify-center w-1.5 hover:w-2 bg-slate-800/90 hover:bg-indigo-500 cursor-col-resize transition-all shrink-0 group select-none relative z-10"
                    title="Drag to resize Terminal and AI Copilot"
                  >
                    <div className="w-0.5 h-8 bg-slate-600 group-hover:bg-white rounded-full transition-colors" />
                  </div>

                  <div
                    style={{
                      width: `${openWidths.copilot}%`,
                    }}
                    className={`flex flex-col border-l border-slate-800 min-h-0 min-w-[220px] overflow-hidden ${
                      !isDragging
                        ? 'transition-[width] duration-300 ease-in-out motion-reduce:transition-none'
                        : ''
                    }`}
                  >
                    {renderCopilot()}
                  </div>
                </>
              )}
            </div>
          );
        }

        // Mobile / Tablet Responsive Fallback Layout
        return (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0">
            {/* Top Editor Area */}
            <div className="h-[48%] min-h-[220px] flex flex-col border-b border-slate-800/80 min-w-0">
              {renderEditor()}
            </div>

            {/* Bottom Stacked Tab Area */}
            <div className="flex-1 min-h-[280px] flex flex-col bg-slate-900/95 min-w-0">
              {/* Tab Navigation Switcher */}
              <div className="h-10 border-b border-slate-800 bg-slate-900 px-4 flex items-center justify-between select-none shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setMobileBottomTab('terminal')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mobileBottomTab === 'terminal'
                        ? 'bg-slate-800 text-slate-100 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Terminal
                  </button>

                  <button
                    onClick={() => {
                      setMobileBottomTab('copilot');
                      setIsCopilotOpen(true);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      mobileBottomTab === 'copilot'
                        ? 'bg-indigo-900/60 text-indigo-200 border border-indigo-500/40 shadow-xs'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    AI Copilot
                  </button>
                </div>
              </div>

              {/* Tab Body */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {mobileBottomTab === 'terminal' ? renderTerminal() : renderCopilot()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Code Diff Preview & Approval Modal */}
      {diffProposal && (
        <CodeDiffViewer
          originalCode={code}
          proposedCode={diffProposal.proposedCode}
          originalSnapshot={diffProposal.originalSnapshot}
          explanation={diffProposal.explanation}
          language={diffProposal.language}
          onApply={handleApplyCodeChange}
          onReject={() => setDiffProposal(null)}
          onUndo={handleUndoCodeChange}
          canUndo={undoStack.length > 0}
        />
      )}
    </div>
  );
};
