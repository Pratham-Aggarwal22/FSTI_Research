// server.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables FIRST before anything else
const envResult = dotenv.config({ path: path.join(__dirname, '.env') });

// Debug: Check if .env was loaded
if (envResult.error) {
  console.warn('⚠️  .env file not found or error loading it:', envResult.error.message);
  console.warn('⚠️  Make sure .env file exists in the project root directory');
}

import express from 'express';
import { MongoClient } from 'mongodb';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

// Import routes
import authRoutes from './routes/auth.js';
import comparisonRoutes from './routes/comparison.js';

// Import middleware
import { isGuestRoute, authenticate } from './middleware/auth.js';

// Import chatbot service
import ChatbotService from './services/chatbot/index.js';

// Import JWT utilities
import { verifyToken } from './utils/jwt.js';

const FREQUENCY_COLLECTION_DISPLAY_MAP = {
  'Frequency- In-Vehicle Duration in minutes': 'Frequency- Travel Time by Transit in Minutes',
  'Frequency- Transit:Driving': 'Frequency- Transit to Car Travel Time Ratio',
  'Frequency- Transfers': 'Frequency- Number of Transfers',
  'Frequency- Initial Walk Duration in minutes': 'Frequency- Initial Walk Time in Minutes',
  'Frequency- Initial Walk Distance in miles': 'Frequency- Initial Walk Distance in Miles',
  'Frequency- Initial Wait Time in minutes': 'Frequency- Initial Wait Time in Minutes',
  'Frequency- Out-of-Vehicle Duration in minutes': 'Frequency- Out-of-Vehicle Travel Time in Minutes',
  'Frequency- In-Vehicle Duration in minutes': 'Frequency- In-Vehicle Travel Time in Minutes',
  'Frequency- Total Walk Duration in minutes': 'Frequency- Total Walk Time in Minutes',
  'Frequency- Total Walk Distance in miles': 'Frequency- Total Walk Distance in Miles',
  'Frequency- In-Vehicle:Out-of-Vehicle': 'Frequency- In-Vehicle to Out-of-Vehicle Time Ratio',
  'Frequency- Total Wait Duration in minutes': 'Frequency- Total Wait Time in Minutes'
};

function getCorrectDatabaseName(stateName) {
  const corrections = {
    "Alabama": "Albama",
    "Michigan": "MIchigan"
    // Pennsylvania uses correct spelling
  };
  return corrections[stateName] || stateName;
}

function getStateTitleVariants(stateName) {
  const variants = new Set();
  const corrected = getCorrectDatabaseName(stateName);
  [stateName, corrected].forEach(name => {
    if (!name) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    variants.add(trimmed);
    variants.add(trimmed.toUpperCase());
    variants.add(trimmed.toLowerCase());
    variants.add(trimmed.replace(/_/g, ' '));
    variants.add(trimmed.replace(/\s+/g, '_'));
    variants.add(trimmed.replace(/\s+/g, ''));
  });
  return Array.from(variants).filter(Boolean);
}

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection configuration from environment variables
const uri = process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitaccessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAccessibility";
const dbName = 'StateWiseComputation2';
const client = new MongoClient(uri);

// Connect to MongoDB for Mongoose (for authentication)
mongoose.connect(process.env.MONGODB_URI || uri, {
  dbName: 'Login_authentication' // Database for user authentication
}).then(() => {
  // Connected to MongoDB for authentication
}).catch(err => {
  console.error('❌ MongoDB authentication error:', err);
});

async function connectToMongoDB() {
  try {
    await client.connect();
    return client.db(dbName);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Add this function to your server.js file
function formatNumberInObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => formatNumberInObject(item));
  }
  
  // Handle objects
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === '_id' || key === 'title') {
      result[key] = value;
    } else if (typeof value === 'number') {
      result[key] = parseFloat(value.toFixed(2));
    } else if (typeof value === 'object' && value !== null) {
      result[key] = formatNumberInObject(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'Public')));

