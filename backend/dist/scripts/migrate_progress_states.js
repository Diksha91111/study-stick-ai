"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const User_js_1 = require("../models/User.js");
const ProgrammingProgress_js_1 = require("../models/ProgrammingProgress.js");
dotenv_1.default.config();
const PREREQUISITES = {
    'Variables and data types': [],
    'Conditions and loops': ['Variables and data types'],
    'Arrays and strings': ['Conditions and loops'],
    'Searching and sorting': ['Arrays and strings'],
    'Recursion': ['Conditions and loops'],
    'Linked lists, stacks, and queues': ['Arrays and strings'],
    'Trees and graphs': ['Linked lists, stacks, and queues', 'Recursion'],
    'Dynamic programming': ['Recursion', 'Arrays and strings'],
    'Time and space complexity': ['Conditions and loops'],
};
const ALL_TOPICS = Object.keys(PREREQUISITES);
const isTopicMasteredOldHeuristic = (p) => {
    if (!p)
        return false;
    if (p.attempts >= 3) {
        const mastery = Math.round((p.correctAnswers / p.attempts) * 100);
        return mastery >= 80;
    }
    return false;
};
const migrate = async () => {
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studystick_ai');
        console.log('Connected to MongoDB');
        const users = await User_js_1.User.find();
        let recordsUpdated = 0;
        let recordsCreated = 0;
        for (const user of users) {
            const userId = user._id;
            const progressList = await ProgrammingProgress_js_1.ProgrammingProgress.find({ userId });
            const progressMap = new Map(progressList.map(p => [p.topic, p]));
            // Evaluate states
            for (const topic of ALL_TOPICS) {
                const p = progressMap.get(topic);
                let status = 'LOCKED';
                if (p && isTopicMasteredOldHeuristic(p)) {
                    status = 'COMPLETED';
                }
                else if (p && p.attempts > 0) {
                    status = 'IN_PROGRESS';
                }
                else {
                    // Check prerequisites
                    const prereqs = PREREQUISITES[topic];
                    const prereqsMet = prereqs.every(req => {
                        const reqP = progressMap.get(req);
                        return isTopicMasteredOldHeuristic(reqP);
                    });
                    if (prereqsMet) {
                        status = 'AVAILABLE';
                    }
                }
                if (p) {
                    if (p.status !== status) {
                        p.status = status;
                        await p.save();
                        recordsUpdated++;
                    }
                }
                else {
                    // If no record exists but it should be AVAILABLE or LOCKED, create it
                    await ProgrammingProgress_js_1.ProgrammingProgress.create({
                        userId,
                        topic,
                        status,
                        attempts: 0,
                        correctAnswers: 0,
                        hintsRequested: 0,
                        lessonsCompleted: 0,
                        examScoreSum: 0,
                        examQuestionsAttempted: 0,
                        recentErrors: [],
                    });
                    recordsCreated++;
                }
            }
        }
        console.log(`Migration complete!`);
        console.log(`Records Updated: ${recordsUpdated}`);
        console.log(`Records Created: ${recordsCreated}`);
    }
    catch (err) {
        console.error('Migration failed:', err);
    }
    finally {
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
};
migrate();
