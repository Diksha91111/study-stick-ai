import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import bcrypt from 'bcryptjs';
import { ENV } from './src/config/env.js';

async function inspect() {
  await mongoose.connect(ENV.MONGODB_URI);
  const users = await User.find({}).select('+password +isEmailVerified +verificationTokenHash +verificationTokenExpires');
  console.log(`Found ${users.length} users in DB:`);
  for (const u of users) {
    console.log({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      isEmailVerified: u.isEmailVerified,
      hasVerificationToken: !!u.verificationTokenHash,
      verificationTokenExpires: u.verificationTokenExpires,
    });
  }
  await mongoose.disconnect();
}
inspect();
