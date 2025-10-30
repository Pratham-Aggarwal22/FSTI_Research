// server.js
import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
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
import { OpenAIRagService } from './services/openAIRagService.js';


// In server.js, near the top after imports
import { verifyToken } from './utils/jwt.js';

function getCorrectDatabaseName(stateName) {
  const corrections = {
    "Alabama": "Albama",
    "Michigan": "MIchigan"
    // Pennsylvania uses correct spelling
  };
  return corrections[stateName] || stateName;
}

// Load environment variables from .env file
dotenv.config();

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection configuration from environment variables
const uri = process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitaccessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAccessibility";
const dbName = process.env.DB_NAME || 'StateWiseComputation';
const client = new MongoClient(uri);

// Connect to MongoDB for Mongoose (for authentication)
mongoose.connect(process.env.MONGODB_URI || uri, {
  dbName: 'Login_authentication' // Database for user authentication
}).then(() => {
  console.log('✅ Connected to MongoDB 1 for authentication');
}).catch(err => {
  console.error('❌ Error connecting to MongoDB 1 for authentication:', err);
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB 1 for data');
    return client.db(dbName);
  } catch (error) {
    console.error('❌ Error connecting to MongoDB 1:', error);
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
  res.render('index', { 
    title: 'TransitViz',
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
    
    const result = {};
    for (const collectionName of distributionCollections) {
      const coll = db.collection(collectionName);
      const stateData = await coll.findOne({ title: stateName });
      if (stateData) {
        result[collectionName] = stateData;
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
  console.log("County full data endpoint hit:", req.params);
  try {
    let { stateName, countyName } = req.params;
    
    // Decode URI components to get original special characters back
    stateName = decodeURIComponent(stateName);
    countyName = decodeURIComponent(countyName);
    
    console.log(`Request for state: ${stateName}, county: ${countyName}`);
    
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
    
    console.log(`Using database: ${dbName}`);
    
    let db, averagesCollection;
    
    try {
      db = client.db(dbName);
      averagesCollection = db.collection('Averages');
    } catch (dbError) {
      // For Pennsylvania, try exact database name
      if (stateName.toLowerCase().includes('pennsylvania')) {
        console.log('Trying exact "Pennsylvania" database...');
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
    
    console.log(`Trying county name variations:`, countyVariations);
    
    // Try each variation until we find a match
    for (const variation of countyVariations) {
      averagesData = await averagesCollection.findOne({ title: variation });
      if (averagesData) {
        console.log(`Found county data with variation: "${variation}"`);
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
      console.log(`Trying flexible regex: ${flexiblePattern}`);
      
      averagesData = await averagesCollection.findOne({ title: regex });
      if (averagesData) {
        console.log(`Found county data with flexible regex search`);
      }
    }
    
    if (!averagesData) {
      console.log(`No county data found for any variation of: "${countyName}"`);
      // List available counties for debugging
      const allCounties = await averagesCollection.find({}, { projection: { title: 1 } }).toArray();
      console.log('Available counties (first 10):', allCounties.slice(0, 10).map(c => `"${c.title}"`));
      console.log(`Total counties available: ${allCounties.length}`);
      
      // Look for counties that might match with special characters
      const possibleMatches = allCounties.filter(county => {
        if (!county.title) return false;
        const normalized1 = county.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const normalized2 = countyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return normalized1.includes(normalized2) || normalized2.includes(normalized1);
      });
      
      if (possibleMatches.length > 0) {
        console.log('Possible matches found:', possibleMatches.map(c => `"${c.title}"`));
      }
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
    console.error(`Error fetching full county data for ${req.params.countyName}:`, error);
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
    
    console.log(`Original state name from request: ${stateName}`);
    
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
    
    console.log(`Using database name: ${dbName}`);
    
    try {
      const db = client.db(dbName);
      const collection = db.collection('Averages');
      const data = await collection.find({}).toArray();
      
      console.log(`Found ${data.length} counties in database: ${dbName}`);
      
      // DON'T sanitize county names - keep them exactly as they are in the database
      // This preserves "Doña Ana" and "O'Brien" as they are stored
      
      // Format all numbers in the response
      const formattedData = formatNumberInObject(data);
      res.json(formattedData);
    } catch (dbError) {
      console.error(`Database access error for ${dbName}:`, dbError.message);
      
      // For Pennsylvania, try without formatting (in case database name is exactly "Pennsylvania")
      if (stateName.toLowerCase().includes('pennsylvania')) {
        console.log('Trying exact database name "Pennsylvania" for Pennsylvania...');
        try {
          const db = client.db('Pennsylvania');
          const collection = db.collection('Averages');
          const data = await collection.find({}).toArray();
          
          console.log(`Found ${data.length} counties in Pennsylvania database`);
          
          const formattedData = formatNumberInObject(data);
          res.json(formattedData);
          return;
        } catch (fallbackError) {
          console.error('Fallback Pennsylvania database access failed:', fallbackError.message);
        }
      }
      
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching county average values:', error);
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
    
    console.log(`Fetching equity data for category: ${category}, state: ${state}`);
    
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
    
    console.log(`Using state name for equity query: ${formattedStateName}`);
    
    const dbNameEquity = category.replace(/\s+/g, '_');
    const dbEquity = client.db(dbNameEquity);
    
    let collectionName = "County Level";
    
    const collections = await dbEquity.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`Available collections in ${dbNameEquity}:`, collectionNames);
    
    if (!collectionNames.includes("County Level")) {
      if (collectionNames.includes("Counties")) {
        collectionName = "Counties";
      } else if (collectionNames.includes("county_data")) {
        collectionName = "county_data";
      }
      console.log(`"County Level" not found, using "${collectionName}" instead`);
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
        console.log(`Found ${data.length} records with query:`, query);
        break;
      }
    }
    
    console.log(`Found ${data.length} records for ${category} in ${state}`);
    
    res.json(data);
  } catch (error) {
    console.error(`Error fetching equity county average values for ${req.params.category} in ${req.params.state}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Start the server after connecting to MongoDB
async function startServer() {
  await connectToMongoDB();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

process.on('SIGINT', async () => {
  await client.close();
  await mongoose.connection.close();
  
  // Cleanup RAG service
  if (ragService) {
    await ragService.cleanup();
  }
  
  console.log('MongoDB connections closed');
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

// Initialize OpenAI RAG Service (singleton instance)
let ragService = null;

async function getRagService() {
  if (!ragService) {
    console.log('🔄 Creating new OpenAI RAG service instance...');
    ragService = new OpenAIRagService();
    await ragService.initialize();
    console.log('✅ OpenAI RAG service initialized');
  }
  return ragService;
}

// Chatbot endpoint with RAG (requires authentication)
app.post('/api/chatbot', authenticate, async (req, res) => {
  console.log('=== CHATBOT ENDPOINT CALLED (OpenAI RAG) ===');
  console.log('Request body:', req.body);
  console.log('Authenticated user:', req.user.username);
  
  try {
    const { message, context } = req.body;
    
    console.log('Extracted message:', message);
    console.log('Extracted context:', context);
    
    if (!message || !message.trim()) {
      console.log('No message provided, returning 400');
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a message' 
      });
    }

    console.log('Getting OpenAI RAG service...');
    const chatbot = await getRagService();
    
    console.log('Calling chatbot.generateResponse...');
    const response = await chatbot.generateResponse(message, context, req.user.username);
    console.log('Chatbot response received:', response);
    
    console.log('Sending response to client');
    res.json(response);
  } catch (error) {
    console.error('=== CHATBOT ENDPOINT ERROR ===');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      message: 'Sorry, I encountered an error. Please try again.',
      error: error.message 
    });
  }
});