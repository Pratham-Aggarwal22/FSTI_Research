// utils/jwt.js
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Get JWT secret from environment variables (lazy check)
const getJWTSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    process.exit(1);
  }
  return secret;
};

// Token expiry times
const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Generate tokens
export const generateTokens = (userId) => {
  const JWT_SECRET = getJWTSecret();
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
    const JWT_SECRET = getJWTSecret();
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Set auth cookies
export const setAuthCookies = (res, { accessToken, refreshToken }) => {
  // Set access token cookie
  res.cookie('access_token', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Enable secure in production
    sameSite: 'lax',
    maxAge: 60 * 60 * 1000 // 1 hour
  });
  
  // Set refresh token cookie
  res.cookie('refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // Enable secure in production
    sameSite: 'lax',
    path: '/auth/refresh',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // For debugging, also set a visible cookie
  res.cookie('is_logged_in', 'true', {
    httpOnly: false, // This can be seen via JavaScript
    maxAge: 60 * 60 * 1000 // 1 hour
  });
};

// Clear auth cookies
export const clearAuthCookies = (res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token', { path: '/auth/refresh' });
  res.clearCookie('is_logged_in');
};