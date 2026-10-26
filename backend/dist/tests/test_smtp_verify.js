"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../config/env.js");
async function testSmtp() {
    console.log('Testing SMTP connection with current configuration...');
    console.log('Host:', env_js_1.ENV.SMTP_HOST);
    console.log('Port:', env_js_1.ENV.SMTP_PORT);
    console.log('User:', env_js_1.ENV.SMTP_USER ? `${env_js_1.ENV.SMTP_USER.substring(0, 3)}***@${env_js_1.ENV.SMTP_USER.split('@')[1]}` : '(empty)');
    console.log('Password set:', !!env_js_1.ENV.SMTP_PASSWORD, `(length: ${env_js_1.ENV.SMTP_PASSWORD?.length || 0})`);
    // Test 1: Standard host + port config
    console.log('\n--- Attempt 1: host/port config ---');
    const transporter1 = nodemailer_1.default.createTransport({
        host: env_js_1.ENV.SMTP_HOST,
        port: env_js_1.ENV.SMTP_PORT,
        secure: env_js_1.ENV.SMTP_PORT === 465,
        auth: {
            user: env_js_1.ENV.SMTP_USER,
            pass: env_js_1.ENV.SMTP_PASSWORD,
        },
    });
    try {
        const res1 = await transporter1.verify();
        console.log('Attempt 1 SUCCESS:', res1);
    }
    catch (err) {
        console.log('Attempt 1 FAILED:', err.message, err.code, err.responseCode);
    }
    // Test 2: If Gmail, test with port 465 (SSL)
    console.log('\n--- Attempt 2: Gmail SSL (port 465) ---');
    const transporter2 = nodemailer_1.default.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
            user: env_js_1.ENV.SMTP_USER,
            pass: env_js_1.ENV.SMTP_PASSWORD,
        },
    });
    try {
        const res2 = await transporter2.verify();
        console.log('Attempt 2 SUCCESS:', res2);
    }
    catch (err) {
        console.log('Attempt 2 FAILED:', err.message, err.code, err.responseCode);
    }
    // Test 3: If Gmail, test with service: 'gmail'
    console.log('\n--- Attempt 3: service: "gmail" ---');
    const transporter3 = nodemailer_1.default.createTransport({
        service: 'gmail',
        auth: {
            user: env_js_1.ENV.SMTP_USER,
            pass: env_js_1.ENV.SMTP_PASSWORD,
        },
    });
    try {
        const res3 = await transporter3.verify();
        console.log('Attempt 3 SUCCESS:', res3);
    }
    catch (err) {
        console.log('Attempt 3 FAILED:', err.message, err.code, err.responseCode);
    }
}
testSmtp();
