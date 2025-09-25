// routes/comparison.js
import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { HuggingFaceLlamaService } from '../services/huggingFaceService.js';
import { MongoClient } from 'mongodb';


const router = express.Router();

// Apply authentication middleware to all comparison routes
router.use(authenticate);

// Render comparison tool page
router.get('/', (req, res) => {
  res.render('comparison/index', { 
    title: 'Data Comparison',
    user: req.user 
  });
});

// Get available states for comparison
router.get('/api/states', async (req, res) => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    const db = client.db(process.env.DB_NAME);
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
    const db = client.db(process.env.DB_NAME);
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
    
    console.log('=== BACKEND DEBUG ===');
    console.log('Entities:', entities);
    console.log('EntityType:', entityType);

    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();
    
    const allData = {};

    // Get Transit Metrics (this stays the same)
    const transitDb = client.db(process.env.DB_NAME);
    const transitCollection = transitDb.collection('AverageValues');
    const transitMetrics = await transitCollection.find({}).toArray();
    allData.transit = extractTransitEntityData(transitMetrics, entities);
    console.log('Transit data extracted:', allData.transit.length, 'metrics');
    
    // Get Employment Data from Employment_Data database -> State Level collection
    const employmentDb = client.db('Employment_Data');
    const employmentCollection = employmentDb.collection('State Level');
    const employmentMetrics = await employmentCollection.find({}).toArray();
    console.log('Raw employment data from DB:', employmentMetrics.length, 'documents');
    allData.employment = extractEquityEntityData(employmentMetrics, entities);
    console.log('Employment data extracted:', allData.employment.length, 'metrics');
    
    // Get Income Data from Income_Data database -> State Level collection
    const incomeDb = client.db('Income_Data');
    const incomeCollection = incomeDb.collection('State Level');
    const incomeMetrics = await incomeCollection.find({}).toArray();
    console.log('Raw income data from DB:', incomeMetrics.length, 'documents');
    allData.income = extractEquityEntityData(incomeMetrics, entities);
    console.log('Income data extracted:', allData.income.length, 'metrics');
    
    // Get Race Data from Race_Data database -> State Level collection
    const raceDb = client.db('Race_Data');
    const raceCollection = raceDb.collection('State Level');
    const raceMetrics = await raceCollection.find({}).toArray();
    console.log('Raw race data from DB:', raceMetrics.length, 'documents');
    allData.race = extractEquityEntityData(raceMetrics, entities);
    console.log('Race data extracted:', allData.race.length, 'metrics');
    
    // Get Housing Data from Housing_Data database -> State Level collection
    const housingDb = client.db('Housing_Data');
    const housingCollection = housingDb.collection('State Level');
    const housingMetrics = await housingCollection.find({}).toArray();
    console.log('Raw housing data from DB:', housingMetrics.length, 'documents');
    allData.housing = extractEquityEntityData(housingMetrics, entities);
    console.log('Housing data extracted:', allData.housing.length, 'metrics');

    await client.close();

    // DEBUG: Log sample data
    console.log('Sample employment metric:', allData.employment[0]);
    console.log('Sample income metric:', allData.income[0]);

    // Generate AI report with ALL actual data for selected entities
    const llamaService = new HuggingFaceLlamaService();
    const report = await llamaService.generateDataDrivenReport(entities, allData, entityType);

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
  console.log('Processing equity documents for entities:', entities);
  
  // Find documents for each requested entity
  const results = [];
  
  // For each equity document, extract all the data fields
  equityDocuments.forEach(doc => {
    const stateName = doc.title;
    console.log('Processing equity document for state:', stateName);
    
    // Check if this state is in our requested entities
    if (entities.includes(stateName) && doc.data) {
      console.log('Found matching state with data:', stateName);
      
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
  
  console.log('Extracted equity metrics:', results.length);
  console.log('Sample equity metric:', results[0]);
  
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

    console.log(`Generating comprehensive AI report for ${entityType}: ${entities.join(', ')}`);

    const client = new MongoClient(process.env.MONGODB_URI || "mongodb+srv://prathamaggarwal20055:Bu%21%21dogs2024@transitacessibility.lvbdd.mongodb.net/?retryWrites=true&w=majority&appName=TransitAcessibility");
    await client.connect();

    let transitData = [];
    let equityData = {};
    let metricAnalysis = [];
    let chartData = [];

    if (entityType === 'states') {
      // Fetch all state-level transit data
      const db = client.db(process.env.DB_NAME);
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
              console.warn(`Could not fetch ${category} for ${entity}:`, error.message);
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

    // Generate comprehensive AI report using Hugging Face Llama
    const llamaService = new HuggingFaceLlamaService();
    const report = await llamaService.generateComprehensiveReport(entities, entityType, transitData, equityData, metricAnalysis);

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

    console.log('Fetching dotplot data for states:', states);

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
        console.log(`Processing equity database: ${equityDb.dbName}`);
        const db = client.db(equityDb.dbName);
        
        // Check available collections
        const collections = await db.listCollections().toArray();
        const collectionNames = collections.map(c => c.name);
        console.log(`Available collections in ${equityDb.dbName}:`, collectionNames);
        
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
        
        console.log(`Using collection: ${collectionName} in ${equityDb.dbName}`);
        const collection = db.collection(collectionName);
        
        // Find documents for the selected states
        const docs = await collection.find({ title: { $in: states } }).toArray();
        console.log(`Found ${docs.length} documents in ${equityDb.dbName}`);
        
        if (docs.length === 0) {
          // Try case-insensitive search
          const caseInsensitiveDocs = await collection.find({
            title: { $in: states.map(s => new RegExp(s, 'i')) }
          }).toArray();
          
          if (caseInsensitiveDocs.length > 0) {
            docs.push(...caseInsensitiveDocs);
            console.log(`Found ${caseInsensitiveDocs.length} documents with case-insensitive search`);
          }
        }
        
        if (docs.length === 0) continue;
        
        // Log sample document structure
        console.log(`Sample document from ${equityDb.dbName}:`, {
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
        
        console.log(`Found ${allLegends.length} legends in ${equityDb.dbName}`);
        
        // Create metrics array for this equity category
        const metrics = allLegends.map(legend => {
          const values = {};
          docs.forEach(doc => {
            const value = doc.data ? doc.data[legend] : doc[legend];
            if (value !== undefined && value !== null && !isNaN(Number(value))) {
              values[doc.title] = Number(value);
            }
          });
          return { legend, values };
        });
        
        const validMetrics = metrics.filter(m => Object.keys(m.values).length > 0);
        
        if (validMetrics.length > 0) {
          equity.push({
            category: equityDb.name,
            metrics: validMetrics
          });
        }
        
        console.log(`${equityDb.name}: ${validMetrics.length} valid metrics`);
        
      } catch (error) {
        console.warn(`Error processing ${equityDb.dbName}:`, error.message);
      }
    }

    // --- TRANSIT SECTION --- (Updated)
    const transit = [];
    
    try {
      const transitDb = client.db(process.env.DB_NAME || 'StateWiseComputation');
      const collections = await transitDb.listCollections().toArray();
      const collectionNames = collections.map(c => c.name);
      
      console.log('Available transit collections:', collectionNames);

      // Process AverageValues collection (special case)
      if (collectionNames.includes('AverageValues')) {
        console.log('Processing AverageValues collection');
        const avgCollection = transitDb.collection('AverageValues');
        const avgDocs = await avgCollection.find({}).toArray();
        
        // For AverageValues: titles become legends, states are values
        const legends = avgDocs.map(doc => doc.title);
        const metrics = legends.map(legend => {
          const values = {};
          const doc = avgDocs.find(d => d.title === legend);
          if (doc) {
            states.forEach(state => {
              if (doc[state] !== undefined && doc[state] !== null && !isNaN(Number(doc[state]))) {
                values[state] = Number(doc[state]);
              }
            });
          }
          return { legend, values };
        });
        
        const validMetrics = metrics.filter(m => Object.keys(m.values).length > 0);
        
        if (validMetrics.length > 0) {
          transit.push({
            category: 'Average Values',
            metrics: validMetrics
          });
        }
        
        console.log(`AverageValues processed: ${validMetrics.length} metrics`);
      }

      // Process other collections - ENHANCED LOGIC for proper legend updates
      for (const collectionName of collectionNames) {
        if (['AverageValues', 'system.indexes'].includes(collectionName)) continue;
        
        try {
          console.log(`Processing transit collection: ${collectionName}`);
          const collection = transitDb.collection(collectionName);
          
          // Get all documents in the collection
          const allDocs = await collection.find({}).toArray();
          
          if (allDocs.length === 0) {
            console.log(`No documents found in ${collectionName}`);
            continue;
          }
          
          console.log(`Total documents in ${collectionName}:`, allDocs.length);
          console.log(`Sample document titles:`, allDocs.slice(0, 5).map(d => d.title));
          
          // Create a map of state names to their documents
          const stateDocMap = {};
          
          // For each state, find the best matching document
          states.forEach(state => {
            // Try exact match first
            let stateDoc = allDocs.find(doc => 
              doc.title && doc.title.toLowerCase().trim() === state.toLowerCase().trim()
            );
            
            // If no exact match, try partial match
            if (!stateDoc) {
              stateDoc = allDocs.find(doc => 
                doc.title && (
                  doc.title.toLowerCase().includes(state.toLowerCase()) ||
                  state.toLowerCase().includes(doc.title.toLowerCase())
                )
              );
            }
            
            if (stateDoc) {
              stateDocMap[state] = stateDoc;
              console.log(`Matched ${state} to document: ${stateDoc.title}`);
            } else {
              console.warn(`No document found for state: ${state}`);
            }
          });
          
          console.log(`Found documents for ${Object.keys(stateDocMap).length} out of ${states.length} states`);
          
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
          console.log(`Found ${allLegends.length} valid numeric legends in ${collectionName}:`, allLegends.slice(0, 5));
          
          // Create metrics for each legend - FIXED to ensure proper state mapping
          const metrics = allLegends.map(legend => {
            const values = {};
            
            // For each state, get the value from its matched document
            states.forEach(state => {
              const stateDoc = stateDocMap[state];
              if (stateDoc && stateDoc[legend] !== undefined && stateDoc[legend] !== null) {
                const value = Number(stateDoc[legend]);
                if (!isNaN(value)) {
                  values[state] = value;
                  console.log(`${collectionName} - ${legend} - ${state}: ${value}`);
                }
              }
            });
            
            return { legend, values };
          });
          
          // Only keep metrics that have data for at least one state
          const validMetrics = metrics.filter(m => Object.keys(m.values).length > 0);
          
          console.log(`${collectionName} - Valid metrics: ${validMetrics.length}`);
          validMetrics.forEach(m => {
            console.log(`  ${m.legend}: ${Object.keys(m.values).length} states have data`);
          });
          
          if (validMetrics.length > 0) {
            transit.push({
              category: collectionName,
              metrics: validMetrics
            });
          }
          
          console.log(`${collectionName} processed: ${validMetrics.length} valid metrics`);
          
        } catch (error) {
          console.warn(`Error processing transit collection ${collectionName}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('Error processing transit data:', error.message);
    }

    await client.close();

    console.log('Final result summary:');
    console.log(`Equity categories: ${equity.length}`);
    console.log(`Transit categories: ${transit.length}`);
    
    // Log sample data for debugging
    equity.forEach((cat, i) => {
      console.log(`Equity[${i}] - ${cat.category}: ${cat.metrics.length} metrics`);
      if (cat.metrics.length > 0) {
        console.log(`  Sample metric: ${cat.metrics[0].legend}, values:`, Object.keys(cat.metrics[0].values));
      }
    });
    
    transit.forEach((cat, i) => {
      console.log(`Transit[${i}] - ${cat.category}: ${cat.metrics.length} metrics`);
      if (cat.metrics.length > 0) {
        console.log(`  Sample metric: ${cat.metrics[0].legend}, values:`, Object.keys(cat.metrics[0].values));
      }
    });

    res.json({ equity, transit });
    
  } catch (error) {
    console.error('Error generating comparison dotplot data:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;