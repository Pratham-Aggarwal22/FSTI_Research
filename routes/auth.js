// routes/auth.js
import express from 'express';
import User from '../models/User.js';
import { generateTokens, verifyToken, setAuthCookies, clearAuthCookies } from '../utils/jwt.js';

const router = express.Router();

// Ensure auth pages are never cached (so back button re-requests and can redirect)
const setNoStore = (res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
};

const escapeRegExp = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const sanitizeFormData = (body = {}) => {
  const { password, confirmPassword, ...rest } = body;
  return {
    ...rest,
    newsletter: Boolean(body.newsletter)
  };
};

const supportedUserTypes = ['student', 'professional', 'researcher', 'administrator', 'other'];

// Render login page
router.get('/login', (req, res) => {
  setNoStore(res);

  const accessToken = req.cookies.access_token;
  const decoded = accessToken ? verifyToken(accessToken) : null;

  // If already authenticated, send the user to the homepage instead of showing login
  if (decoded && decoded.type === 'access') {
    return res.redirect('/');
  }

  res.render('auth/login', { title: 'Login', error: null });
});

// Render signup page
router.get('/signup', (req, res) => {
  setNoStore(res);

  const accessToken = req.cookies.access_token;
  const decoded = accessToken ? verifyToken(accessToken) : null;

  // If already authenticated, send the user to the homepage instead of showing signup
  if (decoded && decoded.type === 'access') {
    return res.redirect('/');
  }

  res.render('auth/signup', { title: 'Sign Up', error: null, formData: {} });
});

// Real-time username/email availability check
router.get('/check-availability', async (req, res) => {
  try {
    const { field, value } = req.query;
    const normalizedField = field?.toLowerCase();
    const trimmedValue = value?.trim();

    if (!['username', 'email'].includes(normalizedField) || !trimmedValue || trimmedValue.length > 150) {
      return res.status(400).json({ error: 'Invalid field or value' });
    }

    const query = normalizedField === 'username'
      ? { username: new RegExp(`^${escapeRegExp(trimmedValue)}$`, 'i') }
      : { email: new RegExp(`^${escapeRegExp(trimmedValue)}$`, 'i') };

    const exists = await User.exists(query);
    res.json({
      field: normalizedField,
      value: trimmedValue,
      available: !exists
    });
  } catch (error) {
    console.error('Availability check error:', error);
    res.status(500).json({ error: 'Unable to check availability right now' });
  }
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
  const safeFormData = sanitizeFormData(req.body);
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
      jobTitle,
      newsletter
    } = req.body;

    const trimmedFirstName = firstName?.trim();
    const trimmedLastName = lastName?.trim();
    const normalizedCountry = country?.trim();
    const normalizedUsername = username?.trim();
    const normalizedEmail = email?.toLowerCase();
    const trimmedOrganization = organization?.trim();
    const trimmedPhone = phone?.trim();
    const trimmedJobTitle = jobTitle?.trim();
    const trimmedResearchInterest = researchInterest?.trim();
    const normalizedUserType = supportedUserTypes.includes((userType || '').toLowerCase())
      ? userType.toLowerCase()
      : 'other';

    safeFormData.firstName = trimmedFirstName;
    safeFormData.lastName = trimmedLastName;
    safeFormData.username = normalizedUsername;
    safeFormData.email = normalizedEmail;
    safeFormData.phone = trimmedPhone;
    safeFormData.organization = trimmedOrganization;
    safeFormData.country = normalizedCountry;
    safeFormData.userType = normalizedUserType;
    safeFormData.researchInterest = trimmedResearchInterest;
    safeFormData.jobTitle = trimmedJobTitle;
    
    // Validate password match
    if (password !== confirmPassword) {
      return res.render('auth/signup', { 
        title: 'Sign Up', 
        error: 'Passwords do not match',
        formData: safeFormData
      });
    }

    if (!normalizedUsername) {
      return res.render('auth/signup', {
        title: 'Sign Up',
        error: 'Username is required.',
        formData: safeFormData
      });
    }

    if (!normalizedEmail) {
      return res.render('auth/signup', {
        title: 'Sign Up',
        error: 'Email address is required.',
        formData: safeFormData
      });
    }
    
    // Check if user already exists (case-insensitive for username)
    const existingUser = await User.findOne({ 
      $or: [
        { username: new RegExp(`^${escapeRegExp(normalizedUsername)}$`, 'i') }, 
        { email: new RegExp(`^${escapeRegExp(normalizedEmail)}$`, 'i') }
      ]
    });
    
    if (existingUser) {
      return res.render('auth/signup', { 
        title: 'Sign Up', 
        error: 'Username or email already exists',
        formData: safeFormData
      });
    }
    
    // Create new user with all fields
    const user = new User({
      firstName: trimmedFirstName,
      lastName: trimmedLastName,
      username: normalizedUsername,
      email: normalizedEmail,
      password,
      phone: trimmedPhone,
      organization: trimmedOrganization,
      country: normalizedCountry,
      userType: normalizedUserType,
      researchInterest: trimmedResearchInterest,
      jobTitle: trimmedJobTitle,
      newsletterOptIn: Boolean(newsletter)
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
      error: 'An error occurred during signup: ' + error.message,
      formData: safeFormData
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