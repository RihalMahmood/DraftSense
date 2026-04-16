import { Request, Response, NextFunction } from 'express';

//eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = process.env.NODE_ENV !== 'production';

  console.error('Unhandled error:', err.message);

  res.status(500).json({
    error: 'Internal server error',
    message: isDev ? err.message : 'Something went wrong',
    ...(isDev && { stack: err.stack }),
  });
};
