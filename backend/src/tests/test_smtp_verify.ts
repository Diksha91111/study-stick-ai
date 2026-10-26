import nodemailer from 'nodemailer';
import { ENV } from '../config/env.js';

async function testSmtp() {
  console.log('Testing SMTP connection with current configuration...');
  console.log('Host:', ENV.SMTP_HOST);
  console.log('Port:', ENV.SMTP_PORT);
  console.log('User:', ENV.SMTP_USER ? `${ENV.SMTP_USER.substring(0, 3)}***@${ENV.SMTP_USER.split('@')[1]}` : '(empty)');
  console.log('Password set:', !!ENV.SMTP_PASSWORD, `(length: ${ENV.SMTP_PASSWORD?.length || 0})`);

  // Test 1: Standard host + port config
  console.log('\n--- Attempt 1: host/port config ---');
  const transporter1 = nodemailer.createTransport({
    host: ENV.SMTP_HOST,
    port: ENV.SMTP_PORT,
    secure: ENV.SMTP_PORT === 465,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD,
    },
  });

  try {
    const res1 = await transporter1.verify();
    console.log('Attempt 1 SUCCESS:', res1);
  } catch (err: any) {
    console.log('Attempt 1 FAILED:', err.message, err.code, err.responseCode);
  }

  // Test 2: If Gmail, test with port 465 (SSL)
  console.log('\n--- Attempt 2: Gmail SSL (port 465) ---');
  const transporter2 = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD,
    },
  });

  try {
    const res2 = await transporter2.verify();
    console.log('Attempt 2 SUCCESS:', res2);
  } catch (err: any) {
    console.log('Attempt 2 FAILED:', err.message, err.code, err.responseCode);
  }

  // Test 3: If Gmail, test with service: 'gmail'
  console.log('\n--- Attempt 3: service: "gmail" ---');
  const transporter3 = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: ENV.SMTP_USER,
      pass: ENV.SMTP_PASSWORD,
    },
  });

  try {
    const res3 = await transporter3.verify();
    console.log('Attempt 3 SUCCESS:', res3);
  } catch (err: any) {
    console.log('Attempt 3 FAILED:', err.message, err.code, err.responseCode);
  }
}

testSmtp();
