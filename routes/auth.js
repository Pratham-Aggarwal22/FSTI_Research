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
    
    console.log("Login attempt for username:", username);
    
    // Find user by username
    const user = await User.findOne({ username });
    
    if (!user) {
      console.log("User not found:", username);
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid username or password'
      });
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      console.log("Invalid password for user:", username);
      return res.render('auth/login', { 
        title: 'Login', 
        error: 'Invalid username or password'
      });
    }
    
    // Log successful login
    console.log("Login successful for user:", username);
    
    // Generate tokens
    const tokens = generateTokens(user._id);
    console.log("Generated tokens for user:", user._id);
    
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
      username, 
      email, 
      password, 
      confirmPassword,
      userType,
      organization
    } = req.body;
    
    console.log("Signup attempt for:", username, email);
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.render('auth/signup', { 
        title: 'Sign Up', 
        error: 'Passwords do not match'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }]
    });
    
    if (existingUser) {
      console.log("User already exists:", existingUser.username);
      return res.render('auth/signup', { 
        title: 'Sign Up', 
        error: 'Username or email already exists'
      });
    }
    
    // Create new user
    console.log("Creating new user...");
    const user = new User({
      username,
      email,
      password,
      userType,
      organization
    });
    
    await user.save();
    console.log("User created successfully:", user._id);
    
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