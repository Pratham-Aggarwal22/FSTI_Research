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

// Import routes
import authRoutes from './routes/auth.js';
import comparisonRoutes from './routes/comparison.js';

// Import middleware
import { isGuestRoute } from './middleware/auth.js';


// In server.js, near the top after imports
import { verifyToken } from './utils/jwt.js';

// Load environment variables from .env file
dotenv.config();

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection configuration from environment variables
const uri = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'StateWiseComputation';
const client = new MongoClient(uri);

// Connect to MongoDB for Mongoose (for authentication)
mongoose.connect(process.env.MONGODB_URI || uri, {
  dbName: 'Login_authentication', // Database for user authentication
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB for authentication');
}).catch(err => {
  console.error('Error connecting to MongoDB for authentication:', err);
});

async function connectToMongoDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    return client.db(dbName);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
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
    const { stateName, countyName } = req.params;
    const db = client.db(stateName);
    const averagesCollection = db.collection('Averages');
    const averagesData = await averagesCollection.findOne({ title: countyName });
    
    // Fetch frequency distributions from collections whose names start with "Frequency-"
    const collections = await db.listCollections().toArray();
    const frequencyCollections = collections
      .map(col => col.name)
      .filter(name => name.startsWith("Frequency-"));
    
    const frequencies = {};
    for (const collectionName of frequencyCollections) {
      const coll = db.collection(collectionName);
      const freqData = await coll.findOne({ title: countyName });
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
    const { stateName } = req.params;
    const db = client.db(stateName);
    const collection = db.collection('Averages'); // Changed from 'AverageValues' to 'Averages'
    const data = await collection.find({}).toArray();
    res.json(data);
  } catch (error) {
    console.error('Error fetching county average values:', error);
    res.status(500).json({ error: error.message });
  }
});

// Updated API endpoint for equity county average values
app.get('/api/equityCountyAverageValues/:category/:state', async (req, res) => {
  try {
    const { category, state } = req.params;
    console.log(`Fetching equity data for category: ${category}, state: ${state}`);
    
    const dbNameEquity = category.replace(/\s+/g, '_'); // e.g., "Employment Data" -> "Employment_Data"
    const dbEquity = client.db(dbNameEquity);
    
    // For Population_Data, try a different collection name if "County Level" doesn't exist
    let collectionName = "County Level";
    
    // Check if "County Level" collection exists
    const collections = await dbEquity.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log(`Available collections in ${dbNameEquity}:`, collectionNames);
    
    if (!collectionNames.includes("County Level")) {
      // Try fallback collection names
      if (collectionNames.includes("Counties")) {
        collectionName = "Counties";
      } else if (collectionNames.includes("county_data")) {
        collectionName = "county_data";
      }
      console.log(`"County Level" not found, using "${collectionName}" instead`);
    }
    
    const collection = dbEquity.collection(collectionName);
    
    // Filter by state field (with flexibility)
    let query = { state: state };
    
    // For Population_Data, try a more flexible query if needed
    if (category === "Population_Data") {
      const statePattern = new RegExp(state, 'i'); // Case-insensitive match
      query = { 
        $or: [
          { state: state },
          { state: statePattern },
          { State: state },
          { State: statePattern }
        ]
      };
    }
    
    const data = await collection.find(query).toArray();
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