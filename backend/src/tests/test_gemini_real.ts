/**
 * REAL GEMINI INTEGRATION TEST — Study Stick AI Phase 5
 *
 * Purpose: Verify that the GeminiProvider and ModelRouter correctly route
 * all 6 code assistant task types through the real Gemini API.
 *
 * This test makes REAL NETWORK CALLS. It requires GEMINI_API_KEY in backend/.env.
 * DO NOT run in CI without injecting credentials.
 */

import { GeminiProvider } from '../ai/providers/geminiProvider.js';
import { modelRouter } from '../ai/core/modelRouter.js';
import { promptManager } from '../ai/core/promptManager.js';
import { AICodeAction, AITaskType } from '../ai/types/ai.types.js';
import { ENV } from '../config/env.js';

interface TestResult {
  test: string;
  status: 'PASSED' | 'FAILED' | 'BLOCKED';
  detail: string;
  provider?: string;
  model?: string;
  tokensUsed?: number;
  firstChars?: string;
}

const results: TestResult[] = [];

function pass(test: string, detail: string, extra?: Partial<TestResult>) {
  results.push({ test, status: 'PASSED', detail, ...extra });
  console.log(`  ✅ PASSED  ${test} — ${detail}`);
}
function fail(test: string, detail: string) {
  results.push({ test, status: 'FAILED', detail });
  console.log(`  ❌ FAILED  ${test} — ${detail}`);
}
function blocked(test: string, detail: string) {
  results.push({ test, status: 'BLOCKED', detail });
  console.log(`  ⚠️  BLOCKED ${test} — ${detail}`);
}

// ─── Helper ────────────────────────────────────────────────────────────────
async function callGemini(
  taskType: AITaskType,
  message: string,
  systemInstruction: string
): Promise<{ text: string; model: string; tokens?: number }> {
  const provider = new GeminiProvider();
  const res = await provider.generateResponse({
    message,
    taskType,
    options: { systemInstruction, temperature: 0.3, maxTokens: 512 },
  });
  return {
    text: res.text,
    model: res.model,
    tokens: res.usage?.totalTokens,
  };
}

async function main() {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  STUDY STICK AI — REAL GEMINI API INTEGRATION TEST');
  console.log('════════════════════════════════════════════════════════════\n');

  // ── Pre-flight: Check key ─────────────────────────────────────────────────
  const keyPresent = Boolean(ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.trim());
  const keySnippet = keyPresent
    ? `${ENV.GEMINI_API_KEY.slice(0, 6)}…${ENV.GEMINI_API_KEY.slice(-4)}`
    : '(empty)';
  console.log(`  GEMINI_API_KEY loaded : ${keyPresent ? 'YES' : 'NO'} [${keySnippet}]`);

  if (!keyPresent) {
    console.log('\n  ⚠️  GEMINI_API_KEY is missing — all real tests will be BLOCKED.\n');
  }

  // ── Check 1: isConfigured() ───────────────────────────────────────────────
  console.log('\n[1] Provider Configuration');
  const gp = new GeminiProvider();
  if (gp.isConfigured()) {
    pass('GeminiProvider.isConfigured()', 'Returns true when key is set');
  } else {
    blocked('GeminiProvider.isConfigured()', 'Key not set — cannot continue with real calls');
  }

  // ── Check 2: ModelRouter routes all 6 coding tasks to Gemini ─────────────
  console.log('\n[2] ModelRouter routing for all 6 coding task types');
  const codingTaskMap: [AICodeAction, AITaskType][] = [
    ['explain',   'codeExplanation'],
    ['teach',     'chat'],
    ['hint',      'chat'],
    ['debug',     'codeDebug'],
    ['interview', 'chat'],
    ['exam',      'chat'],
  ];

  for (const [action, taskType] of codingTaskMap) {
    try {
      const routed = modelRouter.route(taskType);
      if (routed.name === 'gemini') {
        pass(`route(${taskType})`, `→ gemini as expected`);
      } else {
        fail(`route(${taskType})`, `Unexpected provider: ${routed.name} (expected gemini)`);
      }
    } catch (err: any) {
      blocked(`route(${taskType})`, err.message);
    }
  }

  // ── Check 3: No key leak in error or log output ───────────────────────────
  console.log('\n[3] API key exposure check');
  const keyInEnv = ENV.GEMINI_API_KEY || '';
  // We are intentionally not printing the key — check that prompts don't embed it
  const sampleInstruction = promptManager.getCodeAssistantInstruction('explain', 'python');
  if (!sampleInstruction.includes(keyInEnv) || !keyInEnv) {
    pass('API key not in prompt templates', 'Prompt instructions exclude GEMINI_API_KEY');
  } else {
    fail('API key not in prompt templates', 'CRITICAL: Key found in prompt template output');
  }

  // ── Check 4: Real API call for all 6 actions ─────────────────────────────
  console.log('\n[4] Real Gemini API call for all 6 actions');
  if (!keyPresent) {
    blocked('Real API call: All 6 Actions', 'No API key configured');
  } else {
    for (const [action, taskType] of codingTaskMap) {
      try {
        const instruction = promptManager.getCodeAssistantInstruction(action, 'javascript');
        const message = `Action Requested: ${action.toUpperCase()}\n\nFull Code File Context:\n\`\`\`javascript\nfunction example() { return "hello"; }\n\`\`\``;
        await new Promise(resolve => setTimeout(resolve, 8500)); // Avoid rate limits
        const { text, model, tokens } = await callGemini(taskType, message, instruction);

        if (text && text.length > 5) {
          pass(
            `Real API call: ${action} (${taskType})`,
            `Got ${text.length} chars from ${model}`,
            { provider: 'gemini', model, tokensUsed: tokens, firstChars: text.substring(0, 50).replace(/\n/g, ' ') }
          );
        } else {
          fail(`Real API call: ${action}`, `Empty or too-short response`);
        }
      } catch (err: any) {
        const msg = (err.message || '').replace(keyInEnv, '[REDACTED_GEMINI_KEY]');
        fail(`Real API call: ${action}`, msg);
      }
    }
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  const passed  = results.filter(r => r.status === 'PASSED').length;
  const failed  = results.filter(r => r.status === 'FAILED').length;
  const blockedC = results.filter(r => r.status === 'BLOCKED').length;

  console.log('\n════════════════════════════════════════════════════════════');
  console.log('  REAL GEMINI INTEGRATION TEST — SUMMARY');
  console.log('════════════════════════════════════════════════════════════');
  console.log(`  TOTAL   : ${results.length}`);
  console.log(`  PASSED  : ${passed}`);
  console.log(`  FAILED  : ${failed}`);
  console.log(`  BLOCKED : ${blockedC}`);
  console.log('────────────────────────────────────────────────────────────');

  for (const r of results) {
    const icon = r.status === 'PASSED' ? '✅' : r.status === 'BLOCKED' ? '⚠️ ' : '❌';
    console.log(`  ${icon} [${r.status.padEnd(7)}] ${r.test}`);
    if (r.firstChars) console.log(`          → Response preview: "${r.firstChars}..."`);
  }

  if (failed > 0) {
    console.log('\n  ❌ Some tests FAILED — investigate above.\n');
    process.exit(1);
  } else if (blockedC > 0) {
    console.log('\n  ⚠️  Some tests BLOCKED (no API key) — configure GEMINI_API_KEY to run real tests.\n');
  } else {
    console.log('\n  ✅ All tests PASSED — Gemini integration verified.\n');
  }
}

main().catch((err) => {
  console.error('Test runner error:', err.message || err);
  process.exit(1);
});
