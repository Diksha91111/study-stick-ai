"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const StudyRoom_js_1 = require("../models/StudyRoom.js");
const User_js_1 = require("../models/User.js");
const studyRoomService_js_1 = require("../services/studyRoomService.js");
async function test() {
    await mongoose_1.default.connect('mongodb://localhost:27017/studystick_ai');
    const user = await User_js_1.User.findOne({ email: 'studyuser@studystick.ai' });
    console.log('User ID:', user?._id.toString());
    const rooms = await StudyRoom_js_1.StudyRoom.find({});
    console.log('Rooms found:', rooms.length);
    for (const r of rooms) {
        console.log('Room ID:', r._id.toString(), 'name:', r.name, 'ownerId:', r.ownerId.toString(), 'members:', JSON.stringify(r.members));
        try {
            const details = await studyRoomService_js_1.studyRoomService.getRoomDetails(r._id.toString(), r.ownerId.toString());
            console.log('getRoomDetails SUCCESS for owner', r._id.toString(), 'role:', details.myRole);
            const msgs = await studyRoomService_js_1.studyRoomService.getMessages(r.ownerId.toString(), r._id.toString());
            console.log('getMessages SUCCESS:', msgs.length);
            const tsks = await studyRoomService_js_1.studyRoomService.getTasks(r.ownerId.toString(), r._id.toString());
            console.log('getTasks SUCCESS:', tsks.length);
            const rsrcs = await studyRoomService_js_1.studyRoomService.getSharedResources(r.ownerId.toString(), r._id.toString());
            console.log('getResources SUCCESS:', rsrcs.length);
            const qzs = await studyRoomService_js_1.studyRoomService.getActiveQuiz(r.ownerId.toString(), r._id.toString());
            console.log('getQuizzes SUCCESS:', qzs.length);
        }
        catch (err) {
            console.log('FAILED for', r._id.toString(), ':', err.message);
        }
    }
    await mongoose_1.default.disconnect();
}
test();
