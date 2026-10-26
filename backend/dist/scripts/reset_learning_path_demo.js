"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_js_1 = require("../models/User.js");
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
const LearningPath_js_1 = require("../models/LearningPath.js");
const AssessmentAttempt_js_1 = require("../models/AssessmentAttempt.js");
dotenv_1.default.config();
async function resetDemo() {
    await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studystick_ai');
    const user = await User_js_1.User.findOne({ email: 'priya.sharma@studystick.ai' });
    if (user) {
        await ProgrammingProgress_js_1.ProgrammingProgress.deleteMany({ userId: user._id });
        await LearningPath_js_1.LearningPath.deleteMany({ userId: user._id });
        await AssessmentAttempt_js_1.AssessmentAttempt.deleteMany({ userId: user._id });
        console.log('✅ Cleared LearningPath, ProgrammingProgress, and AssessmentAttempt for Priya Sharma.');
    }
    await mongoose_1.default.disconnect();
}
resetDemo();
