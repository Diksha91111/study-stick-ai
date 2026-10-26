import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/studystick_ai');
    const adminDb = mongoose.connection.db.admin();
    const info = await adminDb.command({ replSetGetStatus: 1 });
    console.log('Replica Set OK:', info.ok);
  } catch (err: any) {
    console.log('Replica Set Check Failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}
check();
