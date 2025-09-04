import { Request, Response, NextFunction } from 'express';

export const requireApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Authorization header is required',
      message: 'Please provide an Authorization header with Bearer token'
    });
  }

  // Check if it's a Bearer token
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Invalid authorization format',
      message: 'Authorization header must be in format: Bearer <API_KEY>'
    });
  }

  // Extract the token
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix

  // Check if token matches the API key from environment
  if (!process.env.API_KEY) {
    console.error('API_KEY environment variable is not set');
    return res.status(500).json({
      error: 'Server configuration error',
      message: 'API key is not configured on the server'
    });
  }

  if (token !== process.env.API_KEY) {
    return res.status(403).json({
      error: 'Invalid API key',
      message: 'The provided API key is not valid'
    });
  }

  // Token is valid, proceed
  next();
};
