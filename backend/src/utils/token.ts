import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env.js';

export interface TokenPayload {
  userId: string;
  email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    ENV.JWT_ACCESS_SECRET,
    {
      jwtid: crypto.randomUUID(),
      expiresIn: (ENV.JWT_ACCESS_EXPIRES_IN || '15m') as any,
    }
  );
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    ENV.JWT_REFRESH_SECRET,
    {
      jwtid: crypto.randomUUID(),
      expiresIn: (ENV.JWT_REFRESH_EXPIRES_IN || '7d') as any,
    }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
};
