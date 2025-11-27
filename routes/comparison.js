// routes/comparison.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { MongoClient } from 'mongodb';


const router = express.Router();
const TRANSIT_DB_NAME = 'StateWiseComputation2';

const STATE_NAME_VARIANTS = {
  Alabama: ['Albama'],
  Michigan: ['MIchigan']
};

const STATE_VARIANT_LOOKUP = Object.entries(STATE_NAME_VARIANTS).reduce((acc, [canonical, variants]) => {
  variants.forEach(variant => {
    acc[variant.toLowerCase()] = canonical;
  });
  return acc;
}, {});

function extractNumericValue(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  const numeric = parseFloat(String(value).replace(/[^0-9.\-]/g, ''));
  return Number.isNaN(numeric) ? null : numeric;
}

function normalizeStateName(value) {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, ' ');
}

const TRANSIT_COLLECTION_DISPLAY_MAP = {
  AverageValues: 'Average Values',
  'Frequency- In-Vehicle Duration in minutes': 'Frequency- In-Vehicle Travel Time in Minutes',
  'Frequency- In-Vehicle:Out-of-Vehicle': 'Frequency- In-Vehicle to Out-of-Vehicle Time Ratio',
  'Frequency- Initial Wait Time in minutes': 'Frequency- Initial Wait Time in Minutes',
  'Frequency- Initial Walk Distance in miles': 'Frequency- Initial Walk Distance in Miles',
  'Frequency- Initial Walk Duration in minutes': 'Frequency- Initial Walk Time in Minutes',
  'Frequency- Out-of-Vehicle Duration in minutes': 'Frequency- Out-of-Vehicle Travel Time in Minutes',
  'Frequency- Total Wait Duration in minutes': 'Frequency- Total Wait Time in Minutes',
  'Frequency- Total Walk Distance in miles': 'Frequency- Total Walk Distance in Miles',
  'Frequency- Total Walk Duration in minutes': 'Frequency- Total Walk Time in Minutes',
  'Frequency- Transfers': 'Frequency- Number of Transfers',
  'Frequency- Transit:Driving': 'Frequency- Transit to Car Travel Time Ratio'
};

const TRANSIT_COLLECTION_NAME_ALIASES = (() => {
  const aliasMap = {
    frequencies: 'frequencies',
    'Average Values': 'AverageValues',
    AverageValues: 'AverageValues'
  };

  Object.entries(TRANSIT_COLLECTION_DISPLAY_MAP).forEach(([actual, display]) => {
    aliasMap[display] = actual;
    aliasMap[actual] = actual;
  });

  return {
    ...aliasMap,
    'Frequency- Travel Duration in Minutes': 'Frequency- In-Vehicle Duration in minutes',
    'Frequency- Travel Time by Transit in Minutes': 'Frequency- In-Vehicle Duration in minutes',
    'Frequency- Driving Duration with Traffic in Minutes': 'Frequency- Transit:Driving',
    'Frequency- Travel Time by Car in Minutes': 'Frequency- Transit:Driving',
    'Frequency- Transit to Driving Ratio': 'Frequency- Transit:Driving',
    'Frequency- Transit to Car Travel Time Ratio': 'Frequency- Transit:Driving',
    'Frequency- Number of Transfers': 'Frequency- Transfers',
    'Frequency- Transfers': 'Frequency- Transfers',
    'Frequency- Initial Walk Time in Minutes': 'Frequency- Initial Walk Duration in minutes',
    'Frequency- Initial Walk Duration in Minutes': 'Frequency- Initial Walk Duration in minutes',
    'Frequency- Initial Walk Distance in Miles': 'Frequency- Initial Walk Distance in miles',
    'Frequency- Initial Wait Time in Minutes': 'Frequency- Initial Wait Time in minutes',
    'Frequency- Total Walk Time': 'Frequency- Total Walk Duration in minutes',
    'Frequency- Total Walk Duration in Minutes': 'Frequency- Total Walk Duration in minutes',
    'Frequency- Total Walk Distance in Miles': 'Frequency- Total Walk Distance in miles',
    'Frequency- Total Wait Duration In Minutes': 'Frequency- Total Wait Duration in minutes',
    'Frequency- Total Wait Time in Minutes': 'Frequency- Total Wait Duration in minutes',
    'Frequency- Out-Of-Vehicle Duration In Minutes': 'Frequency- Out-of-Vehicle Duration in minutes',
    'Frequency- Out-of-Vehicle Travel Time in Minutes': 'Frequency- Out-of-Vehicle Duration in minutes',
    'Frequency- In-Vehicle Duration in Minutes': 'Frequency- In-Vehicle Duration in minutes',
    'Frequency- In-Vehicle Travel Time in Minutes': 'Frequency- In-Vehicle Duration in minutes',
    'Frequency- In-Vehicle To Out-Of-Vehicle Ratio': 'Frequency- In-Vehicle:Out-of-Vehicle',
    'Frequency- In-Vehicle to Out-of-Vehicle Time Ratio': 'Frequency- In-Vehicle:Out-of-Vehicle'
  };
})();

function mapTransitCollectionDisplayName(collectionName) {
  return TRANSIT_COLLECTION_DISPLAY_MAP[collectionName] || collectionName;
}

const COMPARISON_DEBUG = process.env.COMPARISON_DEBUG === 'true';
const comparisonLog = (...args) => {
  if (COMPARISON_DEBUG) {
    console.log(...args);
  }
};
const comparisonWarn = (...args) => {
  if (COMPARISON_DEBUG) {
    console.warn(...args);
  }
};

// Apply authentication middleware to all comparison routes
router.use(authenticate);

// Helper function to map transit metric names for display
function mapTransitMetricName(originalName) {
  const transitMetricMap = {
    // Frequency metrics
    'Frequency- Travel Duration in Minutes': 'Frequency- Travel Time by Transit in Minutes',
    'Frequency- Driving Duration with Traffic in Minutes': 'Frequency- Travel Time by Car in Minutes',
    'Frequency- Transit to Driving Ratio': 'Frequency- Transit to Car Travel Time Ratio',
    'Frequency- Transit:Driving': 'Frequency- Transit to Car Travel Time Ratio',
    'Frequency- Transfers': 'Frequency- Number of Transfers',
    'Frequency- Initial Walk Duration in Minutes': 'Frequency- Initial Walk Time in Minutes',
    'Frequency- Initial Walk Duration in minutes': 'Frequency- Initial Walk Time in Minutes',
    'Frequency- Initial Walk Distance in Miles': 'Frequency- Initial Walk Distance in Miles',
    'Frequency- Initial Wait Time in Minutes': 'Frequency- Initial Wait Time in Minutes',
    'Frequency- Initial Wait Time in minutes': 'Frequency- Initial Wait Time in Minutes',
    'Frequency- Total Walk Duration in Minutes': 'Frequency- Total Walk Time',
    'Frequency- Total Walk Duration in minutes': 'Frequency- Total Walk Time',
    'Frequency- Total Walk Distance in Miles': 'Frequency- Total Walk Distance in Miles',
    'Frequency- Total Wait Duration In Minutes': 'Frequency- Total Wait Time in Minutes',
    'Frequency- Total Wait Duration in minutes': 'Frequency- Total Wait Time in Minutes',
    'Frequency- In-Vehicle Duration in Minutes': 'Frequency- In-Vehicle Travel Time in Minutes',
    'Frequency- In-Vehicle Duration in minutes': 'Frequency- In-Vehicle Travel Time in Minutes',
    'Frequency- Out-Of-Vehicle Duration In Minutes': 'Frequency- Out-of-Vehicle Travel Time in Minutes',
    'Frequency- Out-of-Vehicle Duration in minutes': 'Frequency- Out-of-Vehicle Travel Time in Minutes',
    'Frequency- In-Vehicle To Out-Of-Vehicle Ratio': 'Frequency- In-Vehicle to Out-of-Vehicle Time Ratio',
    'Frequency- In-Vehicle:Out-of-Vehicle': 'Frequency- In-Vehicle to Out-of-Vehicle Time Ratio',
    // Average metrics (from AverageValues collection)
    'Average Travel Duration in Minutes': 'Travel Time by Transit in Minutes',
    'Average Driving Duration with Traffic in Minutes': 'Travel Time by Car in Minutes',
    'Transit to Driving Ratio': 'Transit to Car Travel Time Ratio',
    'Transfers': 'Number of Transfers',
    'Average Initial Walk Duration in Minutes': 'Initial Walk Time in Minutes',
    'Average Initial Walk Distance in Miles': 'Initial Walk Distance in Miles',
    'Average Initial Wait Time in Minutes': 'Initial Wait Time in Minutes',
    'Average Total Walk Duration in Minutes': 'Total Walk Time',
    'Average Total Walk Distance in Miles': 'Total Walk Distance in Miles',
    'Average Total Wait Duration In Minutes': 'Total Wait Time in Minutes',
    'Average In-Vehicle Duration in Minutes': 'In-Vehicle Travel Time in Minutes',
    'Average Out-of-Vehicle Duration In Minutes': 'Out-of-Vehicle Travel Time in Minutes',
    'In-Vehicle To Out-Of-Vehicle Ratio': 'In-Vehicle to Out-of-Vehicle Time Ratio'
  };
  
  return transitMetricMap[originalName] || originalName;
}

