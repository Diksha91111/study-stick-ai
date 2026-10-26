import { Response } from 'express';

export const sendSuccess = <T>(
  res: Response,
  data: T,
  message = 'Success',
  statusCode = 200
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res: Response,
  message = 'Internal server error',
  statusCode = 500,
  data?: any
) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(data !== undefined && { data }),
  });
};

