"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed() {
    await mongoose_1.default.connect('mongodb://localhost:27017/studystick');
    const userColl = mongoose_1.default.connection.collection('users');
    const hashedPassword = await bcryptjs_1.default.hash('Password123!', 10);
    await userColl.updateOne({ email: 'studyuser@studystick.ai' }, {
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
    }, { upsert: true });
    console.log('Seeded studyuser@studystick.ai');
    await mongoose_1.default.disconnect();
}
seed();
