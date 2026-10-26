import api, { setInMemoryAccessToken } from './api';
import { User, Profile, SleepSchedule } from '../types';

export const authService = {
  async register(
    name: string,
    email: string,
    password: string,
    confirmPassword?: string,
    acceptedTerms: boolean = true
  ) {
    const res = await api.post('/auth/register', {
      name,
      email,
      password,
      confirmPassword,
      acceptedTerms,
    });
    return res.data;
  },

  async acceptLegalConsent(acceptedTerms: boolean = true) {
    const res = await api.post('/auth/legal-consent', { acceptedTerms });
    return res.data;
  },

  async login(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  async verifyEmail(email: string, otp: string) {
    const res = await api.post('/auth/verify-email', { email, otp });
    return res.data;
  },

  async resendVerification(email: string) {
    const res = await api.post('/auth/resend-verification', { email });
    return res.data;
  },

  async forgotPassword(email: string) {
    const res = await api.post('/auth/forgot-password', { email });
    return res.data;
  },

  async resetPassword(token: string, password: string, confirmPassword?: string) {
    const res = await api.post('/auth/reset-password', { token, password, confirmPassword });
    return res.data;
  },

  async changePassword(currentPassword: string, newPassword: string, confirmNewPassword?: string) {
    const res = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
      confirmNewPassword,
    });
    return res.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } finally {
      setInMemoryAccessToken(null);
    }
  },

  async getMe(): Promise<{ user: User; profile: Profile; sleepSchedule: SleepSchedule }> {
    const res = await api.get('/auth/me');
    return res.data.data;
  },

  async updateProfile(profileData: Partial<Profile>): Promise<Profile> {
    const res = await api.put('/profile', profileData);
    return res.data.data;
  },
};
