import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async (): Promise<boolean> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    console.warn('[MongoDB] Continuing without database connection. Some features may not work.');
    return false;
  }
};
