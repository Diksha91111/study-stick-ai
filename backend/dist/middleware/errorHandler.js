"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const response_js_1 = require("../utils/response.js");
const errorHandler = (err, _req, res, _next) => {
    console.error('[Error Handler]', err);
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map((e) => e.message);
        (0, response_js_1.sendError)(res, messages.join(', '), 400, err.errors);
        return;
    }
    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        (0, response_js_1.sendError)(res, `A record with this ${field} already exists.`, 409, {
            code: 'DUPLICATE_KEY_CONFLICT',
            field
        });
        return;
    }
    // CastError (invalid ObjectId)
    if (err.name === 'CastError') {
        (0, response_js_1.sendError)(res, `Resource not found with id ${err.value}`, 404);
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    (0, response_js_1.sendError)(res, message, statusCode);
};
exports.errorHandler = errorHandler;
