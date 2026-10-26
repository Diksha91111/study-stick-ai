import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/token.js';
import { sendError } from '../utils/response.js';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const candidate = authHeader.split(' ')[1]?.trim();
      if (candidate && candidate !== 'null' && candidate !== 'undefined') {
        token = candidate;
      }
    }

    if (!token && req.cookies && req.cookies.accessToken) {
      const cookieToken = req.cookies.accessToken;
      if (cookieToken && cookieToken !== 'null' && cookieToken !== 'undefined') {
        token = cookieToken;
      }
    }

    if (!token && req.query && typeof req.query.token === 'string') {
      const queryToken = req.query.token.trim();
      if (queryToken && queryToken !== 'null' && queryToken !== 'undefined') {
        token = queryToken;
      }
    }

    if (!token) {
      sendError(res, 'Authentication required. No token provided.', 401);
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Access token has expired', 401);
      return;
    }
    sendError(res, 'Invalid authentication token', 403);
  }
};

export const requireAuth = authenticateToken;

