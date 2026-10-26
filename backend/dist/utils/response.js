"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendError = exports.sendSuccess = void 0;
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
    });
};
exports.sendSuccess = sendSuccess;
const sendError = (res, message = 'Internal server error', statusCode = 500, data) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(data !== undefined && { data }),
    });
};
exports.sendError = sendError;