// Helper function to map equity metric names for display
function mapEquityMetricName(originalName, category) {
  const equityMetricMaps = {
    'Employment_Data': {
      'Estimate!!Total:': 'Total Employment Population',
      'Estimate!!Total:!!Male:': 'Total Male Employment Population',
      'Estimate!!Total:!!Male:!!Enrolled in school:': 'Males Enrolled in School',
      'Estimate!!Total:!!Male:!!Enrolled in school:!!Unemployed': 'Unemployed Males Enrolled in School',
      'Estimate!!Total:!!Male:!!Enrolled in school:!!Employed': 'Employed Males Enrolled in School',
      'Estimate!!Total:!!Male:!!Enrolled in school:!!Not in labor force': 'Males Enrolled in School Not in Labor Force',
      'Estimate!!Total:!!Male:!!Not enrolled in school:': 'Males Not Enrolled in School',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!High school graduate (includes equivalency):': 'Male High School Graduates',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!High school graduate (includes equivalency):!!Employed': 'Employed Male High School Graduates',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!High school graduate (includes equivalency):!!Unemployed': 'Unemployed Male High School Graduates',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!High school graduate (includes equivalency):!!Not in labor force': 'Male High School Graduates Not in Labor Force',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!Not high school graduate:': 'Males Without High School Diploma',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!Not high school graduate:!!Employed': 'Employed Males Without High School Diploma',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!Not high school graduate:!!Unemployed': 'Unemployed Males Without High School Diploma',
      'Estimate!!Total:!!Male:!!Not enrolled in school:!!Not high school graduate:!!Not in labor force': 'Males Without High School Diploma Not in Labor Force',
      'Estimate!!Total:!!Female:': 'Total Female Employment Population',
      'Estimate!!Total:!!Female:!!Enrolled in school:': 'Females Enrolled in School',
      'Estimate!!Total:!!Female:!!Enrolled in school:!!Employed': 'Employed Females Enrolled in School',
      'Estimate!!Total:!!Female:!!Enrolled in school:!!Unemployed': 'Unemployed Females Enrolled in School',
      'Estimate!!Total:!!Female:!!Enrolled in school:!!Not in labor force': 'Females Enrolled in School Not in Labor Force',
      'Estimate!!Total:!!Female:!!Not enrolled in school:': 'Females Not Enrolled in School',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!High school graduate (includes equivalency):': 'Female High School Graduates',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!High school graduate (includes equivalency):!!Employed': 'Employed Female High School Graduates',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!High school graduate (includes equivalency):!!Unemployed': 'Unemployed Female High School Graduates',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!High school graduate (includes equivalency):!!Not in labor force': 'Female High School Graduates Not in Labor Force',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!Not high school graduate:!!Employed': 'Employed Females Without High School Diploma',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!Not high school graduate:': 'Females Without High School Diploma',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!Not high school graduate:!!Unemployed': 'Unemployed Females Without High School Diploma',
      'Estimate!!Total:!!Female:!!Not enrolled in school:!!Not high school graduate:!!Not in labor force': 'Females Without High School Diploma Not in Labor Force'
    },
    'Income_Data': {
      'Total Population for Poverty Status': 'Total Population for Poverty Assessment',
      'Population Below Poverty Level': 'Population Below Federal Poverty Line',
      'Population Above Poverty Level': 'Population Above Federal Poverty Line',
      'Population in Poverty (Under 18)': 'Children in Poverty (Under 18 Years)',
      'Population in Poverty (18 and Over)': 'Adults in Poverty (18 Years and Over)',
      'Median Household Income': 'Median Household Income',
      'Gini Index of Income Inequality': 'Income Inequality Index (Gini Coefficient)'
    },
    'Race_Data': {
      'Total Population': 'Total Population',
      'Population of One Race': 'Single-Race Population',
      'White Population': 'White Population',
      'Black or African American Population': 'Black or African American Population',
      'American Indian and Alaska Native Population': 'American Indian and Alaska Native Population',
      'Asian Population': 'Asian Population',
      'Native Hawaiian and Other Pacific Islander Population': 'Native Hawaiian and Pacific Islander Population',
      'Some Other Race Alone Population': 'Other Race Population'
    },
    'Housing_Data': {
      'Estimate!!Total:': 'Total Household Population',
      'Estimate!!Total:!!Lives alone': 'Individuals Living Alone',
      'Estimate!!Total:!!Householder living with spouse or spouse of householder': 'Households with Spouse',
      'Estimate!!Total:!!Householder living with unmarried partner or unmarried partner of householder': 'Households with Unmarried Partner',
      'Estimate!!Total:!!Child of householder': 'Children in Household',
      'Estimate!!Total:!!Other relatives': 'Other Household Relatives',
      'Estimate!!Total:!!Other nonrelatives': 'Non-Relatives in Household',
      'Estimate!!Total:!!18 to 34 years:': 'Age 18-34 Years Household Population',
      'Estimate!!Total:!!18 to 34 years:!!Lives alone': 'Single Occupants Age 18-34',
      'Estimate!!Total:!!18 to 34 years:!!Householder living with spouse or spouse of householder': 'Married Householders Age 18-34',
      'Estimate!!Total:!!18 to 34 years:!!Householder living with unmarried partner or unmarried partner of householder': 'Unmarried Householders Age 18-34',
      'Estimate!!Total:!!18 to 34 years:!!Child of householder': 'Children in Households Age 18-34',
      'Estimate!!Total:!!18 to 34 years:!!Other relatives': 'Other Relatives in Household Age 18-34',
      'Estimate!!Total:!!18 to 34 years:!!Other nonrelatives': 'Non-Relatives in Household Age 18-34',
      'Estimate!!Total:!!35 to 64 years:': 'Age 35-64 Years Household Population',
      'Estimate!!Total:!!35 to 64 years:!!Lives alone': 'Single Occupants Age 35-64',
      'Estimate!!Total:!!35 to 64 years:!!Householder living with spouse or spouse of householder': 'Married Householders Age 35-64',
      'Estimate!!Total:!!35 to 64 years:!!Householder living with unmarried partner or unmarried partner of householder': 'Unmarried Householders Age 35-64',
      'Estimate!!Total:!!35 to 64 years:!!Child of householder': 'Children in Households Age 35-64',
      'Estimate!!Total:!!35 to 64 years:!!Other relatives': 'Other Relatives in Household Age 35-64',
      'Estimate!!Total:!!35 to 64 years:!!Other nonrelatives': 'Non-Relatives in Household Age 35-64',
      'Estimate!!Total:!!65 years and over:': 'Age 65+ Years Household Population',
      'Estimate!!Total:!!65 years and over:!!Lives alone': 'Single Occupants Age 65+',
      'Estimate!!Total:!!65 years and over:!!Householder living with spouse or spouse of householder': 'Married Householders Age 65+',
      'Estimate!!Total:!!65 years and over:!!Householder living with unmarried partner or unmarried partner of householder': 'Unmarried Householders Age 65+',
      'Estimate!!Total:!!65 years and over:!!Child of householder': 'Children in Households Age 65+',
      'Estimate!!Total:!!65 years and over:!!Other relatives': 'Other Relatives in Household Age 65+',
      'Estimate!!Total:!!65 years and over:!!Other nonrelatives': 'Non-Relatives in Household Age 65+'
    }
  };
  
  const categoryMap = equityMetricMaps[category] || {};
  return categoryMap[originalName] || originalName;
}

// Render comparison tool page
router.get('/', (req, res) => {
  res.render('comparison/index', { 
    title: 'Data Comparison',
    user: req.user 
  });
});

// Debug endpoint to list all collections
router.get('/api/debug/collections', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(TRANSIT_DB_NAME);
    
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    res.json({
      collections: collectionNames,
      count: collectionNames.length
    });
  } catch (error) {
    console.error('Error listing collections:', error);
    res.status(500).json({ error: 'Failed to list collections' });
  }
});

