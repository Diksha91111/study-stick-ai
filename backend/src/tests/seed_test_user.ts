import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/studystick');
  const userColl = mongoose.connection.collection('users');
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  await userColl.updateOne(
    { email: 'studyuser@studystick.ai' },
    {
      $set: {
        name: 'Priya Sharma',
        email: 'studyuser@studystick.ai',
        password: hashedPassword,
        isEmailVerified: true,
        legalConsent: {
          termsAcceptedAt: new Date(),
          termsVersion: '1.0',
          privacyAcceptedAt: new Date(),
          privacyVersion: '1.0',
        },
      },
    },
    { upsert: true }
  );
  console.log('Seeded studyuser@studystick.ai');
  await mongoose.disconnect();
}
seed();
