"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoData = seedDemoData;
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
async function seedDemoData() {
    console.log('[Seed] Seeding demo student data for Study Stick AI...');
    try {
        await mongoose_1.default.connect(env_js_1.ENV.MONGODB_URI);
        const demoEmail = 'priya.sharma@studystick.ai';
        let user = await User_js_1.User.findOne({ email: demoEmail });
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash('Password123!', salt);
        if (!user) {
            user = await User_js_1.User.create({
                name: 'Priya Sharma',
                email: demoEmail,
                password: hashedPassword,
                isEmailVerified: true,
            });
            console.log('✅ Created demo student account:', demoEmail);
        }
        else {
            user.password = hashedPassword;
            user.isEmailVerified = true;
            await user.save();
            console.log('✅ Updated demo student account password and verification status');
        }
        // Clean existing seed data for this user to avoid duplicates
        await Promise.all([
            Profile_js_1.Profile.deleteMany({ userId: user._id }),
            Subject_js_1.Subject.deleteMany({ userId: user._id }),
            TimetableSlot_js_1.TimetableSlot.deleteMany({ userId: user._id }),
            SleepSchedule_js_1.SleepSchedule.deleteMany({ userId: user._id }),
            Task_js_1.Task.deleteMany({ userId: user._id }),
            Exam_js_1.Exam.deleteMany({ userId: user._id }),
        ]);
        // 1. Profile
        await Profile_js_1.Profile.create({
            userId: user._id,
            collegeName: 'Indian Institute of Technology (IIT)',
            degree: 'B.Tech',
            branch: 'Computer Science & Engineering',
            currentSemester: 6,
            currentYear: 3,
            targetCompetitiveExams: [
                { examName: 'GATE Computer Science', targetYear: 2027, notes: 'Target AIR < 200' },
                { examName: 'UPSC CSE (CS Optional)', targetYear: 2028 },
            ],
            targetDailyStudyHours: 7,
            chronotype: 'early_bird',
            pomodoroWorkMins: 50,
            pomodoroBreakMins: 10,
        });
        // 2. Sleep Schedule
        await SleepSchedule_js_1.SleepSchedule.create({
            userId: user._id,
            bedTime: '23:30',
            wakeTime: '07:00',
            targetSleepHours: 7.5,
            windDownMinutes: 30,
            enableAlerts: true,
        });
        // 3. Subjects
        const subOS = await Subject_js_1.Subject.create({
            userId: user._id,
            name: 'Operating Systems & Concurrency',
            code: 'CS601',
            color: '#6366f1', // Indigo
            credits: 4,
            professor: 'Dr. Ramesh Rao',
            syllabusProgress: 65,
            category: 'college_core',
            totalHoursTarget: 45,
        });
        const subCN = await Subject_js_1.Subject.create({
            userId: user._id,
            name: 'Computer Networks & Security',
            code: 'CS602',
            color: '#06b6d4', // Cyan
            credits: 4,
            professor: 'Prof. Anita Verma',
            syllabusProgress: 48,
            category: 'college_core',
            totalHoursTarget: 40,
        });
        const subTOC = await Subject_js_1.Subject.create({
            userId: user._id,
            name: 'Theory of Computation & Automata',
            code: 'CS603',
            color: '#8b5cf6', // Violet
            credits: 3,
            professor: 'Dr. Arvind Mishra',
            syllabusProgress: 75,
            category: 'college_core',
            totalHoursTarget: 35,
        });
        const subGATE = await Subject_js_1.Subject.create({
            userId: user._id,
            name: 'GATE CS: Algorithms & Data Structures',
            code: 'GATE-DS',
            color: '#ec4899', // Pink
            credits: 0,
            professor: 'Self Prep & NPTEL',
            syllabusProgress: 55,
            category: 'competitive_exam',
            totalHoursTarget: 80,
        });
        // 4. Timetable Slots
        // Monday (1)
        await TimetableSlot_js_1.TimetableSlot.create([
            {
                userId: user._id,
                dayOfWeek: 1,
                startTime: '09:00',
                endTime: '10:30',
                slotType: 'college_lecture',
                subjectId: subOS._id,
                title: 'Operating Systems: Memory Management',
                room: 'Lecture Hall 204',
                color: '#6366f1',
            },
            {
                userId: user._id,
                dayOfWeek: 1,
                startTime: '11:00',
                endTime: '12:30',
                slotType: 'college_lecture',
                subjectId: subCN._id,
                title: 'Computer Networks: TCP/IP Stack',
                room: 'Lecture Hall 102',
                color: '#06b6d4',
            },
            {
                userId: user._id,
                dayOfWeek: 1,
                startTime: '14:00',
                endTime: '16:00',
                slotType: 'college_lab',
                subjectId: subOS._id,
                title: 'OS System Calls & Shell Lab',
                room: 'Software Lab 3',
                color: '#6366f1',
            },
            {
                userId: user._id,
                dayOfWeek: 1,
                startTime: '18:30',
                endTime: '20:30',
                slotType: 'self_study',
                subjectId: subGATE._id,
                title: 'Dynamic Programming & Graph Algorithms',
                room: 'Study Desk',
                color: '#ec4899',
            },
            // Tuesday (2)
            {
                userId: user._id,
                dayOfWeek: 2,
                startTime: '09:30',
                endTime: '11:00',
                slotType: 'college_lecture',
                subjectId: subTOC._id,
                title: 'TOC: Pushdown Automata & CFLs',
                room: 'Hall 301',
                color: '#8b5cf6',
            },
            {
                userId: user._id,
                dayOfWeek: 2,
                startTime: '14:00',
                endTime: '16:00',
                slotType: 'college_lab',
                subjectId: subCN._id,
                title: 'Networks: Wireshark Packet Sniffing Lab',
                room: 'Network Lab 1',
                color: '#06b6d4',
            },
            {
                userId: user._id,
                dayOfWeek: 2,
                startTime: '19:00',
                endTime: '21:00',
                slotType: 'exam_prep',
                subjectId: subGATE._id,
                title: 'GATE CS Previous Year Questions (PYQs)',
                room: 'Library',
                color: '#ec4899',
            },
            // Wednesday (3)
            {
                userId: user._id,
                dayOfWeek: 3,
                startTime: '10:00',
                endTime: '11:30',
                slotType: 'college_lecture',
                subjectId: subOS._id,
                title: 'OS: Deadlock Avoidance Algorithms',
                room: 'Hall 204',
                color: '#6366f1',
            },
            {
                userId: user._id,
                dayOfWeek: 3,
                startTime: '18:00',
                endTime: '20:00',
                slotType: 'self_study',
                subjectId: subCN._id,
                title: 'Subnetting & CIDR Routing Practice',
                room: 'Study Desk',
                color: '#06b6d4',
            },
            // Thursday (4)
            {
                userId: user._id,
                dayOfWeek: 4,
                startTime: '09:00',
                endTime: '10:30',
                slotType: 'college_lecture',
                subjectId: subTOC._id,
                title: 'TOC: Turing Machines & Decidability',
                room: 'Hall 301',
                color: '#8b5cf6',
            },
            {
                userId: user._id,
                dayOfWeek: 4,
                startTime: '16:00',
                endTime: '18:00',
                slotType: 'self_study',
                subjectId: subOS._id,
                title: 'Virtual Memory & Page Replacement',
                room: 'Hostel Study Room',
                color: '#6366f1',
            },
            // Friday (5)
            {
                userId: user._id,
                dayOfWeek: 5,
                startTime: '11:00',
                endTime: '12:30',
                slotType: 'college_tutorial',
                subjectId: subCN._id,
                title: 'Computer Networks Problem Solving Tutorial',
                room: 'Tutorial Room 4',
                color: '#06b6d4',
            },
            {
                userId: user._id,
                dayOfWeek: 5,
                startTime: '17:00',
                endTime: '19:30',
                slotType: 'exam_prep',
                subjectId: subGATE._id,
                title: 'GATE Weekly Mock Test Analysis',
                room: 'Study Desk',
                color: '#ec4899',
            },
            // Saturday (6)
            {
                userId: user._id,
                dayOfWeek: 6,
                startTime: '10:00',
                endTime: '13:00',
                slotType: 'exam_prep',
                subjectId: subGATE._id,
                title: 'Full Length Competitive Test Simulation',
                room: 'Online Portal',
                color: '#ec4899',
            },
            // Sunday (7)
            {
                userId: user._id,
                dayOfWeek: 7,
                startTime: '17:00',
                endTime: '19:00',
                slotType: 'self_study',
                subjectId: subTOC._id,
                title: 'Weekly Syllabus Revision & Weak Topic Notes',
                room: 'Study Desk',
                color: '#8b5cf6',
            },
        ]);
        // 5. Tasks (Assignments, Projects with Milestones, Practicals with Viva)
        const now = Date.now();
        await Task_js_1.Task.create([
            {
                userId: user._id,
                subjectId: subCN._id,
                title: 'Socket Programming: Multi-threaded HTTP Server in C/C++',
                taskType: 'assignment',
                priority: 'urgent',
                dueDate: new Date(now + 2 * 24 * 60 * 60 * 1000 + 4 * 3600 * 1000), // ~2 days
                estimatedHours: 6,
                weightagePercentage: 15,
                description: 'Implement a non-blocking TCP socket server handling GET/POST requests with thread pooling.',
            },
            {
                userId: user._id,
                subjectId: subOS._id,
                title: 'Custom UNIX Shell with Pipes & Redirection',
                taskType: 'project',
                priority: 'high',
                dueDate: new Date(now + 9 * 24 * 60 * 60 * 1000),
                estimatedHours: 14,
                weightagePercentage: 25,
                description: 'A POSIX compliant shell supporting cd, history, job control, multiple piping (|) and file redirection (<, >).',
                milestones: [
                    { title: 'Grammar and command parser', completed: true },
                    { title: 'Fork & execvp system call integration', completed: true },
                    { title: 'Multi-stage pipe IPC handling', completed: false },
                    { title: 'Signal handling (SIGINT/SIGTSTP) & job control', completed: false },
                ],
            },
            {
                userId: user._id,
                subjectId: subCN._id,
                title: 'Wireshark Packet Capture & Protocol Analysis Report',
                taskType: 'practical',
                priority: 'medium',
                dueDate: new Date(now + 4 * 24 * 60 * 60 * 1000),
                estimatedHours: 3,
                weightagePercentage: 10,
                isVivaPrepared: false,
                description: 'Capture 3-way TCP handshake, DNS query resolution, and TLS 1.3 key exchange payloads.',
            },
            {
                userId: user._id,
                subjectId: subTOC._id,
                title: 'Chomsky Normal Form & Pumping Lemma Problem Set',
                taskType: 'assignment',
                priority: 'medium',
                dueDate: new Date(now + 6 * 24 * 60 * 60 * 1000),
                estimatedHours: 4,
                weightagePercentage: 10,
            },
        ]);
        // 6. Exams
        await Exam_js_1.Exam.create([
            {
                userId: user._id,
                subjectId: subOS._id,
                title: 'Operating Systems Mid-Semester Examination',
                examType: 'college_midterm',
                examDate: new Date(now + 7 * 24 * 60 * 60 * 1000 + 10 * 3600 * 1000), // in 7 days
                durationMinutes: 120,
                venue: 'Examination Hall B (Room 302)',
                syllabusCoverage: 'Units 1-3: Processes, Threads, CPU Scheduling, Deadlock Avoidance',
                targetScore: 92,
                totalMarks: 100,
                status: 'upcoming',
                notes: 'Review Banker Algorithm and Petersons Solution proofs',
            },
            {
                userId: user._id,
                customSubjectName: 'GATE 2027 Computer Science',
                title: 'GATE CS All-India Live Mock Test #3',
                examType: 'competitive_mock',
                examDate: new Date(now + 13 * 24 * 60 * 60 * 1000 + 14 * 3600 * 1000), // in 13 days
                durationMinutes: 180,
                venue: 'Online Test Portal (Virtual Exam Mode)',
                syllabusCoverage: 'Algorithms, Data Structures, Discrete Mathematics, TOC',
                targetScore: 78,
                totalMarks: 100,
                status: 'upcoming',
                notes: 'Target 99.5 percentile benchmark',
            },
            {
                userId: user._id,
                subjectId: subTOC._id,
                title: 'Automata Theory Unit Test 1',
                examType: 'college_unit_test',
                examDate: new Date(now - 14 * 24 * 60 * 60 * 1000),
                durationMinutes: 60,
                venue: 'Room 201',
                targetScore: 25,
                totalMarks: 30,
                actualScore: 27,
                status: 'completed',
            },
        ]);
        console.log('🎉 [Seed] Demo student data successfully populated!');
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ [Seed] Error seeding data:', error);
        await mongoose_1.default.disconnect();
    }
}
seedDemoData();
