// middleware/auth.js
import User from '../models/User.js';
import { verifyToken, generateTokens, setAuthCookies } from '../utils/jwt.js';

// Middleware to check authentication
export const authenticate = async (req, res, next) => {
  try {
    // Get access token from cookie
    const accessToken = req.cookies.access_token;
    
    if (!accessToken) {
      return res.redirect('/auth/login');
    }
    
    // Verify access token
    const decoded = verifyToken(accessToken);
    
    if (!decoded || decoded.type !== 'access') {
      return res.redirect('/auth/login');
    }
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.redirect('/auth/login');
    }
    
    // Attach user to request object
    req.user = user;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.redirect('/auth/login');
  }
};

// Middleware to refresh tokens if needed
export const refreshTokenIfNeeded = async (req, res, next) => {
  try {
    // Get access token from cookie
    const accessToken = req.cookies.access_token;
    
    // If no token, continue without refreshing
    if (!accessToken) {
      return next();
    }
    
    // Try to decode token without verification to check expiry
    const decodedToken = jwt.decode(accessToken);
    
    // If no decoded token or it's far from expiry, continue
    if (!decodedToken) {
      return next();
    }
    
    // Check if token is going to expire soon (less than 10 minutes)
    const tokenExp = decodedToken.exp * 1000; // Convert to milliseconds
    const now = Date.now();
    const timeUntilExpiry = tokenExp - now;
    
    // If token is valid for more than 10 minutes, continue
    if (timeUntilExpiry > 10 * 60 * 1000) {
      return next();
    }
    
    // Get refresh token
    const refreshToken = req.cookies.refresh_token;
    
    // If no refresh token, continue without refreshing
    if (!refreshToken) {
      return next();
    }
    
    // Verify refresh token
    const refreshDecoded = verifyToken(refreshToken);
    
    if (!refreshDecoded || refreshDecoded.type !== 'refresh') {
      return next();
    }
    
    // Generate new tokens
    const tokens = generateTokens(refreshDecoded.userId);
    
    // Set new cookies
    setAuthCookies(res, tokens);
    
    // Find user by id
    const user = await User.findById(refreshDecoded.userId);
    
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Just continue if refresh fails
    next();
  }
};

// Selective authentication middleware
export const isGuestRoute = (req, res, next) => {
  // List of routes that don't require authentication
  const publicRoutes = new Set(['/', '/auth/login', '/auth/signup', '/auth/refresh', '/auth-debug', '/auth/check-availability']);
  const requestPath = req.path || req.originalUrl;
  const isApiAverageValues = req.originalUrl.startsWith('/api/averageValues');
  const isApiChatbot = req.originalUrl.startsWith('/api/chatbot');
  const isPublicAsset = req.originalUrl.startsWith('/css/') || 
                        req.originalUrl.startsWith('/js/') || 
                        req.originalUrl.startsWith('/img/');
  
  if (publicRoutes.has(requestPath) || isApiAverageValues || isApiChatbot || isPublicAsset) {
    return next();
  }
  
  // For all other routes, apply authentication
  authenticate(req, res, next);
};