"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plannerService_js_1 = require("../services/plannerService.js");
const StudySession_js_1 = require("../models/StudySession.js");
const TimetableSlot_js_1 = require("../models/TimetableSlot.js");
const SleepSchedule_js_1 = require("../models/SleepSchedule.js");
const db_js_1 = require("../config/db.js");
const mongoose_1 = __importDefault(require("mongoose"));
const assert_1 = __importDefault(require("assert"));
async function runTests() {
    await (0, db_js_1.connectDB)();
    console.log('--- Running Phase 10 Planner Scheduling Tests ---');
    let passed = 0;
    let failed = 0;
    const test = async (name, fn) => {
        try {
            await fn();
            console.log(`✅ PASS: ${name}`);
            passed++;
        }
        catch (e) {
            console.log(`❌ FAIL: ${name}`);
            console.error(e.stack || e);
            failed++;
        }
    };
    const originalTimetableFind = TimetableSlot_js_1.TimetableSlot.find.bind(TimetableSlot_js_1.TimetableSlot);
    const originalSleepFindOne = SleepSchedule_js_1.SleepSchedule.findOne.bind(SleepSchedule_js_1.SleepSchedule);
    await test('Edge Case: Sleep boundaries overlapping into next day', async () => {
        TimetableSlot_js_1.TimetableSlot.find = (() => Promise.resolve([]));
        SleepSchedule_js_1.SleepSchedule.findOne = (() => Promise.resolve({ wakeTime: '08:00', bedTime: '02:00' }));
        const now = new Date('2026-10-10T12:00:00Z');
        const blocks = await plannerService_js_1.plannerService.getAvailableTimeBlocks('507f1f77bcf86cd799439011', now);
        // Wake time is 08:00 local, bed time is 02:00 local (which is the next day).
        assert_1.default.strictEqual(blocks.length, 1, 'Should have 1 continuous block');
        // We expect start to be 08:00 on targetDate, and end to be 02:00 on targetDate + 1
        const startHour = blocks[0].start.getHours();
        const endHour = blocks[0].end.getHours();
        const endDay = blocks[0].end.getDate();
        const startDay = blocks[0].start.getDate();
        assert_1.default.strictEqual(startHour, 8, 'Wake hour should be 8');
        assert_1.default.strictEqual(endHour, 2, 'Bed hour should be 2');
        assert_1.default.strictEqual(endDay, startDay + 1, 'Bed time should cross midnight boundary into next day');
    });
    await test('Edge Case: Overlapping Timetable slots', async () => {
        TimetableSlot_js_1.TimetableSlot.find = (() => Promise.resolve([
            { startTime: '10:00', endTime: '12:00' },
            { startTime: '11:00', endTime: '13:00' } // Overlaps
        ]));
        SleepSchedule_js_1.SleepSchedule.findOne = (() => Promise.resolve({ wakeTime: '08:00', bedTime: '22:00' }));
        const now = new Date('2026-10-10T12:00:00Z');
        const blocks = await plannerService_js_1.plannerService.getAvailableTimeBlocks('507f1f77bcf86cd799439011', now);
        assert_1.default.strictEqual(blocks.length, 2, 'Should create 2 blocks around the overlapping slot cluster');
        // Block 1: 08:00 to 10:00
        // Block 2: 13:00 to 22:00
        assert_1.default.strictEqual(blocks[0].start.getHours(), 8);
        assert_1.default.strictEqual(blocks[0].end.getHours(), 10);
        assert_1.default.strictEqual(blocks[1].start.getHours(), 13);
        assert_1.default.strictEqual(blocks[1].end.getHours(), 22);
    });
    await test('Edge Case: No available time left today for rescheduling', async () => {
        // If the timetable covers all waking hours
        TimetableSlot_js_1.TimetableSlot.find = (() => Promise.resolve([
            { startTime: '08:00', endTime: '22:00' }
        ]));
        SleepSchedule_js_1.SleepSchedule.findOne = (() => Promise.resolve({ wakeTime: '08:00', bedTime: '22:00' }));
        const originalFindOne = StudySession_js_1.StudySession.findOne;
        StudySession_js_1.StudySession.findOne = (() => Promise.resolve({
            _id: 'session1',
            userId: '507f1f77bcf86cd799439011',
            status: 'planned',
            durationMinutes: 60,
            save: () => Promise.resolve()
        }));
        let threw = false;
        try {
            await plannerService_js_1.plannerService.rescheduleMissedSession('507f1f77bcf86cd799439011', 'session1');
        }
        catch (e) {
            assert_1.default.match(e.message, /No available time slots/);
            threw = true;
        }
        assert_1.default.ok(threw, 'Should throw no available time error');
        StudySession_js_1.StudySession.findOne = originalFindOne;
    });
    // Restore
    TimetableSlot_js_1.TimetableSlot.find = originalTimetableFind;
    SleepSchedule_js_1.SleepSchedule.findOne = originalSleepFindOne;
    await mongoose_1.default.disconnect();
    console.log(`\nTests completed. Passed: ${passed}, Failed: ${failed}`);
    if (failed > 0)
        process.exit(1);
}
runTests();
