"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getProfile = void 0;
const Profile_js_1 = require("../models/Profile.js");
const response_js_1 = require("../utils/response.js");
const getProfile = async (req, res, next) => {
    try {
        const profile = await Profile_js_1.Profile.findOne({ userId: req.user?.userId });
        if (!profile) {
            (0, response_js_1.sendError)(res, 'Profile not found', 404);
            return;
        }
        (0, response_js_1.sendSuccess)(res, profile, 'Profile retrieved successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res, next) => {
    try {
        const { collegeName, degree, branch, currentSemester, currentYear, targetCompetitiveExams, targetDailyStudyHours, chronotype, pomodoroWorkMins, pomodoroBreakMins, } = req.body;
        const profile = await Profile_js_1.Profile.findOneAndUpdate({ userId: req.user?.userId }, {
            $set: {
                ...(collegeName !== undefined && { collegeName }),
                ...(degree !== undefined && { degree }),
                ...(branch !== undefined && { branch }),
                ...(currentSemester !== undefined && { currentSemester }),
                ...(currentYear !== undefined && { currentYear }),
                ...(targetCompetitiveExams !== undefined && { targetCompetitiveExams }),
                ...(targetDailyStudyHours !== undefined && { targetDailyStudyHours }),
                ...(chronotype !== undefined && { chronotype }),
                ...(pomodoroWorkMins !== undefined && { pomodoroWorkMins }),
                ...(pomodoroBreakMins !== undefined && { pomodoroBreakMins }),
            },
        }, { new: true, upsert: true, runValidators: true });
        (0, response_js_1.sendSuccess)(res, profile, 'Profile updated successfully');
    }
    catch (error) {
        next(error);
    }
};
exports.updateProfile = updateProfile;
