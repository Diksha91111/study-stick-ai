"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppProvider = exports.MockWhatsAppClient = exports.TwilioWhatsAppClient = void 0;
exports.normalizePhoneNumber = normalizePhoneNumber;
exports.maskPhoneNumber = maskPhoneNumber;
const env_js_1 = require("../../config/env.js");
/**
 * Normalizes phone numbers to standard E.164 format (+[country][national_number])
 */
function normalizePhoneNumber(rawPhone) {
    if (!rawPhone)
        return null;
    // Remove spaces, hyphens, parentheses, dots
    let cleaned = rawPhone.replace(/[\s\-\(\)\.]/g, '');
    if (!cleaned.startsWith('+')) {
        // If not starting with +, cannot determine country code reliably without assumption
        return null;
    }
    // E.164 pattern: + followed by 7 to 15 digits
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(cleaned)) {
        return null;
    }
    return cleaned;
}
/**
 * Mask phone numbers for safe logging without exposing personal data
 */
function maskPhoneNumber(phone) {
    if (!phone || phone.length < 6)
        return '***';
    const prefix = phone.substring(0, 3);
    const suffix = phone.substring(phone.length - 4);
    return `${prefix}*****${suffix}`;
}
/**
 * Official Twilio WhatsApp Client
 */
class TwilioWhatsAppClient {
    accountSid;
    authToken;
    fromNumber;
    constructor(accountSid, authToken, fromNumber) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`;
    }
    async sendMessage(toPhone, text) {
        const formattedTo = toPhone.startsWith('whatsapp:') ? toPhone : `whatsapp:${toPhone}`;
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', this.fromNumber);
        params.append('To', formattedTo);
        params.append('Body', text);
        const basicAuth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${basicAuth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: params.toString(),
            });
            const data = await response.json();
            if (!response.ok) {
                return {
                    success: false,
                    status: 'FAILED',
                    error: data.message || `Twilio error HTTP ${response.status}`,
                };
            }
            return {
                success: true,
                status: 'SENT',
                messageId: data.sid,
            };
        }
        catch (err) {
            return {
                success: false,
                status: 'FAILED',
                error: err.message || 'Twilio connection failed',
            };
        }
    }
}
exports.TwilioWhatsAppClient = TwilioWhatsAppClient;
/**
 * Mock WhatsApp Client for Development & Testing
 */
class MockWhatsAppClient {
    async sendMessage(toPhone, text) {
        const masked = maskPhoneNumber(toPhone);
        console.log('\n==================================================');
        console.log('📱 [SIMULATED WHATSAPP NOTIFICATION - DEVELOPMENT ONLY]');
        console.log(`To (Masked): ${masked}`);
        console.log(`Message Body:\n${text}`);
        console.log('Status: SIMULATED SEND (Not delivered to real WhatsApp network)');
        console.log('==================================================\n');
        return {
            success: true,
            status: 'SENT',
            isSimulated: true,
            messageId: `sim_wa_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        };
    }
}
exports.MockWhatsAppClient = MockWhatsAppClient;
/**
 * WhatsAppProvider supporting official provider swapping and development mocks
 */
class WhatsAppProvider {
    channelName = 'whatsapp';
    client;
    isConfigured = false;
    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID;
        const authToken = process.env.TWILIO_AUTH_TOKEN;
        const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
        if (accountSid && authToken && fromNumber) {
            this.client = new TwilioWhatsAppClient(accountSid, authToken, fromNumber);
            this.isConfigured = true;
        }
        else {
            if (env_js_1.ENV.NODE_ENV !== 'production' || process.env.NODE_ENV === 'test_runner') {
                this.client = new MockWhatsAppClient();
                this.isConfigured = false;
            }
            else {
                // In production, instantiate a throwing client
                this.client = {
                    sendMessage: async () => ({
                        success: false,
                        status: 'FAILED',
                        error: 'Missing production WhatsApp credentials (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER).',
                    }),
                };
                this.isConfigured = false;
            }
        }
    }
    getIsConfigured() {
        return this.isConfigured;
    }
    async send(recipient, payload) {
        // 1. Consent verification
        if (!recipient.consentGiven) {
            return {
                success: false,
                status: 'FAILED',
                error: 'WhatsApp delivery rejected: User has not granted explicit WhatsApp notification consent.',
            };
        }
        // 2. Phone validation
        const normalizedPhone = normalizePhoneNumber(recipient.phone || '');
        if (!normalizedPhone) {
            return {
                success: false,
                status: 'FAILED',
                error: 'WhatsApp delivery rejected: Invalid or unnormalized E.164 phone number.',
            };
        }
        // 3. Format message
        const actionUrl = payload.actionUrl?.startsWith('http')
            ? payload.actionUrl
            : `${env_js_1.ENV.FRONTEND_URL}${payload.actionUrl || '/planner'}`;
        const text = `⚡ *Study Stick AI - ${payload.title}*\n\n` +
            `Hi ${recipient.name || 'Student'},\n` +
            `${payload.message}\n\n` +
            `🔗 *Action:* ${actionUrl}\n\n` +
            `_Plan. Learn. Practice. Analyze. Adapt. Improve._`;
        return await this.client.sendMessage(normalizedPhone, text);
    }
}
exports.WhatsAppProvider = WhatsAppProvider;