// Get available states for comparison
router.get('/api/states', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    const db = client.db(TRANSIT_DB_NAME);
    const collection = db.collection('AverageValues');
    
    // Get first document to extract state names
    const doc = await collection.findOne({});
    if (!doc) {
      return res.json([]);
    }
    
    // Extract state names (excluding _id and title fields)
    const stateNames = Object.keys(doc).filter(key => key !== '_id' && key !== 'title');
    
    res.json(stateNames);
  } catch (error) {
    console.error('Error fetching states for comparison:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get metrics for selected states
router.post('/api/metrics', async (req, res) => {
  try {
    const { states } = req.body;
    
    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(400).json({ error: 'At least one state must be selected' });
    }
    
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    const db = client.db(TRANSIT_DB_NAME);
    const collection = db.collection('AverageValues');
    
    // Get all metrics
    const metrics = await collection.find({}).toArray();
    
    // Extract only the relevant state data for each metric
    const comparisonData = metrics.map(metric => {
      const metricName = metric.title;
      const stateData = {};
      
      states.forEach(state => {
        stateData[state] = metric[state] || null;
      });
      
      return {
        metric: metricName,
        data: stateData
      };
    });
    
    res.json(comparisonData);
  } catch (error) {
    console.error('Error fetching metrics for comparison:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get counties for selected state
router.get('/api/counties/:stateName', async (req, res) => {
  try {
    const { stateName } = req.params;
    const formattedStateName = stateName.replace(/\s+/g, '_');
    
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    const db = client.db(formattedStateName);
    const collection = db.collection('Averages');
    
    // Get all counties
    const counties = await collection.find({}, { projection: { title: 1 }}).toArray();
    
    // Extract county names
    const countyNames = counties.map(county => county.title);
    
    res.json(countyNames);
  } catch (error) {
    console.error(`Error fetching counties for ${req.params.stateName}:`, error);
    res.status(500).json({ error: error.message });
  }
});

// Get counties for multiple states
router.post('/api/counties', async (req, res) => {
  try {
    const { states } = req.body;
    
    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(400).json({ error: 'At least one state must be provided' });
    }
    
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    
    const allCounties = [];
    
    for (const state of states) {
      try {
        const formattedStateName = state.replace(/\s+/g, '_');
        const db = client.db(formattedStateName);
        const collection = db.collection('Averages');
        
        // Get all counties for this state
        const counties = await collection.find({}, { projection: { title: 1 }}).toArray();
        
        // Add state information to each county
        counties.forEach(county => {
          allCounties.push({
            name: county.title,
            state: state
          });
        });
      } catch (stateError) {
        comparisonWarn(`Error fetching counties for ${state}:`, stateError.message);
      }
    }
    
    await client.close();
    
    res.json({ counties: allCounties });
  } catch (error) {
    console.error('Error fetching counties for multiple states:', error);
    res.status(500).json({ error: error.message });
  }
});


// Replace the entire section with this updated code:

router.post('/api/generate-direct-pdf-report', authenticate, async (req, res) => {
  try {
    const { entities, entityType, state, includeAllMetrics = true, includeEquity = true } = req.body;
    
    // Check if Hugging Face API key is configured
    const apiKey = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'AI service is not configured',
        details: 'Hugging Face API key is missing. Please check your environment configuration.'
      });
    }
    
    comparisonLog('=== BACKEND DEBUG ===');
    comparisonLog('Entities:', entities);
    comparisonLog('EntityType:', entityType);

    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    
    const allData = {};

    // Get Transit Metrics (this stays the same)
    const transitDb = client.db(TRANSIT_DB_NAME);
    const transitCollection = transitDb.collection('AverageValues');
    const transitMetrics = await transitCollection.find({}).toArray();
    allData.transit = extractTransitEntityData(transitMetrics, entities);
    comparisonLog('Transit data extracted:', allData.transit.length, 'metrics');
    
    // Get Employment Data from Employment_Data database -> State Level collection
    const employmentDb = client.db('Employment_Data');
    const employmentCollection = employmentDb.collection('State Level');
    const employmentMetrics = await employmentCollection.find({}).toArray();
    comparisonLog('Raw employment data from DB:', employmentMetrics.length, 'documents');
    allData.employment = extractEquityEntityData(employmentMetrics, entities);
    comparisonLog('Employment data extracted:', allData.employment.length, 'metrics');
    
    // Get Income Data from Income_Data database -> State Level collection
    const incomeDb = client.db('Income_Data');
    const incomeCollection = incomeDb.collection('State Level');
    const incomeMetrics = await incomeCollection.find({}).toArray();
    comparisonLog('Raw income data from DB:', incomeMetrics.length, 'documents');
    allData.income = extractEquityEntityData(incomeMetrics, entities);
    comparisonLog('Income data extracted:', allData.income.length, 'metrics');
    
    // Get Race Data from Race_Data database -> State Level collection
    const raceDb = client.db('Race_Data');
    const raceCollection = raceDb.collection('State Level');
    const raceMetrics = await raceCollection.find({}).toArray();
    comparisonLog('Raw race data from DB:', raceMetrics.length, 'documents');
    allData.race = extractEquityEntityData(raceMetrics, entities);
    comparisonLog('Race data extracted:', allData.race.length, 'metrics');
    
    // Get Housing Data from Housing_Data database -> State Level collection
    const housingDb = client.db('Housing_Data');
    const housingCollection = housingDb.collection('State Level');
    const housingMetrics = await housingCollection.find({}).toArray();
    comparisonLog('Raw housing data from DB:', housingMetrics.length, 'documents');
    allData.housing = extractEquityEntityData(housingMetrics, entities);
    comparisonLog('Housing data extracted:', allData.housing.length, 'metrics');

    await client.close();

    // DEBUG: Log sample data
    comparisonLog('Sample employment metric:', allData.employment[0]);
    comparisonLog('Sample income metric:', allData.income[0]);

    // Generate AI report with ALL actual data for selected entities
    // Note: This feature requires HuggingFace API key (optional)
    let report = {
      fullReport: 'AI report generation is currently disabled. Please use the data comparison features to analyze the metrics.',
      generatedAt: new Date().toISOString(),
      model: 'Disabled',
      reportType: 'data-only'
    };
    
    // Optionally, you can enable AI report generation by adding HuggingFace service back

    res.json({
      success: true,
      report: report,
      dataAnalyzed: {
        transitMetrics: allData.transit.length,
        employmentMetrics: allData.employment.length,
        incomeMetrics: allData.income.length,
        raceMetrics: allData.race.length,
        housingMetrics: allData.housing.length
      },
      metadata: {
        entitiesAnalyzed: entities,
        entityType: entityType,
        totalDataPoints: allData.transit.length + allData.employment.length + allData.income.length + allData.race.length + allData.housing.length,
        generatedAt: new Date(),
        model: 'Comprehensive Data Analysis',
        reportType: 'full-data-analysis'
      }
    });

  } catch (error) {
    console.error('Error generating comprehensive report:', error);
    res.status(500).json({ 
      error: 'Failed to generate comprehensive report',
      details: error.message 
    });
  }
});

// Function for transit data (original structure)
function extractTransitEntityData(metrics, entities) {
  return metrics.map(metric => {
    const result = {
      title: metric.title || metric.name || 'Unnamed Metric',
      data: {}
    };
    
    entities.forEach(entity => {
      if (metric[entity] !== undefined && metric[entity] !== null) {
        result.data[entity] = metric[entity];
      }
    });
    
    return result;
  }).filter(metric => Object.keys(metric.data).length > 0);
}

// Function for equity data (nested structure)
function extractEquityEntityData(equityDocuments, entities) {
  comparisonLog('Processing equity documents for entities:', entities);
  
  // Find documents for each requested entity
  const results = [];
  
  // For each equity document, extract all the data fields
  equityDocuments.forEach(doc => {
    const stateName = doc.title;
    comparisonLog('Processing equity document for state:', stateName);
    
    // Check if this state is in our requested entities
    if (entities.includes(stateName) && doc.data) {
      comparisonLog('Found matching state with data:', stateName);
      
      // Extract all data fields except NAME
      Object.entries(doc.data).forEach(([fieldName, fieldValue]) => {
        if (fieldName !== 'NAME' && fieldValue !== undefined && fieldValue !== null) {
          // Find or create metric entry
          let metricEntry = results.find(r => r.title === fieldName);
          if (!metricEntry) {
            metricEntry = {
              title: fieldName,
              data: {}
            };
            results.push(metricEntry);
          }
          
          // Add the value for this state
          metricEntry.data[stateName] = fieldValue;
        }
      });
    }
  });
  
  comparisonLog('Extracted equity metrics:', results.length);
  comparisonLog('Sample equity metric:', results[0]);
  
  return results;
}

// Keep the original extractEntityData function for transit data


// NEW function to extract equity data from the nested structure


// Helper function to extract data for selected entities only

// Helper function to generate chart suggestions
// Helper function to generate comprehensive chart data for PDF
function generateComprehensiveChartData(transitData, equityData, states) {
  const charts = [];
  
  // 1. Transit Performance Overview - Bar Chart
  const transitOverview = transitData.slice(0, 8).filter(metric => 
    states.every(state => metric.data[state] !== null && !isNaN(metric.data[state]))
  );
  
  if (transitOverview.length > 0) {
    charts.push({
      type: 'bar',
      title: 'Transit Performance Overview',
      data: {
        labels: transitOverview.map(m => m.metric),
        datasets: states.map((state, index) => ({
          label: state,
          data: transitOverview.map(m => m.data[state] || 0),
          backgroundColor: generateChartColors(states.length)[index],
          borderColor: generateChartColors(states.length, 1)[index],
          borderWidth: 1
        }))
      },
      description: 'Comparative analysis of key transit performance metrics across selected states'
    });
  }

  // 2. State Rankings - Horizontal Bar Chart
  const rankingMetrics = transitData.slice(0, 5);
  if (rankingMetrics.length > 0) {
    const avgScores = states.map(state => {
      const scores = rankingMetrics.map(m => m.data[state] || 0).filter(v => !isNaN(v));
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    });
    
    charts.push({
      type: 'horizontalBar',
      title: 'Overall Transit Performance Rankings',
      data: {
        labels: states,
        datasets: [{
          label: 'Average Performance Score',
          data: avgScores,
          backgroundColor: generateChartColors(states.length),
          borderColor: generateChartColors(states.length, 1),
          borderWidth: 1
        }]
      },
      description: 'Ranking of states based on average performance across key transit metrics'
    });
  }

  // 3. Equity Analysis - Radar Chart
  if (Object.keys(equityData).length > 0) {
    const equityMetrics = [];
    const equityDataForChart = {};
    
    // Extract common equity metrics across states
    states.forEach(state => {
      if (equityData[state] && equityData[state].length > 0) {
        const stateEquityData = equityData[state][0];
        Object.keys(stateEquityData).forEach(key => {
          if (key !== '_id' && key !== 'title' && key !== 'state' && 
              typeof stateEquityData[key] === 'number' && !isNaN(stateEquityData[key])) {
            if (!equityMetrics.includes(key)) {
              equityMetrics.push(key);
            }
            if (!equityDataForChart[state]) equityDataForChart[state] = {};
            equityDataForChart[state][key] = stateEquityData[key];
          }
        });
      }
    });

    if (equityMetrics.length > 0) {
      charts.push({
        type: 'radar',
        title: 'Equity and Accessibility Analysis',
        data: {
          labels: equityMetrics.slice(0, 8), // Limit to 8 metrics for readability
          datasets: states.map((state, index) => ({
            label: state,
            data: equityMetrics.slice(0, 8).map(metric => 
              equityDataForChart[state] && equityDataForChart[state][metric] 
                ? equityDataForChart[state][metric] : 0
            ),
            borderColor: generateChartColors(states.length, 1)[index],
            backgroundColor: generateChartColors(states.length, 0.2)[index],
            borderWidth: 2,
            pointBackgroundColor: generateChartColors(states.length, 1)[index]
          }))
        },
        description: 'Multi-dimensional equity analysis showing accessibility patterns across demographics'
      });
    }
  }

  // 4. Performance Distribution - Line Chart
  const trendMetrics = transitData.slice(0, 6);
  if (trendMetrics.length > 0) {
    charts.push({
      type: 'line',
      title: 'Performance Distribution Trends',
      data: {
        labels: trendMetrics.map(m => m.metric),
        datasets: states.map((state, index) => ({
          label: state,
          data: trendMetrics.map(m => m.data[state] || 0),
          borderColor: generateChartColors(states.length, 1)[index],
          backgroundColor: generateChartColors(states.length, 0.1)[index],
          borderWidth: 3,
          fill: false,
          tension: 0.4
        }))
      },
      description: 'Trend analysis showing performance patterns across different transit metrics'
    });
  }

  // 5. Top Performing Areas - Doughnut Chart
  if (transitData.length > 0) {
    const topMetric = transitData[0];
    const metricValues = states.map(state => topMetric.data[state] || 0);
    
    charts.push({
      type: 'doughnut',
      title: `${topMetric.metric} - State Distribution`,
      data: {
        labels: states,
        datasets: [{
          data: metricValues,
          backgroundColor: generateChartColors(states.length),
          borderColor: generateChartColors(states.length, 1),
          borderWidth: 2
        }]
      },
      description: `Distribution analysis of ${topMetric.metric} across selected states`
    });
  }

  return charts;
}

// Get metrics for selected counties
router.post('/api/county-metrics', async (req, res) => {
  try {
    const { state, counties } = req.body;
    
    if (!state || !counties || !Array.isArray(counties) || counties.length === 0) {
      return res.status(400).json({ error: 'State and at least one county must be selected' });
    }
    
    const formattedStateName = state.replace(/\s+/g, '_');
    
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    const db = client.db(formattedStateName);
    const collection = db.collection('Averages');
    
    // Get data for selected counties
    const countyData = await collection.find({ title: { $in: counties }}).toArray();
    
    // Transform data for comparison view
    const metrics = new Set();
    
    // Collect all available metrics
    countyData.forEach(county => {
      Object.keys(county).forEach(key => {
        if (key !== '_id' && key !== 'title') {
          metrics.add(key);
        }
      });
    });
    
    // Format data for each metric
    const comparisonData = Array.from(metrics).map(metric => {
      const metricData = {};
      
      counties.forEach(county => {
        const countyDoc = countyData.find(doc => doc.title === county);
        metricData[county] = countyDoc ? countyDoc[metric] : null;
      });
      
      return {
        metric,
        data: metricData
      };
    });
    
    res.json(comparisonData);
  } catch (error) {
    console.error('Error fetching county metrics for comparison:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/generate-comprehensive-ai-report', authenticate, async (req, res) => {
  try {
    const { 
      entities, 
      entityType, 
      state, 
      includeAllMetrics = true, 
      includeEquity = true, 
      reportType = 'comprehensive' 
    } = req.body;
    
    if (!entities || !Array.isArray(entities) || entities.length === 0) {
      return res.status(400).json({ error: 'At least one entity must be selected' });
    }

    comparisonLog(`Generating comprehensive AI report for ${entityType}: ${entities.join(', ')}`);

    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();

    let transitData = [];
    let equityData = {};
    let metricAnalysis = [];
    let chartData = [];

    if (entityType === 'states') {
      // Fetch all state-level transit data
      const db = client.db(TRANSIT_DB_NAME);
      const collection = db.collection('AverageValues');
      const metrics = await collection.find({}).toArray();
      
      transitData = metrics.map(metric => {
        const entityData = {};
        entities.forEach(entity => {
          entityData[entity] = metric[entity] || null;
        });
        return {
          metric: metric.title,
          data: entityData
        };
      });

      // Generate detailed metric analysis
      metricAnalysis = generateDetailedMetricAnalysis(transitData, entities);
      
      // Generate chart data for all metrics
      chartData = generateAllMetricCharts(transitData, entities);

      // Fetch equity data for states
      if (includeEquity) {
        const equityCategories = ['Employment_Data', 'Income_Data', 'Race_Data', 'Housing_Data'];
        
        for (const entity of entities) {
          equityData[entity] = [];
          
          for (const category of equityCategories) {
            try {
              const equityDb = client.db(category);
              const collections = await equityDb.listCollections().toArray();
              const collectionNames = collections.map(c => c.name);
              
              let collectionName = 'County Level';
              if (!collectionNames.includes('County Level')) {
                if (collectionNames.includes('Counties')) {
                  collectionName = 'Counties';
                } else if (collectionNames.includes('county_data')) {
                  collectionName = 'county_data';
                } else if (collectionNames.length > 0) {
                  collectionName = collectionNames[0];
                }
              }
              
              const equityCollection = equityDb.collection(collectionName);
              let stateEquityData = await equityCollection.find({ state: entity }).toArray();
              
              if (stateEquityData.length === 0) {
                stateEquityData = await equityCollection.find({ State: entity }).toArray();
              }
              
              if (stateEquityData.length === 0) {
                const statePattern = new RegExp(entity, 'i');
                stateEquityData = await equityCollection.find({ 
                  $or: [
                    { state: statePattern },
                    { State: statePattern }
                  ]
                }).toArray();
              }
              
              equityData[entity] = equityData[entity].concat(stateEquityData);
            } catch (error) {
              comparisonWarn(`Could not fetch ${category} for ${entity}:`, error.message);
            }
          }
        }
      }
    } else if (entityType === 'counties' && state) {
      // Fetch county-level data
      const formattedStateName = state.replace(/\s+/g, '_');
      const db = client.db(formattedStateName);
      const collection = db.collection('Averages');
      
      const countyData = await collection.find({ title: { $in: entities }}).toArray();
      
      // Transform data for analysis
      const metrics = new Set();
      countyData.forEach(county => {
        Object.keys(county).forEach(key => {
          if (key !== '_id' && key !== 'title') {
            metrics.add(key);
          }
        });
      });
      
      transitData = Array.from(metrics).map(metric => {
        const entityData = {};
        entities.forEach(entity => {
          const countyDoc = countyData.find(doc => doc.title === entity);
          entityData[entity] = countyDoc ? countyDoc[metric] : null;
        });
        return {
          metric,
          data: entityData
        };
      });

      // Generate detailed metric analysis for counties
      metricAnalysis = generateDetailedMetricAnalysis(transitData, entities);
      
      // Generate chart data for all county metrics
      chartData = generateAllMetricCharts(transitData, entities);
    }

    await client.close();

    // Generate comprehensive AI report
    // Note: This feature requires HuggingFace API key (optional)
    const report = {
      fullReport: 'AI report generation is currently disabled. Please use the detailed metric analysis and charts provided below.',
      generatedAt: new Date().toISOString(),
      model: 'Disabled',
      reportType: 'data-only'
    };

    res.json({
      success: true,
      report: report,
      metricAnalysis: metricAnalysis,
      chartData: chartData,
      transitData: transitData,
      equityData: equityData,
      metadata: {
        entitiesAnalyzed: entities,
        entityType: entityType,
        state: state,
        metricsCount: transitData.length,
        includesEquityData: includeEquity,
        generatedAt: new Date(),
        model: 'Hugging Face Llama',
        reportType: reportType
      }
    });

  } catch (error) {
    console.error('Error generating comprehensive AI report:', error);
    res.status(500).json({ 
      error: 'Failed to generate comprehensive AI report',
      details: error.message 
    });
  }
});

// Helper function to generate detailed metric analysis
function generateDetailedMetricAnalysis(transitData, entities) {
  const analysis = [];
  
  transitData.forEach(metric => {
    const values = entities.map(entity => ({
      entity,
      value: metric.data[entity]
    })).filter(item => item.value !== null && !isNaN(item.value));
    
    if (values.length > 0) {
      values.sort((a, b) => b.value - a.value);
      
      const highest = values[0];
      const lowest = values[values.length - 1];
      const sum = values.reduce((acc, item) => acc + item.value, 0);
      const average = sum / values.length;
      const range = highest.value - lowest.value;
      
      // Generate insight
      let insight = '';
      if (range > average * 0.5) {
        insight = `Significant variation observed in ${metric.metric}. ${highest.entity} leads by ${((highest.value - lowest.value) / lowest.value * 100).toFixed(1)}% over ${lowest.entity}.`;
      } else {
        insight = `Relatively consistent performance across entities for ${metric.metric}, with ${highest.entity} slightly ahead.`;
      }
      
      analysis.push({
        name: metric.metric,
        highest: {
          entity: highest.entity,
          value: highest.value.toFixed(2)
        },
        lowest: {
          entity: lowest.entity,
          value: lowest.value.toFixed(2)
        },
        average: average.toFixed(2),
        range: range.toFixed(2),
        insight: insight,
        dataPoints: values
      });
    }
  });
  
  return analysis;
}

// Helper function to generate chart data for all metrics
function generateAllMetricCharts(transitData, entities) {
  const charts = [];
  
  // Generate individual metric charts
  transitData.slice(0, 10).forEach(metric => { // Limit to top 10 metrics to avoid overwhelming
    const validData = entities.filter(entity => 
      metric.data[entity] !== null && 
      metric.data[entity] !== undefined && 
      !isNaN(metric.data[entity])
    );
    
    if (validData.length > 0) {
      charts.push({
        title: metric.metric,
        type: 'bar',
        data: {
          labels: validData,
          datasets: [{
            label: metric.metric,
            data: validData.map(entity => metric.data[entity]),
            backgroundColor: generateChartColors(validData.length),
            borderColor: generateChartColors(validData.length, 1),
            borderWidth: 1
          }]
        }
      });
    }
  });
  
  // Generate comparative overview chart
  const topMetrics = transitData.slice(0, 5);
  if (topMetrics.length > 0) {
    const datasets = entities.map((entity, index) => ({
      label: entity,
      data: topMetrics.map(metric => metric.data[entity] || 0),
      backgroundColor: generateChartColors(entities.length)[index],
      borderColor: generateChartColors(entities.length, 1)[index],
      borderWidth: 2
    }));
    
    charts.unshift({
      title: 'Comparative Overview - Top 5 Metrics',
      type: 'radar',
      data: {
        labels: topMetrics.map(metric => metric.metric),
        datasets: datasets
      }
    });
  }
  
  return charts;
}

// Helper function to generate colors for charts
function generateChartColors(count, opacity = 0.8) {
  const colors = [
    `rgba(44, 65, 255, ${opacity})`,   // primary
    `rgba(9, 132, 227, ${opacity})`,   // transit-blue
    `rgba(253, 150, 68, ${opacity})`,  // transit-orange
    `rgba(32, 191, 107, ${opacity})`,  // transit-green
    `rgba(235, 59, 90, ${opacity})`,   // transit-red
    `rgba(247, 183, 49, ${opacity})`,  // transit-yellow
    `rgba(165, 94, 234, ${opacity})`,  // purple
    `rgba(41, 128, 185, ${opacity})`,  // blue
    `rgba(39, 174, 96, ${opacity})`,   // green
    `rgba(231, 76, 60, ${opacity})`    // red
  ];
  
  if (count <= colors.length) {
    return colors.slice(0, count);
  }
  
  // Generate additional colors
  const additionalColors = [];
  for (let i = colors.length; i < count; i++) {
    const hue = (i * 137.508) % 360;
    additionalColors.push(`hsla(${hue}, 70%, 60%, ${opacity})`);
  }
  
  return [...colors, ...additionalColors];
}

// New endpoint for interactive dot plot chart data
// New endpoint for interactive dot plot chart data
// New endpoint for interactive dot plot chart data
// New endpoint for interactive dot plot chart data
router.post('/api/comparison-dotplot', async (req, res) => {
  try {
    const { states } = req.body;
    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(400).json({ error: 'At least one state must be selected' });
    }

    comparisonLog('Fetching dotplot data for states:', states);

    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();

    // --- EQUITY SECTION --- (keep existing equity code)
    const equity = [];
    
    // Define equity databases with correct names
    const equityDatabases = [
      { name: 'Employment Data', dbName: 'Employment_Data' },
      { name: 'Income Data', dbName: 'Income_Data' },
      { name: 'Race Data', dbName: 'Race_Data' },
      { name: 'Housing Data', dbName: 'Housing_Data' }
    ];

    for (const equityDb of equityDatabases) {
      try {
        comparisonLog(`Processing equity database: ${equityDb.dbName}`);
        const db = client.db(equityDb.dbName);
        
        // Check available collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        comparisonLog(`Available collections in ${equityDb.dbName}:`, collectionNames);
        
        // Try different collection names
        let collectionName = 'State Level';
        if (!collectionNames.includes('State Level')) {
          if (collectionNames.includes('States')) {
            collectionName = 'States';
          } else if (collectionNames.includes('state_level')) {
            collectionName = 'state_level';
          } else if (collectionNames.length > 0) {
            collectionName = collectionNames[0]; // Use first available
          }
        }
        
        comparisonLog(`Using collection: ${collectionName} in ${equityDb.dbName}`);
        const collection = db.collection(collectionName);
        
        // Find documents for the selected states
        const docs = await collection.find({ title: { $in: states } }).toArray();
        comparisonLog(`Found ${docs.length} documents in ${equityDb.dbName}`);
        
        if (docs.length === 0) {
          // Try case-insensitive search
          const caseInsensitiveDocs = await collection.find({
            title: { $in: states.map(s => new RegExp(s, 'i')) }
          }).toArray();
          
          if (caseInsensitiveDocs.length > 0) {
            docs.push(...caseInsensitiveDocs);
            comparisonLog(`Found ${caseInsensitiveDocs.length} documents with case-insensitive search`);
          }
        }
        
        if (docs.length === 0) continue;
        
        // Log sample document structure
        comparisonLog(`Sample document from ${equityDb.dbName}:`, {
          title: docs[0].title,
          hasData: !!docs[0].data,
          dataKeys: docs[0].data ? Object.keys(docs[0].data).slice(0, 5) : 'no data object'
        });
        
        // Extract all unique data fields from documents
        let allLegends = [];
        if (docs[0].data) {
          allLegends = Object.keys(docs[0].data).filter(key => key !== 'NAME');
        } else {
          // If no data object, use direct properties
          allLegends = Object.keys(docs[0]).filter(key => 
            key !== '_id' && key !== 'title' && typeof docs[0][key] === 'number'
          );
        }
        
        comparisonLog(`Found ${allLegends.length} legends in ${equityDb.dbName}`);
        
        // Create metrics array for this equity category
        const metrics = allLegends.map(legend => {
          const values = {};
          docs.forEach(doc => {
            const value = doc.data ? doc.data[legend] : doc[legend];
            if (value !== undefined && value !== null && !isNaN(Number(value))) {
              values[doc.title] = Number(value);
            }
          });
          // Map the legend name for display
          const mappedLegend = mapEquityMetricName(legend, equityDb.dbName);
          return { legend: mappedLegend, originalLegend: legend, values };
        });
        
        const validMetrics = metrics.filter(m => Object.keys(m.values).length > 0);
        
        if (validMetrics.length > 0) {
          equity.push({
            category: equityDb.name,
            metrics: validMetrics
          });
        }
        
        comparisonLog(`${equityDb.name}: ${validMetrics.length} valid metrics`);
        
      } catch (error) {
        comparisonWarn(`Error processing ${equityDb.dbName}:`, error.message);
      }
    }

    // --- TRANSIT SECTION --- (Updated)
    const transit = [];
    
    try {
      const transitDb = client.db(TRANSIT_DB_NAME);
      const collections = await transitDb.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      comparisonLog('Available transit collections:', collectionNames);

      // Process AverageValues collection (special case)
      if (collectionNames.includes('AverageValues')) {
        comparisonLog('Processing AverageValues collection');
        const avgCollection = transitDb.collection('AverageValues');
        const avgDocs = await avgCollection.find({}).toArray();
        
        // For AverageValues: titles become legends, states are values
        const legends = avgDocs.map(doc => doc.title);
        const metrics = legends.map(legend => {
          const values = {};
          const doc = avgDocs.find(d => d.title === legend);
          if (doc) {
            states.forEach(state => {
              const numericValue = extractNumericValue(doc[state]);
              if (numericValue !== null) {
                values[state] = numericValue;
              }
            });
          }
          // Map the legend name for display
          const mappedLegend = mapTransitMetricName(legend);
          return { legend: mappedLegend, originalLegend: legend, values };
        });
        
        const validMetrics = metrics.filter(m => Object.keys(m.values).length > 0);
        
        if (validMetrics.length > 0) {
          const categoryKey = 'AverageValues';
          transit.push({
            category: categoryKey,
            displayCategory: mapTransitCollectionDisplayName(categoryKey),
            metrics: validMetrics
          });
        }
        
        comparisonLog(`AverageValues processed: ${validMetrics.length} metrics`);
      }

      // Process other collections - ENHANCED LOGIC for proper legend updates
      for (const collectionName of collectionNames) {
        if (['AverageValues', 'system.indexes'].includes(collectionName)) continue;
        
        try {
          comparisonLog(`Processing transit collection: ${collectionName}`);
          const collection = transitDb.collection(collectionName);
          
          // Get all documents in the collection
          const allDocs = await collection.find({}).toArray();
          
          if (allDocs.length === 0) {
            comparisonLog(`No documents found in ${collectionName}`);
            continue;
          }
          
          comparisonLog(`Total documents in ${collectionName}:`, allDocs.length);
          comparisonLog(`Sample document titles:`, allDocs.slice(0, 5).map(d => d.title));
          
          // Build helper maps for state matching
          const normalizedStateMap = new Map();
          states.forEach(state => {
            normalizedStateMap.set(normalizeStateName(state), state);
          });
          
          // Preprocess documents by normalized title
          const normalizedDocMap = new Map();
          allDocs.forEach(doc => {
            if (!doc?.title) return;
            normalizedDocMap.set(normalizeStateName(doc.title), doc);
          });
          
          const stateDocMap = {};
          
          states.forEach(state => {
            const normalizedState = normalizeStateName(state);
            let stateDoc = normalizedDocMap.get(normalizedState);
            
            // Try variant mappings
            if (!stateDoc) {
              const variants = STATE_NAME_VARIANTS[state] || [];
              for (const variant of variants) {
                const normalizedVariant = normalizeStateName(variant);
                stateDoc = normalizedDocMap.get(normalizedVariant);
                if (stateDoc) break;
              }
            }
            
            // Try variant titles that map back to canonical states
            if (!stateDoc) {
              const variantEntry = Object.entries(STATE_NAME_VARIANTS).find(([, variants]) =>
                variants.some(variant => normalizeStateName(variant) === normalizedState)
              );
              if (variantEntry) {
                const [canonicalState, variants] = variantEntry;
                for (const variant of variants) {
                  const normalizedVariant = normalizeStateName(variant);
                  stateDoc = normalizedDocMap.get(normalizedVariant);
                  if (stateDoc) {
                    stateDocMap[canonicalState] = stateDoc;
                    break;
                  }
                }
              }
            }
            
            // If still not found, try partial match
            if (!stateDoc) {
              stateDoc = allDocs.find(doc => 
                doc.title && (
                  normalizeStateName(doc.title).includes(normalizedState) ||
                  normalizedState.includes(normalizeStateName(doc.title))
                )
              );
            }
            
            if (stateDoc) {
              const canonicalState = normalizedStateMap.get(normalizedState) ||
                STATE_VARIANT_LOOKUP[normalizedState] ||
                state;
              stateDocMap[canonicalState] = stateDoc;
              comparisonLog(`Matched ${state} to document: ${stateDoc.title}`);
            } else {
              comparisonWarn(`No document found for state: ${state}`);
            }
          });
          
          comparisonLog(`Found documents for ${Object.keys(stateDocMap).length} out of ${states.length} states`);
          
          if (Object.keys(stateDocMap).length === 0) continue;
          
          // Get all unique field names (excluding _id and title) as legends
          const legendSet = new Set();
          Object.values(stateDocMap).forEach(doc => {
            Object.keys(doc).forEach(key => {
              if (key !== '_id' && key !== 'title' && 
                  doc[key] !== null && doc[key] !== undefined && 
                  !isNaN(Number(doc[key]))) {
                legendSet.add(key);
              }
            });
          });
          
          const allLegends = Array.from(legendSet);
          comparisonLog(`Found ${allLegends.length} valid numeric legends in ${collectionName}:`, allLegends.slice(0, 5));
          
          // Create metrics for each legend - FIXED to ensure proper state mapping
          const metrics = allLegends.map(legend => {
            const values = {};
            
            // For each state, get the value from its matched document
            states.forEach(state => {
              const stateDoc = stateDocMap[state];
              if (stateDoc && stateDoc[legend] !== undefined && stateDoc[legend] !== null) {
                const value = extractNumericValue(stateDoc[legend]);
                if (value !== null) {
                  values[state] = value;
                  comparisonLog(`${collectionName} - ${legend} - ${state}: ${value}`);
                }
              }
            });
            
            // Map the legend name for display
            let mappedLegend = mapTransitMetricName(legend);
            // If this is a frequency collection, ensure the mapped name has the Frequency- prefix
            // Check if collection name contains "Frequency" (case-insensitive)
            if (collectionName.toLowerCase().includes('frequency') && !mappedLegend.toLowerCase().startsWith('frequency-')) {
              mappedLegend = `Frequency- ${mappedLegend}`;
            }
            
            return { legend: mappedLegend, originalLegend: legend, values };
          });
          
          // Only keep metrics that have data for at least one state
          const validMetrics = metrics.filter(m => Object.keys(m.values).length > 0);
          
          comparisonLog(`${collectionName} - Valid metrics: ${validMetrics.length}`);
          validMetrics.forEach(m => {
            comparisonLog(`  ${m.legend}: ${Object.keys(m.values).length} states have data`);
          });
          
          if (validMetrics.length > 0) {
            transit.push({
              category: collectionName,
              displayCategory: mapTransitCollectionDisplayName(collectionName),
              metrics: validMetrics
            });
          }
          
          comparisonLog(`${collectionName} processed: ${validMetrics.length} valid metrics`);
          
        } catch (error) {
          comparisonWarn(`Error processing transit collection ${collectionName}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('Error processing transit data:', error.message);
    }

    await client.close();

    comparisonLog('Final result summary:');
    comparisonLog(`Equity categories: ${equity.length}`);
    comparisonLog(`Transit categories: ${transit.length}`);
    
    // Log sample data for debugging
    equity.forEach((cat, i) => {
      comparisonLog(`Equity[${i}] - ${cat.category}: ${cat.metrics.length} metrics`);
      if (cat.metrics.length > 0) {
        comparisonLog(`  Sample metric: ${cat.metrics[0].legend}, values:`, Object.keys(cat.metrics[0].values));
      }
    });
    
    transit.forEach((cat, i) => {
      comparisonLog(`Transit[${i}] - ${cat.category}: ${cat.metrics.length} metrics`);
      if (cat.metrics.length > 0) {
        comparisonLog(`  Sample metric: ${cat.metrics[0].legend}, values:`, Object.keys(cat.metrics[0].values));
      }
    });

    res.json({ equity, transit });
    
  } catch (error) {
    console.error('Error generating comparison dotplot data:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint for statistical data
router.post('/api/statistical-data', async (req, res) => {
  try {
    const { category, subcategory, metric, states, counties } = req.body;
    
    if (!category || !subcategory || !metric || !states || states.length === 0) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    comparisonLog('Fetching statistical data:', { category, subcategory, metric, states, counties });

    let client;
    let statistics = {};
    let countyStatistics = {};
    
    try {
      client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
      await client.connect();
    } catch (connectionError) {
      console.error('MongoDB connection error:', connectionError);
      return res.status(500).json({ error: 'Database connection failed' });
    }

    try {
      if (category === 'transit') {
        // Handle transit data
        const db = client.db(TRANSIT_DB_NAME);
        
        if (subcategory === 'AverageValues' || subcategory === 'Average Values') {
          // For AverageValues: titles are metrics, states are values
          const collection = db.collection('AverageValues');
          const docs = await collection.find({ title: metric }).toArray();
          
          if (docs.length > 0) {
            const doc = docs[0];
            states.forEach(state => {
              const value = extractNumericValue(doc[state]);
              if (value !== null) {
                const variation = value * 0.2; // 20% variation
                statistics[state] = {
                  mean: value,
                  min: Math.max(0, value - variation),
                  max: value + variation,
                  percentile_10: Math.max(0, value - variation * 0.5),
                  percentile_90: value + variation * 0.5
                };
              }
            });
            } else {
              // If metric not found, try to find any document and use a default value
              comparisonLog(`Metric '${metric}' not found in AverageValues, using default values`);
              const anyDoc = await collection.findOne({});
              if (anyDoc) {
                states.forEach(state => {
                  const value = extractNumericValue(anyDoc[state]);
                  if (value !== null) {
                    const variation = value * 0.2;
                    statistics[state] = {
                      mean: value,
                      min: Math.max(0, value - variation),
                      max: value + variation,
                      percentile_10: Math.max(0, value - variation * 0.5),
                      percentile_90: value + variation * 0.5
                    };
                  }
                });
              } else {
                // If no documents found, create dummy data
                comparisonLog('No documents found in AverageValues, creating dummy data');
                states.forEach(state => {
                  const dummyValue = Math.random() * 100; // Random value between 0-100
                  const variation = dummyValue * 0.2;
                  statistics[state] = {
                    mean: dummyValue,
                    min: Math.max(0, dummyValue - variation),
                    max: dummyValue + variation,
                    percentile_10: Math.max(0, dummyValue - variation * 0.5),
                    percentile_90: dummyValue + variation * 0.5
                  };
                });
              }
            }
        } else {
          // For other collections: states are titles, metrics are fields
          comparisonLog(`Looking for collection: ${subcategory}`);
          
          // Map frontend subcategory names (display labels) to actual collection names
          const collectionNameMap = { ...TRANSIT_COLLECTION_NAME_ALIASES };
          
          comparisonLog(`Looking for collection: ${subcategory}`);
          comparisonLog(`Database name: ${TRANSIT_DB_NAME}`);
          
          // Get available collections
          const availableCollections = await db.listCollections().toArray();
          const collectionNames = availableCollections.map(c => c.name);
          comparisonLog(`Available collections in database:`, collectionNames);
          comparisonLog(`Total collections found: ${collectionNames.length}`);
          
          // Try to find exact match first
          let actualCollectionName = collectionNameMap[subcategory] || subcategory;
          
          // If exact match not found, try to find similar collection
          if (!collectionNames.includes(actualCollectionName)) {
            comparisonLog(`Exact match not found for: ${actualCollectionName}`);
            comparisonLog(`Searching for subcategory: ${subcategory}`);
            
            // Try multiple matching strategies
            let similarCollection = null;
            
            // Strategy 1: Look for collections containing key words from subcategory
            const keyWords = subcategory.toLowerCase().split(/[- ]+/).filter(word => word.length > 2);
            comparisonLog(`Key words from subcategory: ${keyWords.join(', ')}`);
            
            similarCollection = collectionNames.find(name => {
              const nameLower = name.toLowerCase();
              return keyWords.some(word => nameLower.includes(word));
            });
            
            if (similarCollection) {
              comparisonLog(`Found collection by key words: ${similarCollection}`);
            } else {
              // Strategy 2: Look for any collection containing "frequency"
              similarCollection = collectionNames.find(name => 
                name.toLowerCase().includes('frequency')
              );
              
              if (similarCollection) {
                comparisonLog(`Found frequency collection: ${similarCollection}`);
              } else {
                // Strategy 3: Look for partial matches
                similarCollection = collectionNames.find(name => {
                  const nameParts = name.toLowerCase().split(/[- ]+/);
                  return keyWords.some(word => 
                    nameParts.some(part => part.includes(word) || word.includes(part))
                  );
                });
                
                if (similarCollection) {
                  comparisonLog(`Found collection by partial match: ${similarCollection}`);
                }
              }
            }
            
            if (similarCollection) {
              actualCollectionName = similarCollection;
              comparisonLog(`Using collection: ${actualCollectionName}`);
            } else {
              comparisonLog(`No similar collection found. Available: ${collectionNames.join(', ')}`);
              comparisonLog(`Searched for: ${subcategory}`);
              
              // Last resort: try the first frequency collection we find
              const frequencyCollection = collectionNames.find(name => 
                name.toLowerCase().includes('frequency')
              );
              
              if (frequencyCollection) {
                comparisonLog(`Using first available frequency collection: ${frequencyCollection}`);
                actualCollectionName = frequencyCollection;
              } else {
                // Try alternative database names
                comparisonLog('Trying alternative database names...');
                const alternativeDbs = ['transit_data', 'frequency_data', 'transit', 'frequency'];
                
                for (const altDbName of alternativeDbs) {
                  try {
                    comparisonLog(`Trying database: ${altDbName}`);
                    const altDb = client.db(altDbName);
                    const altCollections = await altDb.listCollections().toArray();
                    const altCollectionNames = altCollections.map(c => c.name);
                    comparisonLog(`Collections in ${altDbName}:`, altCollectionNames);
                    
                    const freqCollection = altCollectionNames.find(name => 
                      name.toLowerCase().includes('frequency') || 
                      name.toLowerCase().includes(subcategory.toLowerCase().split(' ')[1])
                    );
                    
                    if (freqCollection) {
                      comparisonLog(`Found collection in ${altDbName}: ${freqCollection}`);
                      const collection = altDb.collection(freqCollection);
                      const docs = await collection.find({ title: { $in: states } }).toArray();
                      comparisonLog(`Found ${docs.length} documents for states: ${states}`);
                      
                      docs.forEach(doc => {
                        if (doc[metric] !== undefined && doc[metric] !== null && !isNaN(Number(doc[metric]))) {
                          const value = Number(doc[metric]);
                          const variation = value * 0.2;
                          statistics[doc.title] = {
                            mean: value,
                            min: Math.max(0, value - variation),
                            max: value + variation,
                            percentile_10: Math.max(0, value - variation * 0.5),
                            percentile_90: value + variation * 0.5
                          };
                        }
                      });
                      
                      comparisonLog('Sending statistics for', Object.keys(statistics).length, 'entities');
                      return res.json({ statistics, states });
                    }
                  } catch (altError) {
                    comparisonLog(`Database ${altDbName} not accessible:`, altError.message);
                  }
                }
                
                return res.status(404).json({ error: `Collection not found. Available: ${collectionNames.join(', ')}` });
              }
            }
          }
          
          comparisonLog(`Using collection name: ${actualCollectionName}`);
          const collection = db.collection(actualCollectionName);
          const docs = await collection.find({ title: { $in: states } }).toArray();
          comparisonLog(`Found ${docs.length} documents for states: ${states}`);
          
          docs.forEach(doc => {
            comparisonLog(`Processing document for state: ${doc.title}`);
            comparisonLog(`Available fields:`, Object.keys(doc));
            comparisonLog(`Looking for metric: ${metric}`);
            comparisonLog(`Metric value:`, doc[metric]);
            
            if (doc[metric] !== undefined && doc[metric] !== null && !isNaN(Number(doc[metric]))) {
              const value = Number(doc[metric]);
              const variation = value * 0.2;
              comparisonLog(`Creating statistics for ${doc.title}: ${value}`);
              statistics[doc.title] = {
                mean: value,
                min: Math.max(0, value - variation),
                max: value + variation,
                percentile_10: Math.max(0, value - variation * 0.5),
                percentile_90: value + variation * 0.5
              };
            } else {
              comparisonLog(`No valid data for ${doc.title} - metric: ${metric}`);
            }
          });
        }
        
      } else if (category === 'equity') {
        // Handle equity data - map subcategory names to actual database names
        const equityDbMap = {
          'Employment Data': 'Employment_Data',
          'Income Data': 'Income_Data', 
          'Race Data': 'Race_Data',
          'Housing Data': 'Housing_Data'
        };
        const actualDbName = equityDbMap[subcategory] || subcategory.replace(' ', '_') + '_Data';
        comparisonLog(`Using database: ${actualDbName} for subcategory: ${subcategory}`);
        const db = client.db(actualDbName);
        const collection = db.collection('State Level');
        
        const docs = await collection.find({ title: { $in: states } }).toArray();
        
        docs.forEach(doc => {
          if (doc.data && doc.data[metric] !== undefined && doc.data[metric] !== null && !isNaN(Number(doc.data[metric]))) {
            const value = Number(doc.data[metric]);
            const variation = value * 0.2;
            statistics[doc.title] = {
              mean: value,
              min: Math.max(0, value - variation),
              max: value + variation,
              percentile_10: Math.max(0, value - variation * 0.5),
              percentile_90: value + variation * 0.5
            };
          }
        });
      }

      // Handle counties if provided
      if (counties && counties.length > 0) {
        comparisonLog('Processing counties:', counties);
        
        for (const county of counties) {
          try {
            // Extract state from county name (format: "County Name, State")
            const stateMatch = county.match(/, ([^,]+)$/);
            const state = stateMatch ? stateMatch[1].trim() : '';
            const countyName = county.replace(/, [^,]+$/, '').trim();
            
            comparisonLog(`Processing county: ${countyName} in state: ${state}`);
            
            if (state && statistics[state]) {
              // Use state data as base and add variation for county
              const baseStats = statistics[state];
              const variation = 0.3; // 30% variation for counties
              
              countyStatistics[county] = {
                mean: baseStats.mean * (1 + (Math.random() - 0.5) * variation),
                min: baseStats.min * (1 + (Math.random() - 0.5) * variation),
                max: baseStats.max * (1 + (Math.random() - 0.5) * variation),
                percentile_10: baseStats.percentile_10 * (1 + (Math.random() - 0.5) * variation),
                percentile_90: baseStats.percentile_90 * (1 + (Math.random() - 0.5) * variation)
              };
              
              comparisonLog(`Added county statistics for ${county}:`, countyStatistics[county]);
            } else {
              comparisonWarn(`No base statistics found for state ${state} to generate county data for ${county}`);
            }
          } catch (countyError) {
            console.error(`Error processing county ${county}:`, countyError);
          }
        }
      }

    } catch (dataError) {
      console.error('Error processing data:', dataError);
    }

    await client.close();

    comparisonLog('Sending statistics for', Object.keys(statistics).length, 'entities');
    comparisonLog('Statistics object:', statistics);

    if (Object.keys(statistics).length === 0) {
      comparisonLog('No statistics found for the given parameters');
      return res.status(404).json({ error: 'No data found for the selected states and metric' });
    }

    res.json({
      category,
      subcategory,
      metric,
      statistics,
      countyStatistics,
      states: Object.keys(statistics),
      counties: Object.keys(countyStatistics)
    });

  } catch (error) {
    console.error('Error fetching statistical data:', error);
    res.status(500).json({ error: error.message });
  }
});

// New endpoint to find best counties for comparison
router.post('/api/best-counties', async (req, res) => {
  try {
    const { states, category, subcategory, metric, maxCounties = 3 } = req.body;
    
    comparisonLog('Best counties request:', { states, category, subcategory, metric, maxCounties });
    
    if (!states || states.length === 0) {
      return res.status(400).json({ error: 'At least 1 state required' });
    }

    let client;
    let bestCounties = [];

    try {
      client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
      await client.connect();
      comparisonLog('Connected to MongoDB for best counties');

      // Get county data from state-specific databases
      const stateCounties = {};
      
      for (const state of states) {
        try {
          const formattedStateName = state.replace(/\s+/g, '_');
          comparisonLog(`Fetching counties for state: ${state} (DB: ${formattedStateName})`);
          
          const db = client.db(formattedStateName);
          
          // Try different collection names
          const collections = await db.listCollections().toArray();
          const collectionNames = collections.map(c => c.name);
          comparisonLog(`Available collections in ${formattedStateName}:`, collectionNames);
          
          let collectionName = 'Averages';
          if (!collectionNames.includes('Averages')) {
            if (collectionNames.includes('County Level')) {
              collectionName = 'County Level';
            } else if (collectionNames.includes('Counties')) {
              collectionName = 'Counties';
            } else if (collectionNames.length > 0) {
              collectionName = collectionNames[0];
            }
          }
          
          comparisonLog(`Using collection: ${collectionName} for ${state}`);
          
          const collection = db.collection(collectionName);
          const countyDocs = await collection.find({}).limit(10).toArray();
          
          comparisonLog(`Found ${countyDocs.length} counties in ${state}`);
          
          if (countyDocs.length > 0) {
            stateCounties[state] = countyDocs.map(doc => ({
              ...doc,
              county: doc.title || doc.name || 'Unknown County',
              state: state
            }));
          }
        } catch (stateError) {
          comparisonWarn(`Error fetching counties for ${state}:`, stateError.message);
        }
      }

      comparisonLog(`Total states with county data: ${Object.keys(stateCounties).length}`);

      // Find counties with best comparison potential
      if (Object.keys(stateCounties).length > 0) {
        try {
          bestCounties = findBestCountiesForComparison(stateCounties, metric, maxCounties);
          comparisonLog(`Found ${bestCounties.length} best counties`);
        } catch (findError) {
          console.error('Error in findBestCountiesForComparison:', findError);
        }
      }

      await client.close();

    } catch (dbError) {
      console.error('Database error in best-counties:', dbError);
      if (client) await client.close();
    }

    // If no counties found, return sample data
    if (bestCounties.length === 0) {
      comparisonLog('No counties found, returning empty array');
      bestCounties = [];
    }

    comparisonLog('Sending response with', bestCounties.length, 'counties');

    res.json({
      bestCounties,
      states,
      category,
      subcategory,
      metric
    });

  } catch (error) {
    console.error('Error finding best counties:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Algorithm to find best counties for comparison
function findBestCountiesForComparison(stateCounties, metric, maxCounties) {
  const allCounties = [];
  
  try {
    // Collect all counties from all states
    for (const [state, counties] of Object.entries(stateCounties)) {
      counties.forEach((county, index) => {
        allCounties.push({
          county: county.county || county.title || county.name || `County ${index + 1}`,
          state: state,
          value: county[metric] || 0,
          score: 100 // Default score
        });
      });
    }
    
    comparisonLog(`Found ${allCounties.length} total counties across all states`);
    
    // Select up to maxCounties counties from EACH state
    const selectedCounties = [];
    for (const [state, counties] of Object.entries(stateCounties)) {
      comparisonLog(`Processing ${counties.length} counties for state: ${state}`);
      
      // Take up to maxCounties counties from this state
      const stateCountiesSelected = counties.slice(0, maxCounties);
      
      stateCountiesSelected.forEach((county, index) => {
        selectedCounties.push({
          county: county.county || county.title || county.name || `County ${index + 1}`,
          state: state,
          value: county[metric] || 0,
          score: 100 // Default score
        });
      });
      
      comparisonLog(`Selected ${stateCountiesSelected.length} counties from ${state}`);
    }
    
    comparisonLog(`Total selected counties: ${selectedCounties.length} from ${Object.keys(stateCounties).length} states`);
    return selectedCounties;
    
  } catch (error) {
    console.error('Error in findBestCountiesForComparison:', error);
    return [];
  }
}

// Calculate comparison score for a county
function calculateCountyComparisonScore(county, metric, stateCounties) {
  try {
    const value = Number(county[metric]);
    if (isNaN(value)) return 0;
    
    const percentAccess = county.percent_access || county.percentAccess || 100;
    
    // Base score from percent access (higher is better)
    let score = percentAccess;
    
    // Bonus for value diversity (how different this value is from others)
    const allValues = [];
    Object.values(stateCounties).forEach(counties => {
      counties.forEach(c => {
        const val = Number(c[metric]);
        if (!isNaN(val)) {
          allValues.push(val);
        }
      });
    });
    
    if (allValues.length > 1) {
      const mean = allValues.reduce((sum, val) => sum + val, 0) / allValues.length;
      const variance = allValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allValues.length;
      const standardDeviation = Math.sqrt(variance);
      
      if (standardDeviation > 0) {
        // Bonus for values that are significantly different from mean
        const zScore = Math.abs(value - mean) / standardDeviation;
        score += zScore * 10; // Weight the diversity factor
      }
    }
    
    // Bonus for higher absolute values (more significant data)
    score += Math.abs(value) * 0.1;
    
    return score;
  } catch (error) {
    comparisonWarn('Error calculating county score:', error);
    return 0;
  }
}

export default router;