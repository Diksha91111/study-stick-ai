"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCodeHandler = void 0;
const response_js_1 = require("../utils/response.js");
const executionService_js_1 = require("../services/execution/executionService.js");
const runCodeHandler = async (req, res) => {
    try {
        const { language, code, stdin, timeoutMs } = req.body;
        if (!language) {
            (0, response_js_1.sendError)(res, 'Field "language" is required.', 400);
            return;
        }
        if (code === undefined || code === null) {
            (0, response_js_1.sendError)(res, 'Field "code" is required.', 400);
            return;
        }
        const result = await executionService_js_1.executionService.execute({
            language: language,
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
    }
    catch (error) {
        (0, response_js_1.sendError)(res, error.message || 'Execution error encountered.', 500);
    }
};
exports.runCodeHandler = runCodeHandler;
