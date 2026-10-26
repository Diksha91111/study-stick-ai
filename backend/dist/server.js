"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_js_1 = require("./config/env.js");
const db_js_1 = require("./config/db.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const profileRoutes_js_1 = __importDefault(require("./routes/profileRoutes.js"));
const subjectRoutes_js_1 = __importDefault(require("./routes/subjectRoutes.js"));
const timetableRoutes_js_1 = __importDefault(require("./routes/timetableRoutes.js"));
const sleepRoutes_js_1 = __importDefault(require("./routes/sleepRoutes.js"));
const taskRoutes_js_1 = __importDefault(require("./routes/taskRoutes.js"));
const examRoutes_js_1 = __importDefault(require("./routes/examRoutes.js"));
const dashboardRoutes_js_1 = __importDefault(require("./routes/dashboardRoutes.js"));
const aiRoutes_js_1 = __importDefault(require("./routes/aiRoutes.js"));
const executionRoutes_js_1 = __importDefault(require("./routes/executionRoutes.js"));
const progressRoutes_js_1 = __importDefault(require("./routes/progressRoutes.js"));
const learningPathRoutes_js_1 = __importDefault(require("./routes/learningPathRoutes.js"));
const flashcardRoutes_js_1 = __importDefault(require("./routes/flashcardRoutes.js"));
const plannerRoutes_js_1 = __importDefault(require("./routes/plannerRoutes.js"));
const notificationRoutes_js_1 = __importDefault(require("./routes/notificationRoutes.js"));
const resourceRoutes_js_1 = __importDefault(require("./routes/resourceRoutes.js"));
const knowledgeGraphRoutes_js_1 = __importDefault(require("./routes/knowledgeGraphRoutes.js"));
const studyRoomRoutes_js_1 = __importDefault(require("./routes/studyRoomRoutes.js"));
const notificationScheduler_js_1 = require("./services/notifications/notificationScheduler.js");
const app = (0, express_1.default)();
const allowedOrigins = [
    env_js_1.ENV.CLIENT_URL,
    env_js_1.ENV.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
].filter(Boolean).map(o => o.replace(/\/$/, ''));
// Middlewares
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin.replace(/\/$/, ''))) {
            return callback(null, true);
        }
        return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cookie'],
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'Study Stick AI Backend',
        phase: 1,
    });
});
// Mount Routes
app.use('/api/auth', authRoutes_js_1.default);
app.use('/api/profile', profileRoutes_js_1.default);
app.use('/api/subjects', subjectRoutes_js_1.default);
app.use('/api/timetable', timetableRoutes_js_1.default);
app.use('/api/sleep', sleepRoutes_js_1.default);
app.use('/api/tasks', taskRoutes_js_1.default);
app.use('/api/exams', examRoutes_js_1.default);
app.use('/api/dashboard', dashboardRoutes_js_1.default);
app.use('/api/ai', aiRoutes_js_1.default);
app.use('/api/execution', executionRoutes_js_1.default);
app.use('/api/progress', progressRoutes_js_1.default);
app.use('/api/learning-path', learningPathRoutes_js_1.default);
app.use('/api/flashcards', flashcardRoutes_js_1.default);
app.use('/api/planner', plannerRoutes_js_1.default);
app.use('/api/notifications', notificationRoutes_js_1.default);
app.use('/api/resources', resourceRoutes_js_1.default);
app.use('/api/knowledge-graph', knowledgeGraphRoutes_js_1.default);
app.use('/api/study-rooms', studyRoomRoutes_js_1.default);
// Error handling middleware
app.use(errorHandler_js_1.errorHandler);
// Start server only when executed directly as entrypoint, not when imported by tests
const isMainModule = process.env.NODE_ENV !== 'test_runner' &&
    process.env.NODE_ENV !== 'test' &&
    Boolean(process.argv[1] &&
        (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));
if (isMainModule) {
    (0, db_js_1.connectDB)().finally(() => {
        app.listen(env_js_1.ENV.PORT, () => {
            console.log(`🚀 [Study Stick AI Backend] Server running in ${env_js_1.ENV.NODE_ENV} mode on port ${env_js_1.ENV.PORT}`);
            notificationScheduler_js_1.notificationScheduler.start();
        });
    });
}
exports.default = app;
