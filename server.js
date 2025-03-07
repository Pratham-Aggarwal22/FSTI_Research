// server.js
import express from 'express';
import { MongoClient } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB connection configuration from environment variables
const uri = process.env.MONGODB_URI; // e.g. mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility
const dbName = process.env.DB_NAME || 'StateWiseComputation';
const client = new MongoClient(uri);

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

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route for main page
app.get('/', (req, res) => {
  res.render('index');
});

// API endpoint for state-level average values (used for state data)
app.get('/api/averageValues', async (req, res) => {
  try {
    const db = client.db(dbName);
    const collection = db.collection('AverageValues');
    const data = await collection.find({}).toArray();
    res.json(data);
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

// NEW API endpoint for full county data from a state-specific database.
// Assumes that each state has its own database (named with first letter uppercase, rest lower,
// with spaces replaced by underscores, e.g. "New_York") and that the county data is stored in the "Averages" collection,
// with frequency data stored in collections whose names start with "Frequency-".
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
  console.log('MongoDB connection closed');
  process.exit(0);
});
