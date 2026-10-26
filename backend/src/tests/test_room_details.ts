import mongoose from 'mongoose';
import { StudyRoom } from '../models/StudyRoom.js';
import { User } from '../models/User.js';
import { studyRoomService } from '../services/studyRoomService.js';

async function test() {
  await mongoose.connect('mongodb://localhost:27017/studystick_ai');
  const user = await User.findOne({ email: 'studyuser@studystick.ai' });
  console.log('User ID:', user?._id.toString());
  const rooms = await StudyRoom.find({});
  console.log('Rooms found:', rooms.length);
  for (const r of rooms) {
    console.log('Room ID:', r._id.toString(), 'name:', r.name, 'ownerId:', r.ownerId.toString(), 'members:', JSON.stringify(r.members));
    try {
      const details = await studyRoomService.getRoomDetails(r._id.toString(), r.ownerId.toString());
      console.log('getRoomDetails SUCCESS for owner', r._id.toString(), 'role:', details.myRole);
      const msgs = await studyRoomService.getMessages(r.ownerId.toString(), r._id.toString());
      console.log('getMessages SUCCESS:', msgs.length);
      const tsks = await studyRoomService.getTasks(r.ownerId.toString(), r._id.toString());
      console.log('getTasks SUCCESS:', tsks.length);
      const rsrcs = await studyRoomService.getSharedResources(r.ownerId.toString(), r._id.toString());
      console.log('getResources SUCCESS:', rsrcs.length);
      const qzs = await studyRoomService.getActiveQuiz(r.ownerId.toString(), r._id.toString());
      console.log('getQuizzes SUCCESS:', qzs.length);
    } catch (err: any) {
      console.log('FAILED for', r._id.toString(), ':', err.message);
    }
  }
  await mongoose.disconnect();
}
test();
