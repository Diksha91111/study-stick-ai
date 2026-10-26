"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.authenticateToken = void 0;
const token_js_1 = require("../utils/token.js");
const response_js_1 = require("../utils/response.js");
const authenticateToken = (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const candidate = authHeader.split(' ')[1]?.trim();
            if (candidate && candidate !== 'null' && candidate !== 'undefined') {
                token = candidate;
            }
        }
        if (!token && req.cookies && req.cookies.accessToken) {
            const cookieToken = req.cookies.accessToken;
            if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
                token = cookieToken;
            }
        }
        if (!token && req.query && typeof req.query.token === 'string') {
            const queryToken = req.query.token.trim();
            if (queryToken && queryToken !== 'null' && queryToken !== 'undefined') {
                token = queryToken;
            }
        }
        if (!token) {
            (0, response_js_1.sendError)(res, 'Authentication required. No token provided.', 401);
            return;
        }
        const decoded = (0, token_js_1.verifyAccessToken)(token);
        req.user = decoded;
        next();
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            (0, response_js_1.sendError)(res, 'Access token has expired', 401);
            return;
        }
        (0, response_js_1.sendError)(res, 'Invalid authentication token', 403);
    }
};
exports.authenticateToken = authenticateToken;
exports.requireAuth = exports.authenticateToken;
