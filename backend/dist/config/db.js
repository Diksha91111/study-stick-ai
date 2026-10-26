"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./env.js");
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(env_js_1.ENV.MONGODB_URI);
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
        return true;
    }
    catch (error) {
        console.error('[MongoDB] Connection error:', error);
        console.warn('[MongoDB] Continuing without database connection. Some features may not work.');
        return false;
    }
};
exports.connectDB = connectDB;
