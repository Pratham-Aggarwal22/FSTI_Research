// utils/jwt.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Generate a random secret key if not provided in environment variables
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

// Log the auto-generated secret only in development, just for first-time setup
if (!process.env.JWT_SECRET && process.env.NODE_ENV !== 'production') {
  console.log('Auto-generated JWT_SECRET (add this to your .env file):', JWT_SECRET);
}

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Generate tokens
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
  
  return { accessToken, refreshToken };
};

// Verify a token
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
};

// Set auth cookies
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  console.log('Setting auth cookies...');
  
  // Set access token cookie
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: false, // Set to false for local development with HTTP
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  
  // Set refresh token cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: false, // Set to false for local development with HTTP
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // For debugging, also set a visible cookie
  res.cookie('is_logged_in', 'true', {
    httpOnly: false, // This can be seen via JavaScript
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  
  console.log('Auth cookies set successfully');
};

// Clear auth cookies
export const clearAuthCookies = (res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
  res.clearCookie('is_logged_in');
};