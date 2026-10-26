"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_js_1 = require("../config/env.js");
const generateAccessToken = (payload) => {
    return jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, env_js_1.ENV.JWT_ACCESS_SECRET, {
        jwtid: crypto_1.default.randomUUID(),
        expiresIn: (env_js_1.ENV.JWT_ACCESS_EXPIRES_IN || '15m'),
    });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (payload) => {
    return jsonwebtoken_1.default.sign({ userId: payload.userId, email: payload.email }, env_js_1.ENV.JWT_REFRESH_SECRET, {
        jwtid: crypto_1.default.randomUUID(),
        expiresIn: (env_js_1.ENV.JWT_REFRESH_EXPIRES_IN || '7d'),
    });
};
exports.generateRefreshToken = generateRefreshToken;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_js_1.ENV.JWT_ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, env_js_1.ENV.JWT_REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
