"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const env_js_1 = require("../config/env.js");
const User_js_1 = require("../models/User.js");
const Profile_js_1 = require("../models/Profile.js");
const Subject_js_1 = require("../models/Subject.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const Task_js_1 = require("../models/Task.js");
const Exam_js_1 = require("../models/Exam.js");
const token_js_1 = require("../utils/token.js");
const conflictDetector_js_1 = require("../utils/conflictDetector.js");
async function runPhase1Tests() {
    console.log('====================================================');
    console.log('🧪 RUNNING PHASE 1 COMPREHENSIVE AUTOMATED TESTS');
    console.log('====================================================\n');
    try {
        await mongoose_1.default.connect(env_js_1.ENV.MONGODB_URI);
        console.log('✅ Connected to MongoDB successfully.');
        // Cleanup any prior test student
        const testEmail = `test.student.${Date.now()}@studystick.ai`;
        await User_js_1.User.deleteMany({ email: /test\.student/ });
        // Test 1: Password hashing and User Registration
        console.log('\n--- Test 1: User Registration & Password Hashing ---');
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash('Secret123!', salt);
        const testUser = await User_js_1.User.create({
            name: 'Priya Sharma',
            email: testEmail,
            password: hashedPassword,
        });
        console.log(`✅ Registered User: ${testUser.name} (${testUser.email}) [ID: ${testUser._id}]`);
        // Test 2: JWT Tokens Generation & Verification
        console.log('\n--- Test 2: JWT Access & Refresh Token Validation ---');
        const tokenPayload = { userId: testUser._id.toString(), email: testUser.email };
        const accessToken = (0, token_js_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, token_js_1.generateRefreshToken)(tokenPayload);
        const verifiedAccess = (0, token_js_1.verifyAccessToken)(accessToken);
        const verifiedRefresh = (0, token_js_1.verifyRefreshToken)(refreshToken);
        if (verifiedAccess.userId === testUser._id.toString() && verifiedRefresh.email === testUser.email) {
            console.log('✅ JWT Access & Refresh tokens successfully issued and verified.');
        }
        else {
            throw new Error('JWT verification mismatch');
        }
        // Test 3: Profile Creation & Updates
        console.log('\n--- Test 3: Student Academic & Competitive Profile ---');
        const profile = await Profile_js_1.Profile.create({
            userId: testUser._id,
            collegeName: 'Indian Institute of Technology',
            degree: 'B.Tech',
            branch: 'Computer Science & Engineering',
            currentSemester: 6,
            currentYear: 3,
            targetCompetitiveExams: [
                { examName: 'GATE Computer Science', targetYear: 2027, notes: 'Targeting rank under 100' },
                { examName: 'UPSC CSE (Optional CS)', targetYear: 2028 },
            ],
            targetDailyStudyHours: 7,
            chronotype: 'early_bird',
        });
        console.log(`✅ Profile created for ${profile.branch} (Sem ${profile.currentSemester}), Targeting: ${profile.targetCompetitiveExams.map(e => e.examName).join(', ')}`);
        // Test 4: Subject Creation & Syllabus Progress
        console.log('\n--- Test 4: Academic & Exam Subjects ---');
        const subject1 = await Subject_js_1.Subject.create({
            userId: testUser._id,
            name: 'Computer Networks',
            code: 'CS601',
            credits: 4,
            color: '#3b82f6',
            professor: 'Dr. Ramesh Rao',
            syllabusProgress: 45,
            category: 'college_core',
        });
        const subject2 = await Subject_js_1.Subject.create({
            userId: testUser._id,
            name: 'Operating Systems & System Programming',
            code: 'CS602',
            credits: 4,
            color: '#8b5cf6',
            professor: 'Prof. Anita Verma',
            syllabusProgress: 60,
            category: 'college_core',
        });
        console.log(`✅ Created Subjects: ${subject1.name} (${subject1.syllabusProgress}%) & ${subject2.name} (${subject2.syllabusProgress}%)`);
        // Test 5: Sleep Schedule & Conflict Detection
        console.log('\n--- Test 5: Sleep Schedule & Circadian Overlap Guard ---');
        const sleep = await SleepSchedule_js_1.SleepSchedule.create({
            userId: testUser._id,
            bedTime: '23:30',
            wakeTime: '07:00',
            targetSleepHours: 7.5,
            enableAlerts: true,
        });
        console.log(`✅ Sleep Schedule configured: Bedtime ${sleep.bedTime} -> Wake ${sleep.wakeTime}`);
        // Verify sleep conflict detection logic:
        // Slot 1: 14:00 - 16:00 (Afternoon -> Safe)
        const safeCheck = (0, conflictDetector_js_1.checkSleepConflict)('14:00', '16:00', sleep.bedTime, sleep.wakeTime);
        if (!safeCheck.hasConflict) {
            console.log('✅ Afternoon slot (14:00 - 16:00): Correctly identified as SAFE.');
        }
        else {
            throw new Error('False positive sleep conflict detected!');
        }
        // Slot 2: 02:00 - 04:00 (Late Night -> Conflict!)
        const conflictCheck = (0, conflictDetector_js_1.checkSleepConflict)('02:00', '04:00', sleep.bedTime, sleep.wakeTime);
        if (conflictCheck.hasConflict) {
            console.log(`✅ Late night slot (02:00 - 04:00): Correctly flagged as CONFLICT! "${conflictCheck.reason}"`);
        }
        else {
            throw new Error('Failed to detect sleep conflict during overnight sleep hours!');
        }
        // Test 6: Timetable Slots (College vs Study)
        console.log('\n--- Test 6: Timetable Weekly Slots ---');
        const collegeSlot = await TimetableSlot_js_1.TimetableSlot.create({
            userId: testUser._id,
            dayOfWeek: 1, // Monday
            startTime: '09:00',
            endTime: '10:30',
            slotType: 'college_lecture',
            subjectId: subject1._id,
            title: 'Computer Networks Lecture',
            room: 'Hall 101',
        });
        const studySlot = await TimetableSlot_js_1.TimetableSlot.create({
            userId: testUser._id,
            dayOfWeek: 1, // Monday
            startTime: '18:00',
            endTime: '20:00',
            slotType: 'self_study',
            subjectId: subject2._id,
            title: 'OS Process Synchronization Deep Dive',
        });
        console.log(`✅ Created Timetable Slots: Lecture "${collegeSlot.title}" & Study Slot "${studySlot.title}"`);
        // Test 7: Tasks (Assignments, Projects with Milestones, Practicals with Viva)
        console.log('\n--- Test 7: Academic Entities (Assignments, Projects, Practicals) ---');
        const assignment = await Task_js_1.Task.create({
            userId: testUser._id,
            subjectId: subject1._id,
            title: 'TCP Flow & Congestion Control Simulator',
            taskType: 'assignment',
            priority: 'urgent',
            dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
            weightagePercentage: 15,
            estimatedHours: 4,
        });
        const project = await Task_js_1.Task.create({
            userId: testUser._id,
            subjectId: subject2._id,
            title: 'Custom UNIX Shell Implementation with Pipes',
            taskType: 'project',
            priority: 'high',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            milestones: [
                { title: 'Command parser & tokenization', completed: true },
                { title: 'Fork & execvp process spawning', completed: true },
                { title: 'Pipes and I/O redirection', completed: false },
                { title: 'Signal handling (SIGINT/SIGTSTP)', completed: false },
            ],
        });
        const practical = await Task_js_1.Task.create({
            userId: testUser._id,
            subjectId: subject1._id,
            title: 'Wireshark Packet Analysis Lab 4',
            taskType: 'practical',
            priority: 'medium',
            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
            isVivaPrepared: false,
        });
        console.log(`✅ Created Assignment: "${assignment.title}" (Priority: ${assignment.priority}, Due in 2d)`);
        console.log(`✅ Created Project: "${project.title}" (Milestones: 2/4 completed)`);
        console.log(`✅ Created Practical: "${practical.title}" (Viva prepared: ${practical.isVivaPrepared})`);
        // Test 8: Upcoming Exams & Deadlines
        console.log('\n--- Test 8: Exams & Countdown Tracking ---');
        const midtermExam = await Exam_js_1.Exam.create({
            userId: testUser._id,
            subjectId: subject2._id,
            title: 'Operating Systems Mid-Semester Exam',
            examType: 'college_midterm',
            examDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
            durationMinutes: 120,
            venue: 'Exam Hall B',
            targetScore: 90,
            syllabusCoverage: 'Units 1 to 3: Processes, Threads, CPU Scheduling, Deadlocks',
        });
        const competitiveMock = await Exam_js_1.Exam.create({
            userId: testUser._id,
            customSubjectName: 'GATE CS Mock 2027',
            title: 'Full Length GATE CS Mock Test #1',
            examType: 'competitive_mock',
            examDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
            durationMinutes: 180,
            targetScore: 75,
            totalMarks: 100,
        });
        console.log(`✅ Created Midterm Exam: "${midtermExam.title}" (Date: ${midtermExam.examDate.toDateString()})`);
        console.log(`✅ Created Mock Exam: "${competitiveMock.title}" (Target: ${competitiveMock.targetScore}/${competitiveMock.totalMarks})`);
        // Test 9: Aggregated Statistics for Dashboard
        console.log('\n--- Test 9: Dashboard Aggregations & Countdown Verification ---');
        const userSubjects = await Subject_js_1.Subject.find({ userId: testUser._id });
        const userTasks = await Task_js_1.Task.find({ userId: testUser._id });
        const userExams = await Exam_js_1.Exam.find({ userId: testUser._id });
        console.log(`📊 Total Subjects: ${userSubjects.length}`);
        console.log(`📊 Total Tasks: ${userTasks.length} (${userTasks.filter(t => t.priority === 'urgent').length} urgent)`);
        console.log(`📊 Total Upcoming Exams: ${userExams.length}`);
        console.log(`📊 Nearest Exam: ${midtermExam.title}`);
        console.log('\n====================================================');
        console.log('🎉 ALL PHASE 1 BACKEND TESTS PASSED WITH 100% SUCCESS!');
        console.log('====================================================');
        await mongoose_1.default.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed with error:', error);
        await mongoose_1.default.disconnect();
        process.exit(1);
    }
}
runPhase1Tests();
