import mongoose from 'mongoose';
import { User } from './src/models/User.js';
mongoose.connect('mongodb://127.0.0.1:27017/studystick_ai').then(async () => {
  const user = await User.findOne({email: 'priya.sharma@studystick.ai'}).select('+refreshTokenHash');
  console.log('User refreshTokenHash exists?', !!user?.refreshTokenHash);
  process.exit(0);
});
