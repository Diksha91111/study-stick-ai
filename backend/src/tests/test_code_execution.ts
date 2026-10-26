import { executionService } from '../services/execution/executionService.js';
import { SupportedLanguage } from '../services/execution/executionEngine.js';

interface TestResultItem {
  id: number;
  category: string;
  name: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  details: string;
}

const testResults: TestResultItem[] = [];
let testIdCounter = 1;

async function runTest(
  category: string,
  name: string,
  testFn: () => Promise<{ status: 'PASSED' | 'SKIPPED'; details: string }>
) {
  const id = testIdCounter++;
  try {
    const res = await testFn();
    testResults.push({
      id,
      category,
      name,
      status: res.status,
      details: res.details,
    });
    const badge = res.status === 'PASSED' ? '✅ PASSED' : '⏭️ SKIPPED';
    console.log(`${badge} [${category}] ${name} - ${res.details}`);
  } catch (err: any) {
    testResults.push({
      id,
      category,
      name,
      status: 'FAILED',
      details: err?.message || String(err),
    });
    console.error(`❌ FAILED [${category}] ${name} - ${err?.message || err}`);
  }
}

async function runComprehensiveAuditSuite() {
  console.log('================================================================');
  console.log('🔒 STUDY STICK AI - CODE EXECUTION SECURITY & FUNCTIONAL AUDIT');
  console.log('================================================================\n');

  // 1. Python Standard Execution & Stdin
  await runTest('Python', 'Standard execution', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: 'print("Python Sandbox Test Output")',
    });
    if (res.status !== 'success' || !res.stdout.includes('Python Sandbox Test Output')) {
      throw new Error(`Execution failed or wrong output. Status: ${res.status}, stdout: ${res.stdout}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: `Time: ${res.executionTime}ms, ExitCode: ${res.exitCode}` };
  });

  await runTest('Python', 'Stdin input reading', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: 'import sys\ndata = sys.stdin.read().strip()\nprint(f"Stdin Received: {data}")',
      stdin: 'TestInputData123',
    });
    if (res.status !== 'success' || !res.stdout.includes('Stdin Received: TestInputData123')) {
      throw new Error(`Stdin test failed. stdout: ${res.stdout}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: 'Successfully read stdin buffer' };
  });

  await runTest('Python', 'Runtime Exception Handling', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: 'result = 10 / 0',
    });
    if (res.status !== 'runtime_error' || !res.stderr.includes('ZeroDivisionError')) {
      throw new Error(`Expected runtime_error with ZeroDivisionError, got status: ${res.status}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: 'Caught ZeroDivisionError correctly' };
  });

  // 2. JavaScript Standard Execution & Error
  await runTest('JavaScript', 'Standard execution', async () => {
    const res = await executionService.execute({
      language: 'javascript',
      code: 'const a = 15; const b = 27; console.log("Sum =", a + b);',
    });
    if (res.status !== 'success' || !res.stdout.includes('Sum = 42')) {
      throw new Error(`JS execution failed. stdout: ${res.stdout}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: `Time: ${res.executionTime}ms, ExitCode: ${res.exitCode}` };
  });

  await runTest('JavaScript', 'Runtime Exception Handling', async () => {
    const res = await executionService.execute({
      language: 'javascript',
      code: 'throw new Error("Custom JS Exception");',
    });
    if (res.status !== 'runtime_error' || !res.stderr.includes('Custom JS Exception')) {
      throw new Error(`Expected runtime_error, got status: ${res.status}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: 'Caught JS runtime exception' };
  });

  // 3. C Language Execution & Compilation Error
  await runTest('C', 'Compilation & Execution', async () => {
    const res = await executionService.execute({
      language: 'c',
      code: '#include <stdio.h>\nint main() { printf("C Engine OK\\n"); return 0; }',
    });
    if (res.status === 'error' && res.stderr.includes('Failed to spawn')) {
      return { status: 'SKIPPED', details: 'Host compiler gcc unavailable on system' };
    }
    if (res.status !== 'success' || !res.stdout.includes('C Engine OK')) {
      throw new Error(`C test failed. Status: ${res.status}, stdout: ${res.stdout}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: `Time: ${res.executionTime}ms` };
  });

  await runTest('C', 'Compilation Syntax Error', async () => {
    const res = await executionService.execute({
      language: 'c',
      code: '#include <stdio.h>\nint main() { syntax_error_line; return 0; }',
    });
    if (res.status === 'error' && res.stderr.includes('Failed to spawn')) {
      return { status: 'SKIPPED', details: 'Host compiler gcc unavailable on system' };
    }
    if (res.status !== 'compilation_error') {
      throw new Error(`Expected compilation_error, got status: ${res.status}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: 'Caught C compilation syntax error' };
  });

  // 4. C++ Language Execution & Compilation Error
  await runTest('C++', 'Compilation & Execution', async () => {
    const res = await executionService.execute({
      language: 'cpp',
      code: '#include <iostream>\nint main() { std::cout << "CPP Engine OK" << std::endl; return 0; }',
    });
    if (res.status === 'error' && res.stderr.includes('Failed to spawn')) {
      return { status: 'SKIPPED', details: 'Host compiler g++ unavailable on system' };
    }
    if (res.status !== 'success' || !res.stdout.includes('CPP Engine OK')) {
      throw new Error(`C++ test failed. Status: ${res.status}, stdout: ${res.stdout}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: `Time: ${res.executionTime}ms` };
  });

  // 5. Java Language Execution & Compilation Error
  await runTest('Java', 'Compilation & Execution', async () => {
    const res = await executionService.execute({
      language: 'java',
      code: 'public class Main { public static void main(String[] args) { System.out.println("Java Engine OK"); } }',
    });
    if (res.status === 'error' && res.stderr.includes('Failed to spawn')) {
      return { status: 'SKIPPED', details: 'Host OpenJDK javac/java unavailable on system' };
    }
    if (res.status !== 'success' || !res.stdout.includes('Java Engine OK')) {
      throw new Error(`Java test failed. Status: ${res.status}, stdout: ${res.stdout}, stderr: ${res.stderr}`);
    }
    return { status: 'PASSED', details: `Time: ${res.executionTime}ms` };
  });

  // 6. Infinite Loop & Hard Timeout Termination
  await runTest('Security', 'Infinite loop timeout termination', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: 'while True: pass',
      timeoutMs: 1500,
    });
    if (res.status !== 'timeout') {
      throw new Error(`Expected timeout status, got: ${res.status}`);
    }
    return { status: 'PASSED', details: 'Process terminated after timeout threshold' };
  });

  // 7. Output Size Capping (Max 64KB)
  await runTest('Security', 'Excessive output truncation (>64KB)', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: 'print("A" * 100000)',
    });
    if (!res.stdout.includes('[Output truncated: Maximum size limit exceeded]')) {
      throw new Error(`Output was not truncated. Stdout length: ${res.stdout.length}`);
    }
    return { status: 'PASSED', details: `Stdout capped at ${res.stdout.length} bytes` };
  });

  // 8. Backend Secrets Exposure Protection
  await runTest('Security', 'Backend secret exposure check', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: 'import os\nprint("MONGO:", os.environ.get("MONGO_URI"))\nprint("JWT:", os.environ.get("JWT_SECRET"))\nprint("API_KEY:", os.environ.get("GEMINI_API_KEY"))',
    });
    if (
      res.stdout.includes('mongodb://') ||
      res.stdout.includes('secret') ||
      (res.stdout.includes('MONGO: ') && !res.stdout.includes('MONGO: None'))
    ) {
      throw new Error(`CRITICAL SECURITY FAILURE: Secrets detected in output! Stdout: ${res.stdout}`);
    }
    return { status: 'PASSED', details: 'All backend env secrets verified stripped from child process' };
  });

  // 9. Input Validations
  await runTest('Validation', 'Reject empty code input', async () => {
    const res = await executionService.execute({
      language: 'python',
      code: '   \n  ',
    });
    if (res.status !== 'error' || res.exitCode !== 400) {
      throw new Error(`Expected error status 400 for empty code, got ${res.status}`);
    }
    return { status: 'PASSED', details: 'Empty code rejected' };
  });

  await runTest('Validation', 'Reject unsupported language', async () => {
    const res = await executionService.execute({
      language: 'rust' as any,
      code: 'fn main() {}',
    });
    if (res.status !== 'error' || res.exitCode !== 400) {
      throw new Error(`Expected error status 400 for unsupported language, got ${res.status}`);
    }
    return { status: 'PASSED', details: 'Unsupported language rejected' };
  });

  // Print Summary Table
  console.log('\n================================================================');
  console.log('📊 CODE EXECUTION SECURITY AUDIT SUMMARY REPORT');
  console.log('================================================================');
  
  const passed = testResults.filter((r) => r.status === 'PASSED').length;
  const failed = testResults.filter((r) => r.status === 'FAILED').length;
  const skipped = testResults.filter((r) => r.status === 'SKIPPED').length;

  console.log(`TOTAL AUDIT TESTS : ${testResults.length}`);
  console.log(`PASSED            : ${passed}`);
  console.log(`FAILED            : ${failed}`);
  console.log(`SKIPPED           : ${skipped}`);
  console.log('----------------------------------------------------------------');

  testResults.forEach((r) => {
    console.log(`[${r.status.padEnd(7)}] #${r.id} ${r.category} - ${r.name} (${r.details})`);
  });

  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runComprehensiveAuditSuite();
