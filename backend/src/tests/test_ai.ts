import { validateAIProviderConfig } from '../config/env.js';
import { modelRouter } from '../ai/core/modelRouter.js';
import { promptManager } from '../ai/core/promptManager.js';
import { contextBuilder } from '../ai/core/contextBuilder.js';
import { responseParser } from '../ai/core/responseParser.js';
import { conversationMemory } from '../ai/memory/conversationMemory.js';
import { getStudentProfileTool } from '../ai/tools/studentTools.js';
import { analyzeCodeSyntaxTool } from '../ai/tools/codingTools.js';
import { OpenAIProvider } from '../ai/providers/openaiProvider.js';
import { GeminiProvider } from '../ai/providers/geminiProvider.js';
import { AnthropicProvider } from '../ai/providers/anthropicProvider.js';
import { aiOrchestrator } from '../ai/core/aiOrchestrator.js';

async function runAITests() {
  console.log('====================================================');
  console.log('🤖 RUNNING EXTENSIBLE AI ARCHITECTURE TESTS');
  console.log('====================================================\n');

  try {
    // Test 1: Config Validation & Key Checks
    console.log('--- Test 1: Environment & Config Validation ---');
    const openAICheck = validateAIProviderConfig('openai');
    console.log(`✅ OpenAI config check: isConfigured=${openAICheck.isValid}`);
    const geminiCheck = validateAIProviderConfig('gemini');
    console.log(`✅ Gemini config check: isConfigured=${geminiCheck.isValid}`);
    const anthropicCheck = validateAIProviderConfig('anthropic');
    console.log(`✅ Anthropic config check: isConfigured=${anthropicCheck.isValid}`);

    // Test 2: Model Router Task Classification
    console.log('\n--- Test 2: Task Classification Engine ---');
    const chatTask = modelRouter.classifyTask('Hello, how can you help me study today?');
    if (chatTask === 'chat') {
      console.log('✅ "Hello..." classified as "chat"');
    } else {
      throw new Error(`Task classification error: expected "chat", got "${chatTask}"`);
    }

    const codeTask = modelRouter.classifyTask('Write a C++ function to implement Dijkstra algorithm');
    if (codeTask === 'codeGeneration') {
      console.log('✅ "Write C++ function..." classified as "codeGeneration"');
    } else {
      throw new Error(`Task classification error: expected "codeGeneration", got "${codeTask}"`);
    }

    const reasoningTask = modelRouter.classifyTask('Solve step by step the calculus integral of x^2 * e^x');
    if (reasoningTask === 'reasoning') {
      console.log('✅ "Solve step by step..." classified as "reasoning"');
    } else {
      throw new Error(`Task classification error: expected "reasoning", got "${reasoningTask}"`);
    }

    const summaryTask = modelRouter.classifyTask('Summarize the main concepts of OSI model 7 layers');
    if (summaryTask === 'summarization') {
      console.log('✅ "Summarize main concepts..." classified as "summarization"');
    } else {
      throw new Error(`Task classification error: expected "summarization", got "${summaryTask}"`);
    }

    // Test 3: Provider Contracts
    console.log('\n--- Test 3: Provider Interfaces & Capabilities ---');
    const openai = new OpenAIProvider();
    const gemini = new GeminiProvider();
    const anthropic = new AnthropicProvider();

    console.log(`✅ OpenAI default model (reasoning): ${openai.getDefaultModel('reasoning')}`);
    console.log(`✅ Gemini default model (chat): ${gemini.getDefaultModel('chat')}`);
    console.log(`✅ Anthropic default model (code): ${anthropic.getDefaultModel('codeGeneration')}`);

    // Test 4: Conversation Memory
    console.log('\n--- Test 4: Conversation Memory & Context Windows ---');
    const convId = 'test_conv_123';
    conversationMemory.addMessage(convId, { role: 'user', content: 'What is deadlocks in OS?' });
    conversationMemory.addMessage(convId, {
      role: 'assistant',
      content: 'A deadlock occurs when processes wait indefinitely for resources.',
    });
    const history = conversationMemory.getHistory(convId);
    if (history.length === 2) {
      console.log(`✅ Memory correctly stored and retrieved ${history.length} messages.`);
    } else {
      throw new Error(`Memory retrieval error: expected 2, got ${history.length}`);
    }
    conversationMemory.clearHistory(convId);
    if (conversationMemory.getHistory(convId).length === 0) {
      console.log('✅ Memory cleared successfully.');
    }

    // Test 5: AI Tools Execution
    console.log('\n--- Test 5: Safe AI Tools Execution ---');
    const toolRes = await analyzeCodeSyntaxTool.execute('dummy', {
      code: 'function test() {\n  return 42;\n}',
      language: 'javascript',
    });
    if (toolRes.success && toolRes.analysis.lines === 3) {
      console.log('✅ analyzeCodeSyntaxTool executed successfully.');
    } else {
      throw new Error('Tool execution failed');
    }

    // Test 6: Prompt & Context Builder
    console.log('\n--- Test 6: Context Builder & System Instructions ---');
    const sysPrompt = contextBuilder.buildSystemInstruction('reasoning', 'learn', {
      studentId: 'stud_123',
      name: 'Rohan Gupta',
      branch: 'Computer Science',
      collegeName: 'IIT Bombay',
      currentSemester: 5,
    });
    if (sysPrompt.includes('Rohan Gupta') && sysPrompt.includes('IIT Bombay')) {
      console.log('✅ ContextBuilder successfully injected student academic context.');
    } else {
      throw new Error('Context builder failed to format student context');
    }

    // Test 7: Response Parser
    console.log('\n--- Test 7: Response Parser & Code Block Extraction ---');
    const codeBlocks = responseParser.extractCodeBlocks('Here is the code:\n```python\nprint("Hello")\n```');
    if (codeBlocks.length === 1 && codeBlocks[0].language === 'python') {
      console.log('✅ Code block parser extracted python block correctly.');
    } else {
      throw new Error('Response parser failed code extraction');
    }

    // Test 8: Orchestrator Missing Key Behavior (Safe Error)
    console.log('\n--- Test 8: AI Orchestrator Configuration Error Handling ---');
    try {
      // If API keys are empty strings, routing should fail with proper error message
      const configured = modelRouter.getConfiguredProviders();
      if (configured.length === 0) {
        await aiOrchestrator.processRequest({ message: 'Hello' });
      } else {
        console.log(`ℹ️ Configured providers available: ${configured.map((p) => p.name).join(', ')}`);
      }
    } catch (err: any) {
      if (err.message.includes('No AI provider API keys configured')) {
        console.log('✅ Orchestrator returned proper configuration error when no API keys are set.');
      } else {
        throw err;
      }
    }

    console.log('\n====================================================');
    console.log('🎉 ALL AI ARCHITECTURE TESTS PASSED SUCCESSFULLY!');
    console.log('====================================================');
    process.exit(0);
  } catch (error) {
    console.error('❌ AI test suite failed:', error);
    process.exit(1);
  }
}

runAITests();
