import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { executionService } from '../services/execution/executionService.js';
import { SupportedLanguage } from '../services/execution/executionEngine.js';

export const runCodeHandler = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { language, code, stdin, timeoutMs } = req.body;

    if (!language) {
      sendError(res, 'Field "language" is required.', 400);
      return;
    }

    if (code === undefined || code === null) {
      sendError(res, 'Field "code" is required.', 400);
      return;
    }

    const result = await executionService.execute({
      language: language as SupportedLanguage,
      code,
      stdin,
      timeoutMs: timeoutMs ? Number(timeoutMs) : undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        status: result.status,
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage,
        sandboxIsolated: result.sandboxIsolated,
        sandboxType: result.sandboxType,
        warning: result.warning,
      },
    });
  } catch (error: any) {
    sendError(res, error.message || 'Execution error encountered.', 500);
  }
};
