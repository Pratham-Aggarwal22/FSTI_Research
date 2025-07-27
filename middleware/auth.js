// middleware/auth.js
import User from '../models/User.js';
import { verifyToken, generateTokens, setAuthCookies } from '../utils/jwt.js';

// Middleware to check authentication
export const authenticate = async (req, res, next) => {
  try {
    // Log all cookies for debugging
    console.log("Authentication middleware - Cookies:", req.cookies);
    
    // Get access token from cookie
    const accessToken = req.cookies.access_token;
    
    if (!accessToken) {
      console.log("No access_token cookie found");
      return res.redirect('/auth/login');
    }
    
    // Verify access token
    const decoded = verifyToken(accessToken);
    console.log("Decoded token:", decoded);
    
    if (!decoded || decoded.type !== 'access') {
      console.log("Invalid token or wrong token type");
      return res.redirect('/auth/login');
    }
    
    // Find user by id
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      console.log("User not found for ID:", decoded.userId);
      return res.redirect('/auth/login');
    }
    
    // Attach user to request object
    console.log("Authentication successful for user:", user.username);
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
  // Log current route
  console.log("Route accessed:", req.originalUrl);
  
  // List of routes that don't require authentication
  const publicRoutes = ['/', '/auth/login', '/auth/signup', '/auth/refresh', '/auth-debug'];
  const isApiAverageValues = req.originalUrl.startsWith('/api/averageValues');
  const isApiChatbot = req.originalUrl.startsWith('/api/chatbot');
  const isPublicAsset = req.originalUrl.startsWith('/css/') || 
                        req.originalUrl.startsWith('/js/') || 
                        req.originalUrl.startsWith('/img/');
  
  if (publicRoutes.includes(req.originalUrl) || isApiAverageValues || isApiChatbot || isPublicAsset) {
    console.log("Public route, no authentication required");
    return next();
  }
  
  console.log("Protected route, authentication required");
  // For all other routes, apply authentication
  authenticate(req, res, next);
};