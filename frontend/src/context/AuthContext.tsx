import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Profile, SleepSchedule } from '../types';
import { authService } from '../services/authService';
import { setInMemoryAccessToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  sleepSchedule: SleepSchedule | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string,
    acceptedTerms?: boolean
  ) => Promise<{ message: string; data?: any; success?: boolean }>;
  acceptLegalConsent: (acceptedTerms?: boolean) => Promise<any>;
  verifyEmail: (email: string, otp: string) => Promise<{ message: string }>;
  resendVerification: (
    email: string
  ) => Promise<{ message: string; data?: any; success?: boolean }>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (
    token: string,
    password: string,
    confirmPassword?: string
  ) => Promise<{ message: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword?: string
  ) => Promise<{ message: string }>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sleepSchedule, setSleepSchedule] = useState<SleepSchedule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    try {
      const data = await authService.getMe();
      setUser(data.user);
      setProfile(data.profile);
      setSleepSchedule(data.sleepSchedule);
    } catch {
      // Silently fail — unauthenticated guest, no session
      setUser(null);
      setProfile(null);
      setSleepSchedule(null);
      setInMemoryAccessToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();

    // Listen for session expiry from API interceptor
    const handleSessionExpired = () => {
      setUser(null);
      setProfile(null);
      setSleepSchedule(null);
      setInMemoryAccessToken(null);
    };

    window.addEventListener('session-expired', handleSessionExpired);
    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await authService.login(email, password);
      if (res.data?.accessToken) {
        setInMemoryAccessToken(res.data.accessToken);
      }
      // Use data directly from login response — avoids a second /auth/me call
      if (res.data?.user) {
        setUser(res.data.user);
      }
      // Fetch full profile + sleepSchedule data after login
      await fetchUserData();
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    confirmPassword?: string,
    acceptedTerms?: boolean
  ) => {
    // Don't set global isLoading — RegisterPage manages its own loading state
    const res = await authService.register(name, email, password, confirmPassword, acceptedTerms);
    return {
      message: res.message || 'Registration successful! Check your email to verify.',
      data: res.data,
      success: res.success,
    };
  };

  const acceptLegalConsent = async (acceptedTerms: boolean = true) => {
    setIsLoading(true);
    try {
      const res = await authService.acceptLegalConsent(acceptedTerms);
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await fetchUserData();
      }
      return res;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (email: string, otp: string) => {
    const res = await authService.verifyEmail(email, otp);
    return { message: res.message || 'Email verified successfully!' };
  };

  const resendVerification = async (email: string) => {
    const res = await authService.resendVerification(email);
    return {
      message: res.message || 'Verification email resent.',
      data: res.data,
      success: res.success,
    };
  };

  const forgotPassword = async (email: string) => {
    const res = await authService.forgotPassword(email);
    return { message: res.message || 'Password reset link sent to your email.' };
  };

  const resetPassword = async (
    token: string,
    password: string,
    confirmPassword?: string
  ) => {
    const res = await authService.resetPassword(token, password, confirmPassword);
    return { message: res.message || 'Password reset successfully!' };
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string,
    confirmNewPassword?: string
  ) => {
    const res = await authService.changePassword(
      currentPassword,
      newPassword,
      confirmNewPassword
    );
    await fetchUserData();
    return { message: res.message || 'Password changed successfully!' };
  };

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setProfile(null);
      setSleepSchedule(null);
      setInMemoryAccessToken(null);
    }
  };

  const refreshProfile = async () => {
    await fetchUserData();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        sleepSchedule,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        acceptLegalConsent,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        changePassword,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