// Serve info files
app.use('/info', express.static(path.join(__dirname, 'Public/info')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'Views'));

// Apply authentication middleware selectively
app.use(isGuestRoute);

// Add this to your server.js before defining routes
app.use((req, res, next) => {
  // Make isAuthenticated available to all templates
  res.locals.isAuthenticated = req.cookies.access_token ? true : false;
  next();
});

// Routes
app.use('/auth', authRoutes);
app.use('/comparison', comparisonRoutes);

// Route for main page
app.get('/', (req, res) => {
  // Prevent caching so back button re-renders with current auth state
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  res.render('index', { 
    title: 'TransitHub',
    user: req.user || null
  });
});

// API endpoint for state-level average values (used for state data)
// Use this in all your API endpoints, for example:
app.get('/api/averageValues', async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection('AverageValues');
    const data = await collection.find({}).toArray();
    
    // Format all numbers in the response
    const formattedData = formatNumberInObject(data);
    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching average values:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for state-level frequency distributions
app.get('/api/frequencyDistributions/:stateName', async (req, res) => {
  try {
    const { stateName } = req.params;
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    const distributionCollections = collections
      .map(col => col.name)
      .filter(name => name !== 'AverageValues' && !name.startsWith('system.'));
    
    const titleVariants = getStateTitleVariants(stateName);
    const possibleFields = ['title', 'Title', 'state', 'State', 'name', 'Name'];
    const result = {};
    for (const collectionName of distributionCollections) {
      const coll = db.collection(collectionName);
      let stateData = null;
      let matchedField = 'title';
      
      for (const variant of titleVariants) {
        stateData = await coll.findOne({ title: variant });
        if (stateData) break;
      }
      
      // Try alternate field names if title search failed
      if (!stateData) {
        for (const field of possibleFields) {
          for (const variant of titleVariants) {
            stateData = await coll.findOne({ [field]: variant });
            if (stateData) {
              matchedField = field;
              break;
            }
          }
          if (stateData) break;
        }
      }
      
      if (!stateData) {
        const pattern = stateName
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\s+/g, '\\s+');
        const regex = new RegExp(pattern, 'i');
        for (const field of possibleFields) {
          stateData = await coll.findOne({ [field]: regex });
          if (stateData) {
            matchedField = field;
            break;
          }
        }
      }
      
      if (stateData) {
        if (!stateData.title && stateData[matchedField]) {
          stateData.title = stateData[matchedField];
        }
        const displayName = FREQUENCY_COLLECTION_DISPLAY_MAP[collectionName] || collectionName;
        result[displayName] = stateData;
      }
    }
    res.json(result);
  } catch (error) {
    console.error(`Error fetching frequency distributions for ${req.params.stateName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for full county data from a state-specific database.
// Each state has its own database and the county data is stored in the "Averages" collection.
app.get('/api/countyFullData/:stateName/:countyName', async (req, res) => {
  try {
    let { stateName, countyName } = req.params;
    
    // Decode URI components to get original special characters back
    stateName = decodeURIComponent(stateName);
    countyName = decodeURIComponent(countyName);
    
    // Check if this is already a formatted database name
    let dbName;
    if (stateName.includes('_')) {
      // Already formatted, use as-is
      dbName = stateName;
    } else {
      // Apply corrections then format
      const correctedStateName = getCorrectDatabaseName(stateName);
      dbName = correctedStateName.replace(/\s+/g, '_');
    }
    
    let db, averagesCollection;
    
    try {
      db = client.db(dbName);
      averagesCollection = db.collection('Averages');
    } catch (dbError) {
      // For Pennsylvania, try exact database name
      if (stateName.toLowerCase().includes('pennsylvania')) {
        db = client.db('Pennsylvania');
        averagesCollection = db.collection('Averages');
      } else {
        throw dbError;
      }
    }
    
    // Try multiple variations of the county name, preserving special characters
    const countyVariations = [
      countyName, // Original with special characters (this should work for "Doña Ana", "O'Brien")
      countyName.toUpperCase(),
      countyName.toLowerCase(),
      // Also try some common variations in case the data is inconsistent
      countyName.replace(/'/g, "'"), // In case smart quotes were converted
      countyName.replace(/'/g, "'"),
      countyName.replace(/ñ/g, 'n'), // In case diacritics were removed in DB
    ];
    
    let averagesData = null;
    
    // Try each variation until we find a match
    for (const variation of countyVariations) {
      averagesData = await averagesCollection.findOne({ title: variation });
      if (averagesData) {
        break;
      }
    }
    
    // If still not found, try regex search (case-insensitive) with special character handling
    if (!averagesData) {
      // Create a flexible regex that handles special characters
      const flexiblePattern = countyName
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
        .replace(/'/g, "[''']") // Match any type of apostrophe
        .replace(/ñ/g, '[nñ]') // Match both n and ñ
        .replace(/á/g, '[aá]') // Match both a and á
        .replace(/é/g, '[eé]') // Match both e and é
        .replace(/í/g, '[ií]') // Match both i and í
        .replace(/ó/g, '[oó]') // Match both o and ó
        .replace(/ú/g, '[uú]'); // Match both u and ú
      
      const regex = new RegExp(flexiblePattern, 'i');
      
      averagesData = await averagesCollection.findOne({ title: regex });
    }
    
    // Fetch frequency distributions
    const collections = await db.listCollections().toArray();
    const frequencyCollections = collections
      .map(col => col.name)
      .filter(name => name.startsWith("Frequency-"));
    
    const frequencies = {};
    for (const collectionName of frequencyCollections) {
      const coll = db.collection(collectionName);
      
      // Try the same variations for frequency data
      let freqData = null;
      for (const variation of countyVariations) {
        freqData = await coll.findOne({ title: variation });
        if (freqData) break;
      }
      
      if (!freqData) {
        const flexiblePattern = countyName
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/'/g, "[''']")
          .replace(/ñ/g, '[nñ]')
          .replace(/á/g, '[aá]')
          .replace(/é/g, '[eé]')
          .replace(/í/g, '[ií]')
          .replace(/ó/g, '[oó]')
          .replace(/ú/g, '[uú]');
        
        const regex = new RegExp(flexiblePattern, 'i');
        freqData = await coll.findOne({ title: regex });
      }
      
      if (freqData) {
        frequencies[collectionName] = freqData;
      }
    }
    
    res.json({
      averages: averagesData,
      frequencies: frequencies
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for aggregated county-level average values for a state.
// (Updated to use the "Averages" collection, since each state's county data is stored there.)
app.get('/api/countyAverageValues/:stateName', async (req, res) => {
  try {
    let { stateName } = req.params;
    
    // Decode URI component
    stateName = decodeURIComponent(stateName);
    
    // Check if this is already a corrected database name format
    let dbName;
    if (stateName.includes('_')) {
      // Already formatted, use as-is
      dbName = stateName;
    } else {
      // Apply corrections then format
      const correctedStateName = getCorrectDatabaseName(stateName);
      dbName = correctedStateName.replace(/\s+/g, '_');
    }
    
    try {
      const db = client.db(dbName);
      const collection = db.collection('Averages');
      const data = await collection.find({}).toArray();
      
      // DON'T sanitize county names - keep them exactly as they are in the database
      // This preserves "Doña Ana" and "O'Brien" as they are stored
      
      // Format all numbers in the response
      const formattedData = formatNumberInObject(data);
      res.json(formattedData);
    } catch (dbError) {
      // For Pennsylvania, try without formatting (in case database name is exactly "Pennsylvania")
      if (stateName.toLowerCase().includes('pennsylvania')) {
        try {
          const db = client.db('Pennsylvania');
          const collection = db.collection('Averages');
          const data = await collection.find({}).toArray();
          
          const formattedData = formatNumberInObject(data);
          res.json(formattedData);
          return;
        } catch (fallbackError) {
          // Fallback failed
        }
      }
      
      throw dbError;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Updated API endpoint for equity county average values
app.get('/api/equityCountyAverageValues/:category/:state', async (req, res) => {
  try {
    let { category, state } = req.params;
    
    // Decode URI components
    category = decodeURIComponent(category);
    state = decodeURIComponent(state);
    
    // Check if state is already formatted (contains underscores)
    let formattedStateName;
    if (state.includes('_')) {
      // Already formatted, use as-is
      formattedStateName = state;
    } else {
      // Apply corrections then format
      const correctedStateName = getCorrectDatabaseName(state);
      formattedStateName = correctedStateName.replace(/\s+/g, '_');
    }
    
    const dbNameEquity = category.replace(/\s+/g, '_');
    const dbEquity = client.db(dbNameEquity);
    
    let collectionName = "County Level";
    
    const collections = await dbEquity.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    if (!collectionNames.includes("County Level")) {
      if (collectionNames.includes("Counties")) {
        collectionName = "Counties";
      } else if (collectionNames.includes("county_data")) {
        collectionName = "county_data";
      }
    }
    
    const collection = dbEquity.collection(collectionName);
    
    // Try multiple variations of the state name for the query
    const stateQueries = [
      { state: formattedStateName },
      { State: formattedStateName },
      { state: formattedStateName.replace(/_/g, ' ') },
      { State: formattedStateName.replace(/_/g, ' ') },
      { state: new RegExp(formattedStateName.replace(/_/g, '\\s*'), 'i') },
      { State: new RegExp(formattedStateName.replace(/_/g, '\\s*'), 'i') }
    ];
    
    let data = [];
    
    for (const query of stateQueries) {
      data = await collection.find(query).toArray();
      if (data.length > 0) {
        break;
      }
    }
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint for equity state average values (used for national cluster analysis)
app.get('/api/equityStateAverageValues/:category', async (req, res) => {
  try {
    let { category } = req.params;
    category = decodeURIComponent(category);

    // Support both friendly labels and raw database names
    const normalizedCategory = category.replace(/\s+/g, '_');
    const dbEquity = client.db(normalizedCategory);

    const collections = await dbEquity.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    const preferredNames = ['State Level', 'State_Level', 'state_level', 'StateLevel', 'states', 'State'];
    let collectionName = preferredNames.find(name => collectionNames.includes(name));
    if (!collectionName) {
      collectionName = collectionNames[0];
    }

    if (!collectionName) {
      return res.status(404).json({ error: `No collections found for ${category}` });
    }

    const collection = dbEquity.collection(collectionName);
    const data = await collection.find({}).toArray();
    const formattedData = formatNumberInObject(data);
    res.json(formattedData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the server after connecting to MongoDB
async function startServer() {
  await connectToMongoDB();
  app.listen(PORT, () => {
    // Server started
  });
}

startServer().catch(console.error);

process.on('SIGINT', async () => {
  await client.close();
  await mongoose.connection.close();
  
  if (chatbotServiceInstance && typeof chatbotServiceInstance.cleanup === 'function') {
    await chatbotServiceInstance.cleanup();
  }
  
  process.exit(0);
});
// Add this to server.js
app.get('/auth-debug', (req, res) => {
  res.json({
    cookies: req.cookies,
    user: req.user || null,
    isAuthenticated: !!req.cookies.access_token
  });
});

let chatbotServiceInstance = null;

async function getChatbotService() {
  if (!chatbotServiceInstance) {
    chatbotServiceInstance = new ChatbotService({ mongoClient: client });
  }
  await chatbotServiceInstance.initialize();
  return chatbotServiceInstance;
}

// Chatbot endpoint (requires authentication)
app.post('/api/chatbot', authenticate, async (req, res) => {
  const { message, context } = req.body || {};

  try {
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        narrative: 'Please provide a question for the chatbot.'
      });
    }

    const chatbot = await getChatbotService();
    const response = await chatbot.handleChat({
      user: req.user,
      message,
      context
    });

    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      narrative: 'Sorry, I encountered an error. Please try again.',
      error: error.message
    });
  }
});