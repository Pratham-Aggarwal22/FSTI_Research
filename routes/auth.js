// routes/auth.js
import express from 'express';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { generateTokens, verifyToken, setAuthCookies, clearAuthCookies } from '../utils/jwt.js';

const router = express.Router();

// Render login page
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login', error: null });
});

// Render signup page
router.get('/signup', (req, res) => {
  res.render('auth/signup', { title: 'Sign Up', error: null });
});

// Handle login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username (case-insensitive) or email
    const user = await User.findOne({ 
      $or: [
        { username: new RegExp(`^${username}$`, 'i') },
        { email: username.toLowerCase() }
      ]
    });
    
    if (!user) {
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid username/email or password'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid username/email or password'
      });
    }
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    
    // Set auth cookies
    setAuthCookies(res, tokens);
    
    // Redirect to home page
    res.redirect('/');
  } catch (error) {
    console.error('Login error:', error);
    res.render('auth/login', { 
      title: 'Login', 
      error: 'An error occurred during login'
    });
  }
});

// Handle signup
router.post('/signup', async (req, res) => {
  try {
    const { 
      firstName,
      lastName,
      username, 
      email, 
      password, 
      confirmPassword,
      phone,
      organization,
      country,
      userType,
      researchInterest,
      preferredLanguage
    } = req.body;
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.render('auth/signup', { 
        title: 'Sign Up', 
        error: 'Passwords do not match'
      });
    }
    
    // Check if user already exists (case-insensitive for username)
    const existingUser = await User.findOne({ 
      $or: [
        { username: new RegExp(`^${username}$`, 'i') }, 
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.render('auth/signup', { 
        title: 'Sign Up', 
        error: 'Username or email already exists'
      });
    }
    
    // Create new user with all fields
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password,
      phone,
      organization,
      country,
      userType,
      researchInterest,
      preferredLanguage: preferredLanguage || 'english'
    });
    
    await user.save();
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    
    // Set auth cookies
    setAuthCookies(res, tokens);
    
    // Redirect to home page
    res.redirect('/');
  } catch (error) {
    console.error('Signup error:', error);
    res.render('auth/signup', { 
      title: 'Sign Up', 
      error: 'An error occurred during signup: ' + error.message
    });
  }
});

// Handle logout
router.get('/logout', (req, res) => {
  clearAuthCookies(res);
  res.redirect('/');
});

// Token refresh endpoint
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refresh_token;
    
    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token missing' });
    }
    
    // Verify refresh token
    const decoded = verifyToken(refreshToken);
    
    if (!decoded || decoded.type !== 'refresh') {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    
    // Generate new tokens
    const tokens = generateTokens(decoded.userId);
    
    // Set new cookies
    setAuthCookies(res, tokens);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Token refresh error:', error);
    clearAuthCookies(res);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

export default router;