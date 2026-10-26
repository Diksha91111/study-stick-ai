import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from '../models/User.js';
import { ProgrammingProgress } from '../models/ProgrammingProgress.js';
import { LearningPath } from '../models/LearningPath.js';
import { AssessmentAttempt } from '../models/AssessmentAttempt.js';

dotenv.config();

async function resetDemo() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studystick_ai');
  const user = await User.findOne({ email: 'priya.sharma@studystick.ai' });
  if (user) {
    await ProgrammingProgress.deleteMany({ userId: user._id });
    await LearningPath.deleteMany({ userId: user._id });
    await AssessmentAttempt.deleteMany({ userId: user._id });
    console.log('✅ Cleared LearningPath, ProgrammingProgress, and AssessmentAttempt for Priya Sharma.');
  }
  await mongoose.disconnect();
}

resetDemo();
