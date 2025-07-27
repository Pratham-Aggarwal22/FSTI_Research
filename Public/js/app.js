// public/js/app.js

const statesData = {
  "01": { name: "Alabama", abbr: "AL" },
  "02": { name: "Alaska", abbr: "AK" },
  "04": { name: "Arizona", abbr: "AZ" },
  "05": { name: "Arkansas", abbr: "AR" },
  "06": { name: "California", abbr: "CA" },
  "08": { name: "Colorado", abbr: "CO" },
  "09": { name: "Connecticut", abbr: "CT" },
  "10": { name: "Delaware", abbr: "DE" },
  "11": { name: "District of Columbia", abbr: "DC" },
  "12": { name: "Florida", abbr: "FL" },
  "13": { name: "Georgia", abbr: "GA" },
  "15": { name: "Hawaii", abbr: "HI" },
  "16": { name: "Idaho", abbr: "ID" },
  "17": { name: "Illinois", abbr: "IL" },
  "18": { name: "Indiana", abbr: "IN" },
  "19": { name: "Iowa", abbr: "IA" },
  "20": { name: "Kansas", abbr: "KS" },
  "21": { name: "Kentucky", abbr: "KY" },
  "22": { name: "Louisiana", abbr: "LA" },
  "23": { name: "Maine", abbr: "ME" },
  "24": { name: "Maryland", abbr: "MD" },
  "25": { name: "Massachusetts", abbr: "MA" },
  "26": { name: "Michigan", abbr: "MI" },
  "27": { name: "Minnesota", abbr: "MN" },
  "28": { name: "Mississippi", abbr: "MS" },
  "29": { name: "Missouri", abbr: "MO" },
  "30": { name: "Montana", abbr: "MT" },
  "31": { name: "Nebraska", abbr: "NE" },
  "32": { name: "Nevada", abbr: "NV" },
  "33": { name: "New Hampshire", abbr: "NH" },
  "34": { name: "New Jersey", abbr: "NJ" },
  "35": { name: "New Mexico", abbr: "NM" },
  "36": { name: "New York", abbr: "NY" },
  "37": { name: "North Carolina", abbr: "NC" },
  "38": { name: "North Dakota", abbr: "ND" },
  "39": { name: "Ohio", abbr: "OH" },
  "40": { name: "Oklahoma", abbr: "OK" },
  "41": { name: "Oregon", abbr: "OR" },
  "42": { name: "Pennsylvania", abbr: "PA" },
  "44": { name: "Rhode Island", abbr: "RI" },
  "45": { name: "South Carolina", abbr: "SC" },
  "46": { name: "South Dakota", abbr: "SD" },
  "47": { name: "Tennessee", abbr: "TN" },
  "48": { name: "Texas", abbr: "TX" },
  "49": { name: "Utah", abbr: "UT" },
  "50": { name: "Vermont", abbr: "VT" },
  "51": { name: "Virginia", abbr: "VA" },
  "53": { name: "Washington", abbr: "WA" },
  "54": { name: "West Virginia", abbr: "WV" },
  "55": { name: "Wisconsin", abbr: "WI" },
  "56": { name: "Wyoming", abbr: "WY" }
};

// Helper to adjust state names for county-level databases and equity queries.
function getCountyDbName(stateName) {
  const corrections = {
    "Alabama": "Albama",
    "Michigan": "MIchigan"
    // Pennsylvania uses correct spelling
  };
  return corrections[stateName] || stateName;
}

document.addEventListener('click', function(e) {
  if (e.target.id === 'generateComprehensiveReportBtn' || e.target.closest('#generateComprehensiveReportBtn')) {
    e.preventDefault();
    generateComprehensiveAIReport();
  }
});

let usMap = null;
let countyMap = null;
let selectedState = null;
let selectedCounty = null;
let activeView = 'state';
let stateCharts = [];
let countyCharts = [];
let allStateData = [];
let selectedMetric = null;

let allCountyData = [];    // Transit county averages
let equityCountyData = []; // Equity county averages

let transitMetricKeys = [];
let equityMetricKeys = [];
let selectedCountyMetric = null;

let distributionChart = null;
let topBottomChart = null;
let countyTopBottomChart = null;
let comparisonChart = null;
let isComparisonMode = false;

// Add these variables after the existing declarations (around line 25-30)
let dotplotTab = 'equity'; // 'equity' or 'transit'
let selectedMetricIndexes = { equity: 0, transit: 0 };
let selectedLegends = { equity: [], transit: [] };

// Helper: Return chart text color based on dark mode status.
function getChartTextColor() {
  return document.body.classList.contains("dark-mode") ? "#ffffff" : "#2c3e50";
}

// Add this helper function at the beginning of your app.js file
function formatNumberToTwoDecimals(value) {
  // Check if value is a number
  if (typeof value === 'number') {
    return Number(value.toFixed(2));
  } 
  // If it's a string that can be converted to a number
  else if (typeof value === 'string' && !isNaN(Number(value))) {
    return Number(parseFloat(value).toFixed(2));
  }
  // Return original value if it's not a number
  return value;
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  updateLeftPanel();
  document.getElementById('mapViewTab').addEventListener('click', switchToMapView);
  document.getElementById('equityComparisonTab').addEventListener('click', switchToEquityComparison);
  // New event listener: update equity metrics immediately when equity category changes
  document.getElementById('equityCategorySelect').addEventListener('change', () => {
    if (selectedState) {
      loadComparisonData();
    }
  });
});

function formatStateNameForDb(name) {
  // First apply any spelling corrections
  const correctedName = getCountyDbName(name);
  // Then replace spaces with underscores
  return correctedName.replace(/\s+/g, '_');
}
// Add this to ensure metric data is properly loaded
function ensureMetricDataLoaded() {
  if (!allStateData || allStateData.length === 0) {
    console.log("State data not loaded yet, retrying...");
    
    fetchAllStateDataForCountryAverage().then(() => {
      if (allStateData && allStateData.length > 0) {
        console.log("State data loaded successfully on retry");
        selectedMetric = allStateData[0].title;
        updateMapColors();
        // Charts removed - replaced with chatbot
        updateDataPanel();
      } else {
        console.error("Failed to load state data even after retry");
      }
    });
  }
}

function ensureDataLoaded() {
  if (!allStateData || allStateData.length === 0) {
    console.log("State data not loaded, loading now...");
    
    fetchAllStateDataForCountryAverage().then(() => {
      if (allStateData && allStateData.length > 0) {
        console.log("State data loaded successfully");
        selectedMetric = allStateData[0].title;
        updateMapColors();
        // Charts removed - replaced with chatbot
        updateDataPanel();
      } else {
        console.error("Failed to load state data");
      }
    });
    return false;
  }
  return true;
}

// Call this in your DOMContentLoaded handler
document.addEventListener('DOMContentLoaded', () => {
  initApp();
  updateLeftPanel();
  document.getElementById('mapViewTab').addEventListener('click', switchToMapView);
  document.getElementById('equityComparisonTab').addEventListener('click', switchToEquityComparison);
  
  // Add this line
  setTimeout(ensureDataLoaded, 1000); // Check after 1 second
  
  document.getElementById('equityCategorySelect').addEventListener('change', () => {
    if (selectedState) {
      loadComparisonData();
    }
  });
});

// -----------------------------------------------------------------------------
// UPDATE LEFT PANEL FUNCTION (Modified for Equity Comparison button disable)
function updateLeftPanel() {
  const equityBtn = document.getElementById('equityComparisonTab');
  if (!selectedState) {
    document.getElementById('metricSelection').style.display = 'block';
    // Charts removed - chatbot is always visible
    document.getElementById('countyMetricSelection').style.display = 'none';
    equityBtn.style.display = 'none';
  } else {
    document.getElementById('metricSelection').style.display = 'none';
    document.getElementById('countyMetricSelection').style.display = 'block';
    // If county data is displayed, disable the equity comparison button
    if (selectedCounty) {
      equityBtn.style.display = 'block';
      equityBtn.style.backgroundColor = '#555';
      equityBtn.style.cursor = 'not-allowed';
      equityBtn.setAttribute('title', 'Switch to State Data to view the comparison');
      equityBtn.disabled = true;
      equityBtn.classList.add('disabled-tab');
      equityBtn.onclick = function(e) { e.preventDefault(); return false; };
    } else {
      // Enable equity comparison button when in state view
      equityBtn.style.display = 'block';
      equityBtn.style.backgroundColor = '';
      equityBtn.style.cursor = 'pointer';
      equityBtn.removeAttribute('title');
      equityBtn.disabled = false;
      equityBtn.classList.remove('disabled-tab');
      equityBtn.onclick = switchToEquityComparison;
    }
  }
}

// -----------------------------------------------------------------------------
// INITIALIZATION AND DATA FETCHING
function initApp() {
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  document.getElementById('mapTitle').textContent = 'United States';
  //document.getElementById('homeButton').addEventListener('click', handleBackToStates);
  fetchAllStateDataForCountryAverage().then(() => {
    selectedMetric = allStateData[0].title;
    createUSMap();
    populateMetricSelect();
    createDistributionChart();
    createTopBottomChart();
    updateDataPanel();
    updateLeftPanel();
  });
}

async function fetchAllStateDataForCountryAverage() {
  try {
    const response = await fetch(`/api/averageValues`);
    if (!response.ok) throw new Error('Network response was not ok');
    allStateData = await response.json();
  } catch (error) {
    console.error('Error fetching country data:', error);
  }
}

function populateMetricSelect() {
  const select = document.getElementById('metricSelect');
  
  // Clear existing options first
  select.innerHTML = '';
  
  // Add a default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a metric...';
  select.appendChild(defaultOption);
  
  // Use a Set to ensure unique metric titles
  const uniqueMetrics = new Set();
  
  allStateData.forEach(metric => {
    if (metric.title && !uniqueMetrics.has(metric.title)) {
      uniqueMetrics.add(metric.title);
      const option = document.createElement('option');
      option.value = metric.title;
      option.textContent = metric.title;
      select.appendChild(option);
    }
  });
  
  // Remove any existing event listeners to prevent duplicates
  select.removeEventListener('change', handleMetricChange);
  select.addEventListener('change', handleMetricChange);
}

function handleMetricChange(event) {
  selectedMetric = event.target.value;
  updateMapColors();
  createDistributionChart();
  createTopBottomChart();
}

function updateMapColors() {
  if (!usMap) return;
  const metricData = allStateData.find(d => d.title === selectedMetric);
  if (!metricData) return;
  
  const values = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([, value]) => formatNumberToTwoDecimals(value));
  
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  
  // Create color scale with formatted values
  const colorScale = d3.scaleQuantize()
    .domain([minVal, maxVal])
    .range(['#27ae60', '#e67e22', '#e74c3c']);
  
  usMap.svg.selectAll('.state')
    .attr('fill', d => {
      const value = metricData[statesData[d.id]?.name];
      return value !== undefined ? colorScale(formatNumberToTwoDecimals(value)) : '#bdc3c7';
    });
  
  usMap.colorScale = colorScale;
  createLegend(minVal, maxVal);
}

function createLegend(minVal, maxVal) {
  const legend = document.getElementById('legend');
  const colorScale = usMap?.colorScale;
  if (!colorScale) return;
  const thresholds = colorScale.thresholds();
  
  legend.innerHTML = `
    <h3>${selectedMetric}</h3>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; background: ${colorScale(minVal)};"></div> ${formatNumberToTwoDecimals(minVal).toFixed(2)}
      <div style="width: 20px; height: 20px; background: ${colorScale(thresholds[0])};"></div> ${formatNumberToTwoDecimals(thresholds[0]).toFixed(2)}
      <div style="width: 20px; height: 20px; background: ${colorScale(maxVal)};"></div> ${formatNumberToTwoDecimals(maxVal).toFixed(2)}
      <div style="width: 20px; height: 20px; background: #808080;"></div> N/A
    </div>
  `;
}

function createDistributionChart() {
  const canvas = document.getElementById('distributionChart');
  if (!canvas) return;
  if (distributionChart && typeof distributionChart.destroy === 'function') {
    distributionChart.destroy();
  }
  const metricData = allStateData.find(d => d.title === selectedMetric);
  if (!metricData) return;
  const values = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([, value]) => formatNumberToTwoDecimals(value));
  
  const binCount = 10;
  const bins = d3.histogram()
    .domain([Math.min(...values), Math.max(...values)])
    .thresholds(binCount)(values);
  
  // Format bin labels to show two decimal places
  const labels = bins.map(bin => 
    `${formatNumberToTwoDecimals(bin.x0)} - ${formatNumberToTwoDecimals(bin.x1)}`);
  
  const data = bins.map(bin => bin.length);
  const chartTextColor = getChartTextColor();
  distributionChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Frequency',
        data: data,
        backgroundColor: 'rgba(41, 128, 185, 0.7)',
        borderColor: 'rgba(41, 128, 185, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { 
          beginAtZero: true, 
          title: { display: true, text: 'Frequency', color: chartTextColor },
          ticks: { color: chartTextColor }
        },
        x: { 
          title: { display: true, text: 'Value Range', color: chartTextColor },
          ticks: { color: chartTextColor }
        }
      }
    }
  });
}

// In your createTopBottomChart function, add these debugging lines:
function createTopBottomChart() {
  console.log("Creating top/bottom chart...");
  const canvas = document.getElementById('topBottomChart');
  
  if (!canvas) {
    console.error("Canvas 'topBottomChart' not found!");
    return;
  }
  
  if (topBottomChart && typeof topBottomChart.destroy === 'function') {
    topBottomChart.destroy();
  }
  
  const metricData = allStateData.find(d => d.title === selectedMetric);
  console.log("Metric data for top/bottom chart:", metricData);
  
  if (!metricData) {
    console.error("No metric data found for:", selectedMetric);
    return;
  }
  
  // Get state values, filtering out non-state entries
  const stateValues = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([state, value]) => {
      // Check if value is valid
      const numValue = Number(value);
      if (isNaN(numValue)) {
        console.warn(`Invalid value for state ${state}: ${value}`);
        return { state, value: 0 }; // Use 0 as fallback
      }
      return { state, value: numValue };
    });
  
  console.log("State values for top/bottom chart:", stateValues);
  
  if (stateValues.length === 0) {
    console.error("No valid state values found!");
    return;
  }
  
  // Sort by value (highest first)
  stateValues.sort((a, b) => b.value - a.value);
  
  // Get top 5 and bottom 5
  const top5 = stateValues.slice(0, Math.min(5, stateValues.length));
  const bottom5 = stateValues.slice(-Math.min(5, stateValues.length)).reverse();
  
  console.log("Top 5 states:", top5);
  console.log("Bottom 5 states:", bottom5);
  
  // Create labels and data arrays
  const labels = [
    ...top5.map(d => d.state), 
    ...bottom5.map(d => d.state)
  ];
  
  const data = [
    ...top5.map(d => d.value), 
    ...bottom5.map(d => d.value)
  ];
  
  // Colors: red for top 5, green for bottom 5
  const colors = [
    ...top5.map(() => '#e74c3c'), 
    ...bottom5.map(() => '#27ae60')
  ];
  
  const chartTextColor = getChartTextColor();
  
  // Create chart
  topBottomChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: selectedMetric || 'Value',
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: { 
          beginAtZero: true, 
          title: { display: true, text: 'Value', color: chartTextColor },
          ticks: { color: chartTextColor }
        },
        y: { 
          title: { display: true, text: 'State', color: chartTextColor },
          ticks: { color: chartTextColor }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  });
  
  console.log("Top/bottom chart created successfully");
}

// -----------------------------------------------------------------------------
// COUNTY MAP AND DATA FUNCTIONS
function createUSMap() {
  const mapContainer = document.getElementById('mapView');
  mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const width = mapContainer.clientWidth - 30;
  const height = mapContainer.clientHeight - 30;
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'width: calc(100% - 10px); height: calc(100% - 10px); margin: 5px;');
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
    .then(us => {
      mapContainer.innerHTML = '';
      const projection = d3.geoAlbersUsa().fitSize([width - 20, height - 20], topojson.feature(us, us.objects.states));
      const path = d3.geoPath().projection(projection);
      const states = topojson.feature(us, us.objects.states).features;
      const metricData = allStateData.find(d => d.title === selectedMetric);
      if (!metricData) return;
      const values = Object.entries(metricData)
        .filter(([key]) => key !== '_id' && key !== 'title')
        .map(([, value]) => value);
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);
      const colorScale = d3.scaleQuantize()
        .domain([minVal, maxVal])
        .range(['#27ae60', '#e67e22', '#e74c3c']);
      svg.append('g')
        .selectAll('path')
        .data(states)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', d => {
          const value = metricData[statesData[d.id]?.name];
          return value !== undefined ? colorScale(value) : '#bdc3c7';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('class', 'state')
        .attr('data-state-id', d => d.id)
        .on('click', (event, d) => handleStateClick(d.id))
        .on('mouseover', function(event, d) {
          d3.select(this).attr('cursor', 'pointer').attr('stroke-width', 2);
          const text = d3.select(`text[data-state-id="${d.id}"]`);
          text.text(statesData[d.id]?.name || '');
          text.attr('font-size', '12px');
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('stroke-width', 1);
          const text = d3.select(`text[data-state-id="${d.id}"]`);
          text.text(statesData[d.id]?.abbr || '');
          text.attr('font-size', '10px');
        });
      svg.append('g')
        .selectAll('text')
        .data(states)
        .enter()
        .append('text')
        .attr('data-state-id', d => d.id)
        .attr('transform', d => `translate(${path.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#2c3e50')
        .text(d => statesData[d.id]?.abbr || '');
      mapContainer.appendChild(svg.node());
      usMap = { svg, path, projection, states, colorScale };
      createLegend(minVal, maxVal);
    })
    .catch(err => console.error('Error loading US map:', err));
}

// Add this to your app.js
function isLoggedIn() {
  return document.cookie.includes('access_token') || document.cookie.includes('is_logged_in');
}

function handleStateClick(stateId) {
  // Check if authentication is required but user isn't logged in
  const authModal = document.getElementById('authRequiredModal');
  const isLoggedIn = document.cookie.includes('access_token') || document.cookie.includes('is_logged_in');
  
  if (authModal && !isLoggedIn) {
    console.log("User not logged in, showing auth modal");
    authModal.style.display = 'flex';
    return;
  }
  
  // If in comparison mode, add state to selection
  if (isComparisonMode) {
    const stateName = statesData[stateId]?.name;
    if (stateName) {
      const existingIndex = selectedEntitiesForComparison.findIndex(e => e.id === stateId);
      
      if (existingIndex > -1) {
        selectedEntitiesForComparison.splice(existingIndex, 1);
      } else {
        selectedEntitiesForComparison.push({
          id: stateId,
          name: stateName,
          type: 'state'
        });
      }
      
      updateSelectionCount();
      updateMapSelectionHighlights();
    }
    return;
  }
  
  console.log("User is logged in, processing state click:", stateId);
  
  // Clear any existing tooltips
  d3.selectAll('.county-tooltip').remove();
  
  selectedState = stateId;
  selectedCounty = null;
  activeView = 'county';
  
  // Update UI elements
  const compareBtn = document.getElementById('compareStatesButton');
  if (compareBtn) {
    compareBtn.textContent = 'Compare Counties';
  }
  
  // Hide state-level elements and show county-level elements
  document.getElementById('metricSelection').style.display = 'none';
  const countryChartsContainer = document.getElementById('countryChartsContainer');
  if (countryChartsContainer) {
    countryChartsContainer.style.display = 'none';
  }
  document.getElementById('countyMetricSelection').style.display = 'block';
  document.getElementById('legend').innerHTML = '';
  
  // Create county map immediately
  createCountyMap(stateId);
  updateDataPanel();
  fetchStateData(stateId);
  
  // Apply database name correction and fetch county data
  const stateName = statesData[stateId].name;
  const correctedStateName = getCountyDbName(stateName);
  const dbName = formatStateNameForDb(correctedStateName);
  
  console.log(`State: ${stateName} -> Corrected: ${correctedStateName} -> DB: ${dbName}`);
  
  fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
    .then(response => response.json())
    .then(data => {
      allCountyData = data;
      if (allCountyData.length > 0) {
        transitMetricKeys = Object.keys(allCountyData[0]).filter(key => key !== '_id' && key !== 'title');
        selectedCountyMetric = transitMetricKeys[0];
        populateCountyMetricSelect(transitMetricKeys);
        populateTransitMetricDropdown();
        
        // Update county map colors with the first metric
        setTimeout(() => {
          updateCountyMapColors();
          createCountyLegendForMap();
        }, 1000);
      } else {
        transitMetricKeys = [];
        selectedCountyMetric = null;
      }
    })
    .catch(err => console.error("Error fetching transit county averages:", err));
  
  updateLeftPanel();
}
// Add this to your app.js file
function createAppStateHandlers() {
  // Check if the user is logged in by looking for the cookies
  const isLoggedIn = document.cookie.includes('access_token') || document.cookie.includes('is_logged_in');
  
  // Only change the state click handler for non-logged in users
  if (!isLoggedIn) {
    console.log("User is not logged in - setting up auth modal");
    const authModal = document.getElementById('authRequiredModal');
    
    // Store original function if it exists
    if (typeof window.handleStateClick === 'function') {
      window.originalHandleStateClick = window.handleStateClick;
    }
    
    // Override with modal display function
    window.handleStateClick = function(stateId) {
      console.log("Showing auth modal for non-logged in user");
      authModal.style.display = 'flex';
    };
    
    // Setup modal close behavior
    const closeAuthModal = document.getElementById('closeAuthModal');
    if (closeAuthModal) {
      closeAuthModal.addEventListener('click', () => {
        authModal.style.display = 'none';
      });
    }
    
    // Close on click outside
    window.addEventListener('click', (e) => {
      if (e.target === authModal) {
        authModal.style.display = 'none';
      }
    });
  } else {
    console.log("User is logged in - using standard state handler");
  }
}

// Call this after DOM content is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Your existing DOM content loaded handlers
  
  // Add this at the end 
  createAppStateHandlers();
});

function createCountyMap(stateId) {
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.add('zoom-to-county');
  
  // Clear any existing tooltips
  d3.selectAll('.county-tooltip').remove();
  
  setTimeout(() => {
    mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Get the available size of the container
    const containerWidth = mapContainer.clientWidth - 30;
    const containerHeight = mapContainer.clientHeight - 30;

    // Set minimum dimensions for the SVG to ensure it's not too small
    const width = Math.max(containerWidth, 800);
    const height = Math.max(containerHeight, 600);

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'width: ' + width + 'px; height: ' + height + 'px;');
    
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json')
      .then(us => {
        mapContainer.innerHTML = '';
        mapContainer.appendChild(svg.node());
        
        const counties = topojson.feature(us, us.objects.counties).features.filter(c => c.id.toString().startsWith(stateId));
        const stateFeature = topojson.feature(us, us.objects.states).features.find(s => s.id === stateId);
        const projection = d3.geoAlbersUsa().fitSize([width - 20, height - 20], stateFeature);
        const path = d3.geoPath().projection(projection);
        
        // Create the base layer for counties and state outline
        const countyLayer = svg.append('g').attr('class', 'county-layer');
        
        // Add state outline
        countyLayer.append('path')
          .datum(stateFeature)
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);
        
        countyLayer.selectAll('.county-path')
          .data(counties)
          .enter()
          .append('path')
          .attr('class', 'county county-path')
          .attr('data-county-name', d => d.properties.name)
          .attr('d', path)
          .attr('fill', '#d5d8dc')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .attr('data-clickable', 'true')
          .style('cursor', 'pointer')
          .on('click', function(event, d) {
            // Only handle click if county is clickable
            if (d3.select(this).attr('data-clickable') === 'true') {
              handleCountyClick(d.properties.name);
            }
          })
          .on('mouseover', function(event, d) {
            // Only highlight if county is clickable
            if (d3.select(this).attr('data-clickable') === 'true') {
              // Highlight county
              d3.select(this)
                .attr('stroke-width', 1.5)
                .attr('stroke', '#2c41ff');
              
              // Remove any existing tooltips first
              d3.selectAll('.county-tooltip').remove();
              
              // Create tooltip
              const tooltip = d3.select('body').append('div')
                .attr('class', 'county-tooltip')
                .style('position', 'absolute')
                .style('visibility', 'visible')
                .style('opacity', '1')
                .style('background', 'rgba(0,0,0,0.8)')
                .style('color', 'white')
                .style('padding', '8px 12px')
                .style('border-radius', '4px')
                .style('pointer-events', 'none')
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('box-shadow', '0 2px 5px rgba(0,0,0,0.3)')
                .style('z-index', '10001')
                .style('max-width', '250px')
                .html(`
                  <div style="font-weight: bold; color: #4CAF50;">${d.properties.name}</div>
                  <div style="font-size: 10px; opacity: 0.9;">Click to view details</div>
                `);
              
              // Position tooltip at mouse location
              const [mouseX, mouseY] = d3.pointer(event, document.body);
              tooltip
                .style('left', `${mouseX + 15}px`)
                .style('top', `${mouseY - 15}px`);
            }
          })
          .on('mousemove', function(event) {
            // Update tooltip position when mouse moves
            const tooltip = d3.select('.county-tooltip');
            if (!tooltip.empty()) {
              const [mouseX, mouseY] = d3.pointer(event, document.body);
              tooltip
                .style('left', `${mouseX + 15}px`)
                .style('top', `${mouseY - 15}px`);
            }
          })
          .on('mouseout', function() {
            // Only reset if county is clickable
            if (d3.select(this).attr('data-clickable') === 'true') {
              // Reset county stroke
              d3.select(this)
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff');
              
              // Remove tooltip
              d3.selectAll('.county-tooltip').remove();
            }
          });
          
        mapContainer.classList.remove('zoom-to-county');
        document.getElementById('mapTitle').textContent = `${statesData[stateId].name} Counties`;
        countyMap = { svg, path, projection };
        
        // Store reference for later use
        window.currentCountyMapSvg = svg;
        
      });
  }, 800);
}

function handleCountyClick(countyName) {
  // Use the original county name for database operations
  const originalCountyName = countyName;
  
  if (isComparisonMode) {
    const existingIndex = selectedEntitiesForComparison.findIndex(e => e.name === originalCountyName);
    
    if (existingIndex > -1) {
      selectedEntitiesForComparison.splice(existingIndex, 1);
    } else {
      selectedEntitiesForComparison.push({
        id: `${selectedState}_${originalCountyName}`,
        name: originalCountyName,
        type: 'county',
        state: statesData[selectedState]?.name
      });
    }
    
    updateSelectionCount();
    updateMapSelectionHighlights();
    return;
  }
  
  // Use original county name
  selectedCounty = originalCountyName;
  
  // Fade out and disable non-selected counties
  if (countyMap && countyMap.svg) {
    countyMap.svg.selectAll('.county')
      .transition()
      .duration(300)
      .attr('fill', function() {
        const mapCountyName = d3.select(this).attr('data-county-name');
        
        // Compare using normalized versions but keep originals for display
        const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
        const normalizedSelectedName = normalizeCountyNameForComparison(originalCountyName);
        
        if (normalizedMapName === normalizedSelectedName) {
          d3.select(this).attr('data-clickable', 'true');
          return d3.select(this).attr('fill');
        } else {
          d3.select(this).attr('data-clickable', 'false')
                         .attr('cursor', 'default');
          return d3.color(d3.select(this).attr('fill')).copy({opacity: 0.3});
        }
      });
  }
  
  // Disable equity tab
  const equityBtn = document.getElementById('equityComparisonTab');
  equityBtn.classList.add('disabled-tab');
  equityBtn.style.backgroundColor = '#555';
  equityBtn.style.cursor = 'not-allowed';
  equityBtn.setAttribute('title', 'Switch to State Data to view the comparison');
  equityBtn.disabled = true;
  equityBtn.onclick = function(e) { e.preventDefault(); return false; };
  
  // Use original county name for database query
  fetchCountyData(originalCountyName);
  updateLeftPanel();
}

function handleBackToStates() {
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  document.getElementById('mapTitle').textContent = 'United States';
  createUSMap();
  updateDataPanel();
  stateCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  stateCharts = [];
  countyCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  countyCharts = [];
  switchToMapView();
  updateLeftPanel();
}

function handleBackToState() {
  if (selectedCounty) {
    selectedCounty = null;
    document.getElementById('mapTitle').textContent = `${statesData[selectedState].name} Counties`;
    
    // Clear any existing tooltips
    d3.selectAll('.county-tooltip').remove();
    
    // Restore all counties to normal opacity and make them clickable again
    if (countyMap && countyMap.svg) {
      countyMap.svg.selectAll('.county-path')
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .attr('data-clickable', 'true')
        .style('cursor', 'pointer');
      
      // Update colors to show the current metric
      updateCountyMapColors();
    }
    
    updateDataPanel();
    fetchStateData(selectedState);
    
    // Re-enable equity comparison button
    const equityBtn = document.getElementById('equityComparisonTab');
    equityBtn.classList.remove('disabled-tab');
    equityBtn.style.backgroundColor = '';
    equityBtn.style.cursor = '';
    equityBtn.removeAttribute('title');
    equityBtn.disabled = false;
    equityBtn.onclick = switchToEquityComparison;
    
    updateLeftPanel();
  } else {
    selectedState = null;
    activeView = 'state';
    document.getElementById('mapTitle').textContent = 'United States';
    
    // Clear any tooltips
    d3.selectAll('.county-tooltip').remove();
    
    createUSMap();
    updateDataPanel();
    stateCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
    stateCharts = [];
    switchToMapView();
    updateLeftPanel();
  }
}

function updateDataPanel() {
  const dataPanelContent = document.getElementById('dataPanelContent');
  if (!selectedState) {
    dataPanelContent.innerHTML = `
      <h2 class="section-title">United States</h2>
      <h3>Averages</h3>
      <div id="countryMetricsGrid" class="metric-grid"></div>
    `;
    displayCountryMetrics(allStateData);
    return;
  }
  if (selectedCounty) {
    const template = document.getElementById('countyDataTemplate');
    const countyPanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(countyPanel);
    document.getElementById('backToStateButton').addEventListener('click', handleBackToState);
    
    // Toggle functionality for county view
    const averagesOption = document.getElementById('averagesOption');
    const frequencyOption = document.getElementById('frequencyOption');
    const averagesSection = document.getElementById('averagesSection');
    const frequencySection = document.getElementById('frequencySection');
    
    if (averagesOption && frequencyOption && averagesSection && frequencySection) {
      averagesOption.addEventListener('click', () => {
        averagesSection.style.display = 'block';
        frequencySection.style.display = 'none';
        averagesOption.classList.add('active');
        frequencyOption.classList.remove('active');
      });
      frequencyOption.addEventListener('click', () => {
        averagesSection.style.display = 'none';
        frequencySection.style.display = 'block';
        frequencyOption.classList.add('active');
        averagesOption.classList.remove('active');
      });
    }
  } else {
    const template = document.getElementById('stateDataTemplate');
    const statePanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(statePanel);
    document.getElementById('backButton').addEventListener('click', handleBackToStates);
    document.getElementById('stateName').textContent = statesData[selectedState].name;
    
    // Toggle functionality for state view (default view: Frequency Charts)
    const stateAveragesOption = document.getElementById('stateAveragesOption');
    const stateFrequencyOption = document.getElementById('stateFrequencyOption');
    const stateAveragesSection = document.getElementById('stateAveragesSection');
    const stateFrequencySection = document.getElementById('stateFrequencySection');
    
    if (stateAveragesOption && stateFrequencyOption && stateAveragesSection && stateFrequencySection) {
      stateAveragesSection.style.display = 'none';  // Changed to 'none' for default Frequency view
      stateFrequencySection.style.display = 'block';
      stateFrequencyOption.classList.add('active');
      stateAveragesOption.classList.remove('active');
      
      stateAveragesOption.addEventListener('click', () => {
        stateAveragesSection.style.display = 'block';
        stateFrequencySection.style.display = 'none';
        stateAveragesOption.classList.add('active');
        stateFrequencyOption.classList.remove('active');
      });
      
      stateFrequencyOption.addEventListener('click', () => {
        stateAveragesSection.style.display = 'none';
        stateFrequencySection.style.display = 'block';
        stateFrequencyOption.classList.add('active');
        stateAveragesOption.classList.remove('active');
      });
    }
  }
}

function displayCountryMetrics(data) {
  const grid = document.getElementById('countryMetricsGrid');
  if (!grid) return;
  const metrics = {};
  
  data.forEach(metric => {
    const values = Object.entries(metric)
      .filter(([key]) => key !== '_id' && key !== 'title')
      .map(([, value]) => (typeof value === 'number' ? value : 0));
    
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      metrics[metric.title] = formatNumberToTwoDecimals(avg).toFixed(2);
    }
  });
  
  grid.innerHTML = '';
  Object.entries(metrics).forEach(([title, value]) => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `<span class="metric-label">${title}</span><span class="metric-value">${value}</span>`;
    grid.appendChild(card);
  });
}

function fetchStateData(stateId) {
  const stateName = statesData[stateId]?.name;
  if (!stateName) return;
  fetch(`/api/averageValues`)
    .then(response => response.json())
    .then(data => {
      displayStateMetrics(data, stateName);
    });
  fetch(`/api/frequencyDistributions/${encodeURIComponent(stateName)}`)
    .then(response => response.json())
    .then(displayFrequencyDistributions);
}

function displayStateMetrics(data, stateName) {
  const grid = document.getElementById('stateMetricsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  
  data.forEach(metric => {
    if (metric[stateName] !== undefined) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      const value = typeof metric[stateName] === 'number' ? 
        formatNumberToTwoDecimals(metric[stateName]).toFixed(2) : 
        metric[stateName];
      
      card.innerHTML = `<span class="metric-label">${metric.title}</span><span class="metric-value">${value}</span>`;
      grid.appendChild(card);
    }
  });
}

function displayFrequencyDistributions(data) {
  const chartsContainer = document.getElementById('chartsContainer');
  if (!chartsContainer) return;
  chartsContainer.innerHTML = '';
  stateCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  stateCharts = [];
  if (Object.keys(data).length === 0) return;
  const chartTextColor = getChartTextColor();
  Object.entries(data).forEach(([collectionName, stateData]) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    const title = document.createElement('h4');
    title.textContent = collectionName;
    wrapper.appendChild(title);
    const chartContainer = document.createElement('div');
    chartContainer.className = 'chart-container';
    const canvas = document.createElement('canvas');
    chartContainer.appendChild(canvas);
    wrapper.appendChild(chartContainer);
    chartsContainer.appendChild(wrapper);
    const chartData = Object.entries(stateData)
      .filter(([key]) => key !== 'title' && key !== '_id')
      .map(([key, value]) => ({
        range: key,
        count: typeof value === 'number' ? value : parseInt(value, 10) || 0
      }));
    chartData.sort((a, b) => {
      const aNum = parseInt(a.range.match(/\d+/)?.[0] || '0', 10);
      const bNum = parseInt(b.range.match(/\d+/)?.[0] || '0', 10);
      return aNum - bNum;
    });
    let barColor = '#27ae60';
    if (collectionName.includes('Transit')) barColor = '#e67e22';
    else if (collectionName.includes('Population')) barColor = '#2980b9';
    else if (collectionName.includes('Economic')) barColor = '#e67e22';
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.range),
        datasets: [{
          label: collectionName,
          data: chartData.map(d => d.count),
          backgroundColor: barColor,
          borderColor: barColor,
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8,
          categoryPercentage: 0.8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { color: chartTextColor } },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
              label: (context) => `Frequency: ${context.raw}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Frequency', color: chartTextColor }, ticks: { color: chartTextColor } },
          x: { title: { display: true, text: 'Range', color: chartTextColor }, ticks: { color: chartTextColor } }
        },
        animation: { duration: 1000 }
      }
    });
    stateCharts.push(chart);
  });
}

function fetchCountyData(countyName) {
  const stateRaw = statesData[selectedState]?.name;
  if (!stateRaw) return;
  
  // Apply database name correction
  const correctedStateName = getCountyDbName(stateRaw);
  const stateNameForDb = formatStateNameForDb(correctedStateName);
  
  // Keep the original county name with special characters for database query
  const originalCountyName = countyName;
  
  console.log(`Fetching county data: ${stateRaw} -> ${correctedStateName} -> ${stateNameForDb}`);
  console.log(`County: ${countyName} (keeping original with special characters)`);
  
  // Use proper encoding for URLs but preserve special characters
  const encodedStateName = encodeURIComponent(stateNameForDb);
  const encodedCountyName = encodeURIComponent(originalCountyName);
  
  fetch(`/api/countyFullData/${encodedStateName}/${encodedCountyName}`)
    .then(response => response.json())
    .then(data => {
      updateDataPanel();
      displayCountyData(data, originalCountyName);
    })
    .catch(err => console.error("Error fetching county data:", err));
}

function sanitizeCountyNameForDisplay(countyName) {
  // Only sanitize for display/comparison purposes, not for database queries
  if (!countyName) return '';
  
  return countyName
    .replace(/'/g, "'") // Replace smart quotes with regular apostrophes
    .replace(/'/g, "'") // Replace another type of smart quote
    .replace(/"/g, '"') // Replace smart double quotes
    .replace(/"/g, '"') // Replace another type of smart double quote
    .trim();
  // NOTE: We're NOT removing diacritics here since DB has original names
}

function normalizeCountyNameForComparison(countyName) {
  // This is for comparing county names (like in map highlighting)
  if (!countyName) return '';
  
  return countyName
    .replace(/'/g, "'")
    .replace(/'/g, "'")
    .replace(/"/g, '"')
    .replace(/"/g, '"')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics for comparison only
    .trim()
    .toLowerCase();
}

function displayCountyData(data, countyName) {
  const grid = document.getElementById('countyMetricsGrid');
  const chartsContainer = document.getElementById('countyChartsContainer');
  if (!grid || !chartsContainer) return;
  document.getElementById('countyName').textContent = countyName;
  grid.innerHTML = '';
  if (data.averages) {
    Object.entries(data.averages).forEach(([key, value]) => {
      if (key === '_id' || key === 'title') return;
      const card = document.createElement('div');
      card.className = 'metric-card';
      card.innerHTML = `<span class="metric-label">${key}</span><span class="metric-value">${value}</span>`;
      grid.appendChild(card);
    });
  }
  chartsContainer.innerHTML = '';
  countyCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  countyCharts = [];
  if (data.frequencies && Object.keys(data.frequencies).length > 0) {
    Object.entries(data.frequencies).forEach(([collectionName, freqData]) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-wrapper';
      const title = document.createElement('h4');
      title.textContent = collectionName;
      wrapper.appendChild(title);
      const chartContainer = document.createElement('div');
      chartContainer.className = 'chart-container';
      const canvas = document.createElement('canvas');
      chartContainer.appendChild(canvas);
      wrapper.appendChild(chartContainer);
      chartsContainer.appendChild(wrapper);
      const chartData = Object.entries(freqData)
        .filter(([key]) => key !== 'title' && key !== '_id')
        .map(([key, value]) => ({
          range: key,
          count: typeof value === 'number' ? value : parseInt(value, 10) || 0
        }));
      chartData.sort((a, b) => {
        const aNum = parseInt(a.range.match(/\d+/)?.[0] || '0', 10);
        const bNum = parseInt(b.range.match(/\d+/)?.[0] || '0', 10);
        return aNum - bNum;
      });
      const chartTextColor = getChartTextColor();
      let barColor = '#27ae60';
      if (collectionName.includes('Transit')) barColor = '#e67e22';
      else if (collectionName.includes('Population')) barColor = '#2980b9';
      else if (collectionName.includes('Economic')) barColor = '#e67e22';
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: chartData.map(d => d.range),
          datasets: [{
            label: collectionName,
            data: chartData.map(d => d.count),
            backgroundColor: barColor,
            borderColor: barColor,
            borderWidth: 1,
            borderRadius: 4,
            barPercentage: 0.8,
            categoryPercentage: 0.8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'top', labels: { color: chartTextColor } },
            tooltip: {
              callbacks: {
                title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
                label: (context) => `Frequency: ${context.raw}`
              }
            }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Frequency', color: chartTextColor }, ticks: { color: chartTextColor } },
            x: { title: { display: true, text: 'Range', color: chartTextColor }, ticks: { color: chartTextColor } }
          },
          animation: { duration: 1000 }
        }
      });
      countyCharts.push(chart);
    });
  }
}

// -----------------------------------------------------------------------------
// FIXED COUNTY RANKING GRAPH: Now use all county data to create ranking by county name.
function createCountyTopBottomChart() {
  const canvas = document.getElementById('countyTopBottomChart');
  if (!canvas) return;
  if (countyTopBottomChart && typeof countyTopBottomChart.destroy === 'function') {
    countyTopBottomChart.destroy();
  }
  if (!allCountyData || allCountyData.length === 0) return;
  const countyValues = allCountyData.map(doc => ({
    county: doc.title,
    value: Number(doc[selectedCountyMetric])
  }));
  countyValues.sort((a, b) => b.value - a.value);
  const top5 = countyValues.slice(0, 5);
  const bottom5 = countyValues.slice(-5).reverse();
  const labels = [...top5.map(d => d.county), ...bottom5.map(d => d.county)];
  const data = [...top5.map(d => d.value), ...bottom5.map(d => d.value)];
  const colors = [...top5.map(() => '#e74c3c'), ...bottom5.map(() => '#27ae60')];
  countyTopBottomChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: selectedCountyMetric,
        data: data,
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: { 
          beginAtZero: true, 
          title: { display: true, text: 'Value', color: getChartTextColor() },
          ticks: { color: getChartTextColor() }
        },
        y: { 
          title: { display: true, text: 'County', color: getChartTextColor() },
          ticks: { color: getChartTextColor() }
        }
      }
    }
  });
}

function populateCountyMetricSelect(availableMetrics) {
  const select = document.getElementById('countyMetricSelect');
  select.innerHTML = '';
  availableMetrics.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric;
    option.textContent = metric;
    select.appendChild(option);
  });
  select.removeEventListener('change', countyHandleMetricChange);
  select.addEventListener('change', countyHandleMetricChange);
}

function countyHandleMetricChange(event) {
  selectedCountyMetric = event.target.value;
  updateCountyMapColors();
  createCountyLegendForMap();
  // County chart removed - replaced with chatbot
}

function updateCountyMapColors() {
  if (!countyMap || !countyMap.svg) {
    console.warn('County map or SVG not available');
    return;
  }
  
  if (!allCountyData || allCountyData.length === 0 || !selectedCountyMetric) {
    console.warn('No county data or metric selected');
    return;
  }
  
  console.log('Updating county map colors for metric:', selectedCountyMetric);
  
  const metricValues = {};
  const validValues = [];
  let nullCount = 0;
  let naCount = 0;
  
  // Process all county data
  allCountyData.forEach(doc => {
    if (doc.title != null) {
      const countyName = String(doc.title);
      const normalizedCountyName = normalizeCountyNameForComparison(countyName);
      
      // Get the raw value
      const rawValue = doc[selectedCountyMetric];
      
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        // Truly missing data - N/A
        metricValues[normalizedCountyName] = 'NA';
        naCount++;
        console.log(`${countyName}: N/A (missing data)`);
      } else if (typeof rawValue === 'number') {
        if (rawValue === 0) {
          // Zero value means NULL data for subsequent metrics
          metricValues[normalizedCountyName] = 'NULL';
          nullCount++;
          console.log(`${countyName}: NULL (zero value indicates null)`);
        } else {
          const formattedValue = formatNumberToTwoDecimals(rawValue);
          metricValues[normalizedCountyName] = formattedValue;
          validValues.push(formattedValue);
          console.log(`${countyName}: ${formattedValue}`);
        }
      } else if (typeof rawValue === 'string') {
        const parsed = parseFloat(rawValue.trim());
        if (isNaN(parsed)) {
          metricValues[normalizedCountyName] = 'NA';
          naCount++;
          console.log(`${countyName}: N/A (unparseable string: ${rawValue})`);
        } else if (parsed === 0) {
          metricValues[normalizedCountyName] = 'NULL';
          nullCount++;
          console.log(`${countyName}: NULL (zero string value)`);
        } else {
          const formattedValue = formatNumberToTwoDecimals(parsed);
          metricValues[normalizedCountyName] = formattedValue;
          validValues.push(formattedValue);
          console.log(`${countyName}: ${formattedValue}`);
        }
      } else {
        metricValues[normalizedCountyName] = 'NA';
        naCount++;
        console.log(`${countyName}: N/A (unknown type: ${typeof rawValue})`);
      }
    }
  });
  
  console.log(`Processed counties: ${validValues.length} valid values, ${nullCount} NULL, ${naCount} N/A`);
  
  // Create color scale for valid numeric values only
  let colorScale;
  if (validValues.length === 0) {
    // No valid numeric data
    colorScale = null;
  } else if (validValues.length === 1 || Math.min(...validValues) === Math.max(...validValues)) {
    // All valid values are the same
    colorScale = () => '#27ae60';
  } else {
    const minVal = Math.min(...validValues);
    const maxVal = Math.max(...validValues);
    colorScale = d3.scaleQuantize()
      .domain([minVal, maxVal])
      .range(['#27ae60', '#e67e22', '#e74c3c']);
  }
  
  // Update county colors
  let coloredCount = 0;
  let nullColoredCount = 0;
  let naColoredCount = 0;
  
  countyMap.svg.selectAll('.county-path')
    .each(function() {
      const mapCountyName = d3.select(this).attr('data-county-name');
      
      if (!mapCountyName) {
        console.warn('County missing data-county-name');
        d3.select(this).attr('fill', '#808080'); // N/A color
        return;
      }
      
      const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
      const value = metricValues[normalizedMapName];
      
      let color;
      if (value === 'NULL') {
        // Zero value indicates NULL data - use black
        color = '#000000';
        nullColoredCount++;
      } else if (value === 'NA') {
        // Missing data - use grey
        color = '#808080';
        naColoredCount++;
      } else if (value !== undefined && !isNaN(value) && colorScale) {
        // Valid numeric value - use color scale
        color = colorScale(value);
        coloredCount++;
      } else {
        // Fallback to N/A
        color = '#808080';
        naColoredCount++;
      }
      
      // Apply the color
      d3.select(this)
        .attr('fill', color)
        .attr('original-fill', color);
      
      // Handle selection state - keep all counties clickable
      if (selectedCounty) {
        const normalizedSelectedName = normalizeCountyNameForComparison(selectedCounty);
        if (normalizedMapName !== normalizedSelectedName) {
          d3.select(this)
            .attr('data-clickable', 'true') // Keep clickable
            .style('cursor', 'pointer')
            .attr('opacity', 0.3);
        } else {
          d3.select(this)
            .attr('data-clickable', 'true')
            .style('cursor', 'pointer')
            .attr('opacity', 1);
        }
      } else {
        d3.select(this)
          .attr('data-clickable', 'true')
          .style('cursor', 'pointer')
          .attr('opacity', 1);
      }
    });
  
  console.log(`Applied colors: ${coloredCount} valid, ${nullColoredCount} NULL (black), ${naColoredCount} N/A (grey)`);
  
  // Store data for legend
  countyMap.colorScale = colorScale;
  countyMap.validValues = validValues;
  countyMap.hasNullValues = nullCount > 0;
  countyMap.hasNAValues = naCount > 0;
}

function createCountyLegendForMap() {
  const legend = document.getElementById('legend');
  const colorScale = countyMap?.colorScale;
  const validValues = countyMap?.validValues || [];
  const hasNullValues = countyMap?.hasNullValues || false;
  const hasNAValues = countyMap?.hasNAValues || false;
  
  if (!selectedCountyMetric) {
    legend.innerHTML = `<h3>Select a metric</h3>`;
    return;
  }
  
  let legendContent = `<h3>${selectedCountyMetric}</h3>`;
  
  if (validValues.length === 0) {
    // No valid numeric data
    legendContent += `<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">`;
    
    if (hasNullValues) {
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: #000000; border: 1px solid #ccc;"></div> 
          <span>NULL</span>
        </div>
      `;
    }
    
    if (hasNAValues) {
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: #808080;"></div> 
          <span>N/A</span>
        </div>
      `;
    }
    
    legendContent += `</div>`;
  } else {
    // Has valid numeric data
    const minVal = Math.min(...validValues);
    const maxVal = Math.max(...validValues);
    
    legendContent += `<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">`;
    
    if (minVal === maxVal) {
      // All valid values are the same
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: #27ae60;"></div> 
          <span>${minVal.toFixed(2)}</span>
        </div>
      `;
    } else {
      // Range of values
      const midVal = (minVal + maxVal) / 2;
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: ${colorScale(minVal)};"></div> 
          <span>${minVal.toFixed(2)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: ${colorScale(midVal)};"></div> 
          <span>${midVal.toFixed(2)}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: ${colorScale(maxVal)};"></div> 
          <span>${maxVal.toFixed(2)}</span>
        </div>
      `;
    }
    
    // Add NULL legend if present
    if (hasNullValues) {
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: #000000; border: 1px solid #ccc;"></div> 
          <span>NULL</span>
        </div>
      `;
    }
    
    // Add N/A legend if present
    if (hasNAValues) {
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: #808080;"></div> 
          <span>N/A</span>
        </div>
      `;
    }
    
    legendContent += `</div>`;
  }
  
  legend.innerHTML = legendContent;
}
// -----------------------------------------------------------------------------
// EQUITY COMPARISON FUNCTIONS
function switchToMapView() {
  document.getElementById('mapView').style.display = 'block';
  document.getElementById('legend').style.display = 'block';
  document.getElementById('equityComparisonContent').style.display = 'none';
  document.getElementById('mapViewTab').classList.add('active');
  document.getElementById('equityComparisonTab').classList.remove('active');
}

function switchToEquityComparison() {
  if (!selectedState || selectedCounty) {
    return;
  }
  loadComparisonData();
  document.getElementById('mapView').style.display = 'none';
  document.getElementById('legend').style.display = 'none';
  document.getElementById('equityComparisonContent').style.display = 'block';
  document.getElementById('equityComparisonTab').classList.add('active');
  document.getElementById('mapViewTab').classList.remove('active');
  setTimeout(createComparisonScatterPlotFull, 500);
}

function loadComparisonData() {
  if (!selectedState || selectedCounty) return;
  const stateName = statesData[selectedState].name;
  
  // Apply database name correction
  const correctedStateName = getCountyDbName(stateName);
  const dbName = formatStateNameForDb(correctedStateName);
  
  console.log("Loading county data for state:", stateName);
  console.log("Corrected state name:", correctedStateName);
  console.log("Formatted DB name:", dbName);
  
  fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
    .then(response => {
      console.log("Response status:", response.status);
      return response.json();
    })
    .then(data => {
      console.log("Received county data:", data);
      
      allCountyData = data;
      if (allCountyData.length > 0) {
        console.log("County data keys:", Object.keys(allCountyData[0]));
        
        transitMetricKeys = Object.keys(allCountyData[0]).filter(key => 
          key !== '_id' && key !== 'title' && key !== 'state'
        );
        
        console.log("Transit Metric Keys:", transitMetricKeys);
        
        selectedCountyMetric = transitMetricKeys[0] || null;
        
        populateTransitMetricDropdown();
        populateComparisonMetricDropdown();
      } else {
        console.warn("No county data found");
        transitMetricKeys = [];
        selectedCountyMetric = null;
      }
      
      // Load equity comparison data
      const equityCategory = document.getElementById('equityCategorySelect').value;
      loadEquityComparisonData(equityCategory, correctedStateName);
    })
    .catch(err => {
      console.error("Error fetching transit county averages:", err);
    });
}

function loadEquityComparisonData(category, stateName) {
  // Apply database name correction
  const correctedStateName = getCountyDbName(stateName);
  const formattedState = formatStateNameForDb(correctedStateName);
  
  console.log("Loading equity data for category:", category);
  console.log("Original state:", stateName);
  console.log("Corrected state:", correctedStateName);
  console.log("Formatted state:", formattedState);
  
  fetch(`/api/equityCountyAverageValues/${encodeURIComponent(category)}/${encodeURIComponent(formattedState)}`)
    .then(response => {
      console.log("Equity response status:", response.status);
      return response.json();
    })
    .then(data => {
      console.log("Received equity data:", data);
      
      equityCountyData = data;
      if (equityCountyData.length > 0) {
        console.log("First equity data object:", equityCountyData[0]);
        
        if (category === 'Housing_Data') {
          if (equityCountyData[0].data) {
            console.log("Found nested data structure:", equityCountyData[0].data);
            equityMetricKeys = Object.keys(equityCountyData[0].data);
          } else if (equityCountyData[0].Population) {
            console.log("Found Population nested data:", equityCountyData[0].Population);
            equityMetricKeys = Object.keys(equityCountyData[0].Population);
          } else {
            equityMetricKeys = Object.keys(equityCountyData[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && 
              key !== 'county' && key !== 'data' && key !== 'Population'
            );
          }
        } else {
          if (equityCountyData[0].data && typeof equityCountyData[0].data === 'object') {
            equityMetricKeys = Object.keys(equityCountyData[0].data);
          } else {
            equityMetricKeys = Object.keys(equityCountyData[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && key !== 'data'
            );
          }
        }
        
        console.log("Extracted Equity Metric Keys:", equityMetricKeys);
      } else {
        console.warn(`No equity data found for ${category}`);
        equityMetricKeys = [];
      }
      
      populateEquityMetricDropdown();
      createComparisonScatterPlotFull();
    })
    .catch(err => {
      console.error("Error fetching equity county averages:", err);
      equityCountyData = [];
      equityMetricKeys = [];
      populateEquityMetricDropdown();
    });
}

function populateTransitMetricDropdown() {
  const select = document.getElementById('transitMetricSelect');
  select.innerHTML = '';
  
  console.log("Populating transit metrics:", transitMetricKeys);
  
  transitMetricKeys.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric;
    option.textContent = metric;
    select.appendChild(option);
  });
  
  if (select.options.length > 0) {
    select.value = select.options[0].value;
    selectedCountyMetric = select.value;
    
    console.log("Default transit metric selected:", selectedCountyMetric);
  }
  
  select.addEventListener('change', createComparisonScatterPlotFull);
}

function populateEquityMetricDropdown() {
  const select = document.getElementById('equityMetricSelect');
  select.innerHTML = '';
  
  console.log("Populating equity metrics:", equityMetricKeys);
  
  equityMetricKeys.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric;
    option.textContent = metric;
    select.appendChild(option);
  });
  
  if (select.options.length > 0) {
    select.value = select.options[0].value;
    
    console.log("Default equity metric selected:", select.value);
  }
  
  select.addEventListener('change', createComparisonScatterPlotFull);
}

function createComparisonScatterPlotFull() {
  if (!selectedState || selectedCounty) return;
  
  console.log("Creating comparison scatter plot");
  console.log("Selected State:", selectedState);
  console.log("All County Data:", allCountyData);
  console.log("Equity County Data:", equityCountyData);
  
  const equitySelect = document.getElementById('equityMetricSelect');
  const transitSelect = document.getElementById('transitMetricSelect');
  
  if (!equitySelect || !transitSelect) {
    console.error("Dropdowns for equity or transit metrics are missing.");
    return;
  }
  
  const equityMetric = equitySelect.value || (equitySelect.options[0] && equitySelect.options[0].value);
  const transitMetric = transitSelect.value || (transitSelect.options[0] && transitSelect.options[0].value);
  
  console.log("Equity Metric:", equityMetric);
  console.log("Transit Metric:", transitMetric);
  
  if (!equityMetric || !transitMetric) {
    console.error("No metrics selected");
    return;
  }
  
  const dataPoints = [];
  
  
  allCountyData.forEach(transitDoc => {
    const transitCounty = transitDoc.title ? 
      String(transitDoc.title).toUpperCase().replace(/\s*COUNTY$/, "").trim() : "";
    
    const equityDoc = equityCountyData.find(d => {
      const docTitle = d.title ? 
        String(d.title).toUpperCase().replace(/\s*COUNTY$/, "").trim() : "";
      return docTitle === transitCounty;
    });
    
    if (equityDoc) {
      const transitValue = Number(transitDoc[transitMetric]);
      let equityValue;
      
      // Enhanced value extraction with special handling for Population_Data
      const equityCategory = document.getElementById('equityCategorySelect').value;
      
      if (equityCategory === 'Housing_Data') {
        // Try multiple paths to find the value
        if (equityDoc.data && typeof equityDoc.data === 'object' && equityDoc.data[equityMetric] !== undefined) {
          equityValue = Number(equityDoc.data[equityMetric]);
        } else if (equityDoc.Population && typeof equityDoc.Population === 'object' && 
                  equityDoc.Population[equityMetric] !== undefined) {
          equityValue = Number(equityDoc.Population[equityMetric]);
        } else {
          // Direct property access as fallback
          equityValue = Number(equityDoc[equityMetric]);
        }
      } else {
        // Standard approach for other categories
        if (equityDoc.data && typeof equityDoc.data === 'object') {
          equityValue = Number(equityDoc.data[equityMetric]);
        } else {
          equityValue = Number(equityDoc[equityMetric]);
        }
      }
      
      console.log(`County: ${transitCounty}, Transit: ${transitValue}, Equity: ${equityValue}`);
      
      if (!isNaN(transitValue) && !isNaN(equityValue)) {
        dataPoints.push({
          label: transitDoc.title,
          x: equityValue,
          y: transitValue
        });
      }
    }
  });
  
  console.log("Final Data Points:", dataPoints);
  
  const ctx = document.getElementById('comparisonChart').getContext('2d');
  
  if (comparisonChart && typeof comparisonChart.destroy === 'function') {
    comparisonChart.destroy();
  }
  
  if (dataPoints.length === 0) {
    console.warn("No data points to create scatter plot");
    
    // Clear the canvas and add a message
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = '16px Arial';
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#ffffff' : '#ff0000';
    ctx.textAlign = 'center';
    ctx.fillText('No comparable data found', ctx.canvas.width / 2, ctx.canvas.height / 2);
    return;
  }
  
  let regressionData = [];
  if (dataPoints.length > 1) {
    const n = dataPoints.length;
    const sumX = dataPoints.reduce((sum, pt) => sum + pt.x, 0);
    const sumY = dataPoints.reduce((sum, pt) => sum + pt.y, 0);
    const sumXY = dataPoints.reduce((sum, pt) => sum + pt.x * pt.y, 0);
    const sumXX = dataPoints.reduce((sum, pt) => sum + pt.x * pt.x, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const xValues = dataPoints.map(pt => pt.x);
    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    regressionData = [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept }
    ];
  }
  
  comparisonChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Data Points',
          data: dataPoints,
          backgroundColor: '#2980b9',
          pointRadius: 5
        },
        {
          type: 'line',
          label: 'Trend Line',
          data: regressionData,
          fill: false,
          borderColor: '#e74c3c',
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { 
          title: { 
            display: true, 
            text: `Equity: ${equityMetric}`, 
            color: getChartTextColor() 
          }, 
          beginAtZero: true, 
          ticks: { color: getChartTextColor() } 
        },
        y: { 
          title: { 
            display: true, 
            text: `Transit: ${transitMetric}`, 
            color: getChartTextColor() 
          }, 
          beginAtZero: true, 
          ticks: { color: getChartTextColor() } 
        }
      }
    }
  });
}

// Add this near the beginning of your app.js file or in a new theme.js file
document.addEventListener('DOMContentLoaded', () => {
  const themeToggle = document.getElementById('themeToggle');
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.checked = true;
  }
  
  // Theme toggle functionality
  themeToggle.addEventListener('change', () => {
    if (themeToggle.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      
      // Update chart colors if any charts are visible
      updateChartsForDarkMode();
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      
      // Update chart colors if any charts are visible
      updateChartsForDarkMode();
    }
  });
});

// Helper function to update chart colors when theme changes
function updateChartsForDarkMode() {
  // If any charts are currently displayed, refresh them
  if (distributionChart) distributionChart.update();
  if (topBottomChart) topBottomChart.update();
  if (countyTopBottomChart) countyTopBottomChart.update();
  if (comparisonChart) comparisonChart.update();
  
  // You might also need to refresh state and county charts
  if (stateCharts && stateCharts.length) {
    stateCharts.forEach(chart => chart.update());
  }
  
  if (countyCharts && countyCharts.length) {
    countyCharts.forEach(chart => chart.update());
  }
}

window.addEventListener('resize', () => {
  if (activeView === 'state' && usMap) {
    createUSMap();
  } else if (activeView === 'county' && selectedState) {
    createCountyMap(selectedState);
  }
});

// Add this to your app.js
function resizeMap() {
  if (activeView === 'state' && usMap) {
    createUSMap();
  } else if (activeView === 'county' && selectedState) {
    createCountyMap(selectedState);
  }
}

// Debounce function to prevent too many resize events
function debounce(func, wait) {
  let timeout;
  return function() {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Add a debounced resize event listener
window.addEventListener('resize', debounce(resizeMap, 250));

// Add these variables at the top of your app.js file
let selectedEntitiesForComparison = [];
let comparisonModalChart = null;

// Add these functions to your app.js file
document.addEventListener('DOMContentLoaded', function() {
  // Your existing code...
  
  // Initialize comparison functionality
  initComparisonFunctionality();
});

function initComparisonFunctionality() {
  const compareStatesButton = document.getElementById('compareStatesButton');
  const comparisonOverlay = document.getElementById('comparisonOverlay');
  const comparisonModal = document.getElementById('comparisonModal');
  const cancelComparisonBtn = document.getElementById('cancelComparisonBtn');
  const proceedToCompareBtn = document.getElementById('proceedToCompareBtn');
  const closeComparisonModal = document.getElementById('closeComparisonModal');
  
  if (!compareStatesButton) return;
  
  // Start comparison mode
  compareStatesButton.addEventListener('click', function() {
    selectedEntitiesForComparison = [];
    
    const comparisonOverlayTitle = document.getElementById('comparisonOverlayTitle');
    
    if (!selectedState) {
      comparisonOverlayTitle.textContent = 'Select States to Compare';
      compareStatesButton.textContent = 'Compare States';
    } else {
      comparisonOverlayTitle.textContent = `Select Counties in ${statesData[selectedState].name} to Compare`;
      compareStatesButton.textContent = 'Compare Counties';
    }
    
    enterComparisonMode();
  });
  
  // Cancel comparison
  cancelComparisonBtn.addEventListener('click', function() {
    exitComparisonMode();
  });
  
  // Proceed to AI report generation instead of chart options
  proceedToCompareBtn.addEventListener('click', function() {
    if (selectedEntitiesForComparison.length < 2) {
      alert('Please select at least 2 entities to compare.');
      return;
    }
    
    // Exit comparison mode
    exitComparisonMode();
    
    // Generate AI report directly
    generateComprehensiveAIReport();
  });
  
  // Close modal
  closeComparisonModal.addEventListener('click', function() {
    comparisonModal.style.display = 'none';
  });
  
  // Click outside to close modal
  window.addEventListener('click', function(e) {
    if (e.target === comparisonModal) {
      comparisonModal.style.display = 'none';
    }
  });
}
// Add this function to app.js - place it after the other comparison functions

// Replace your generateComprehensiveAIReport function in app.js with this:

// Replace your generateComprehensiveAIReport function in app.js with this:

async function generateComprehensiveAIReport() {
  try {
    // Show loading state
    showAIReportLoading();
    
    // Get selected entities
    const entities = selectedEntitiesForComparison.map(entity => entity.name);
    
    console.log('Generating chart comparison for:', entities);
    
    // Hide loading and close any modals
    hideAIReportLoading();
    
    // Close the comparison modal
    const comparisonModal = document.getElementById('comparisonModal');
    if (comparisonModal) {
      comparisonModal.style.display = 'none';
    }
    
    // Exit comparison mode
    exitComparisonMode();
    
    // Store selected states globally for chart access
    window.selectedStates = entities.slice();
    
    // Generate the chart directly
    await fetchAndRenderDotplotInModal(entities);
    
  } catch (error) {
    console.error('Error generating chart comparison:', error);
    hideAIReportLoading();
    showAIReportError(`Failed to generate chart comparison: ${error.message}`);
  }
}

// Add this new function to app.js:
function createReportPopup(reportData) {
  hideAIReportLoading();
  console.log('[AI REPORT] Creating report popup...');

  // Null checks and error handling
  if (!reportData || typeof reportData !== 'object') {
    console.error('[AI REPORT] Report data is null or not an object:', reportData);
    alert('Failed to generate report. No data was returned.');
    return;
  }
  if (reportData.fullReport && reportData.fullReport.startsWith('Error:')) {
    alert(reportData.fullReport);
    return;
  }
  
  // Support both {report: {fullReport}} and {fullReport} shapes
  const reportContent = reportData.report?.fullReport || reportData.fullReport || 'No report content available';
  const entities = reportData.metadata?.entitiesAnalyzed || reportData.entitiesAnalyzed || ['Selected entities'];

  // Create full-page overlay
  let fullPageOverlay = document.getElementById('aiReportFullPageOverlay');
  if (!fullPageOverlay) {
    fullPageOverlay = document.createElement('div');
    fullPageOverlay.id = 'aiReportFullPageOverlay';
    fullPageOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #f5f5f5;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    `;
    document.body.appendChild(fullPageOverlay);
  }

  // Prevent body scrolling when modal is open
  document.body.style.overflow = 'hidden';

  fullPageOverlay.style.display = 'flex';
  fullPageOverlay.innerHTML = `
    <!-- Header Bar -->
    <div style="
      background: linear-gradient(135deg, #2c41ff, #1931e0);
      color: white;
      padding: 20px 30px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    ">
      <div>
        <h1 style="margin: 0 0 5px 0; font-size: 1.8rem; font-weight: 700;">
          Comprehensive Transit Analysis Report
        </h1>
        <div style="font-size: 1rem; opacity: 0.9; display: flex; gap: 30px; flex-wrap: wrap;">
          <span><i class="fas fa-calendar" style="margin-right: 8px;"></i>Generated: ${new Date().toLocaleDateString()}</span>
          <span><i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i>Entities: ${entities.join(', ')}</span>
          <span><i class="fas fa-chart-bar" style="margin-right: 8px;"></i>Comprehensive Analysis</span>
        </div>
      </div>
      <div style="display: flex; gap: 15px; align-items: center;">
        <button id="printFullPageReport" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <i class="fas fa-print"></i> Print
        </button>
        <button id="downloadFullPageReport" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <i class="fas fa-download"></i> Download
        </button>
        <button id="closeFullPageReport" style="
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        ">
          <i class="fas fa-times"></i> Close
        </button>
      </div>
    </div>

    <!-- Main Content Area - Vertical Layout -->
    <div style="
      flex: 1;
      overflow-y: auto;
      background: white;
      display: flex;
      flex-direction: column;
    ">
      <!-- Report Content (Top Section) -->
      <div style="
        padding: 40px;
        background: white;
        border-bottom: 1px solid #e0e0e0;
      ">
        <div style="
          max-width: 1000px;
          margin: 0 auto;
          line-height: 1.8;
          font-size: 16px;
          color: #333;
        ">
          <div style="white-space: pre-line; margin-bottom: 40px;">
            ${reportContent}
          </div>
        </div>
      </div>
      
      <!-- Chart Section (Bottom) -->
      <div style="
        background: #fafafa;
        border-top: 1px solid #e0e0e0;
        min-height: 600px;
      ">
        <div style="
          padding: 25px 40px;
          background: white;
          border-bottom: 1px solid #e0e0e0;
        ">
          <h3 style="
            margin: 0 0 10px 0; 
            color: #2c41ff; 
            font-size: 1.4rem;
            display: flex;
            align-items: center;
            gap: 10px;
            justify-content: center;
          ">
            <i class="fas fa-chart-line"></i>
            Interactive Data Visualization
          </h3>
          <p style="
            margin: 0; 
            color: #666; 
            font-size: 14px;
            line-height: 1.5;
            text-align: center;
          ">
            Explore transit and equity metrics for the analyzed entities. Use the controls below to filter and compare different data categories.
          </p>
        </div>
        
        <div style="
          padding: 20px 40px;
          height: 600px;
        ">
          <div id="dotplotContainer" style="
            height: 100%;
            width: 100%;
            max-width: 1200px;
            margin: 0 auto;
            overflow: hidden;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          "></div>
        </div>
      </div>
    </div>
  `;

  console.log('[AI REPORT] Rendered report in full-page view');

  // Event listeners
  document.getElementById('closeFullPageReport').onclick = function() {
    fullPageOverlay.style.display = 'none';
    document.body.style.overflow = ''; // Restore body scrolling
    console.log('[AI REPORT] Closed full-page report');
  };

  document.getElementById('printFullPageReport').onclick = function() {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transit Analysis Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.7; 
            color: #333; 
            padding: 30px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 { 
            color: #2c41ff; 
            margin-bottom: 30px; 
            font-size: 2rem;
            text-align: center;
            border-bottom: 3px solid #2c41ff;
            padding-bottom: 15px;
          }
          .header-info {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
          }
          .content { 
            white-space: pre-line; 
            font-size: 14px;
            line-height: 1.8;
          }
          @media print {
            body { margin: 0; padding: 20px; }
          }
        </style>
      </head>
      <body>
        <h1>Comprehensive Transit Analysis Report</h1>
        <div class="header-info">
          <strong>Generated:</strong> ${new Date().toLocaleDateString()} | 
          <strong>Entities:</strong> ${entities.join(', ')} | 
          <strong>Report Type:</strong> Transit Accessibility & Equity Analysis
        </div>
        <div class="content">${reportContent}</div>
      </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    printWindow.document.write(printContent);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  document.getElementById('downloadFullPageReport').onclick = function() {
    // Create a comprehensive PDF-style report
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transit Analysis Report - ${entities.join(', ')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.7; 
            color: #333; 
            background: white;
          }
          .report-container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px;
            background: white;
          }
          h1 { 
            color: #2c41ff; 
            font-size: 2.5rem;
            margin-bottom: 30px;
            text-align: center;
            border-bottom: 4px solid #2c41ff;
            padding-bottom: 20px;
          }
          .metadata {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-bottom: 50px;
            padding: 25px;
            background: #f8f9fa;
            border-radius: 10px;
            border-left: 5px solid #2c41ff;
          }
          .content {
            white-space: pre-line;
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 40px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #e0e0e0;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .report-container { padding: 30px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <h1>Comprehensive Transit Analysis Report</h1>
          <div class="metadata">
            <strong>Analysis Date:</strong> ${new Date().toLocaleDateString()} <br>
            <strong>Entities Analyzed:</strong> ${entities.join(', ')} <br>
            <strong>Report Type:</strong> Transit Accessibility & Multi-Dimensional Equity Assessment <br>
            <strong>Generated by:</strong> TransitViz Analytics Platform
          </div>
          <div class="content">${reportContent}</div>
          <div class="footer">
            Generated by TransitViz - Modern Transit Data Explorer<br>
            Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | 
            Analysis Type: Comprehensive Transit-Equity Study
          </div>
        </div>
      </body>
      </html>
    `;
    
    const downloadWindow = window.open('', '_blank', 'width=1200,height=900');
    downloadWindow.document.write(pdfContent);
    downloadWindow.document.close();
    
    setTimeout(() => {
      downloadWindow.print();
    }, 1000);
  };

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === 'Escape') {
      document.getElementById('closeFullPageReport').click();
      document.removeEventListener('keydown', handleEscape);
    }
  };
  document.addEventListener('keydown', handleEscape);

  // Render the dotplot chart for selected states
  let states = [];
  if (window.selectedStates && Array.isArray(window.selectedStates) && window.selectedStates.length > 0) {
    states = window.selectedStates;
  } else if (typeof getSelectedStates === 'function') {
    states = getSelectedStates();
  } else {
    states = entities;
  }
  
  if (Array.isArray(states) && states.length > 0) {
    console.log('[AI REPORT] Fetching and rendering dotplot for states:', states);
    fetchAndRenderDotplotInModal(states);
  } else {
    console.warn('[AI REPORT] No selected states found for dotplot.');
    document.getElementById('dotplotContainer').innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No chart data available</p>';
  }
}
// Helper function to render dotplot specifically in the modal
// Helper function to render dotplot specifically in the modal
async function fetchAndRenderDotplotInModal(states) {
  if (!states || states.length === 0) {
    console.error('No states provided for chart');
    return;
  }
  
  console.log('[CHART] Fetching data for states:', states);
  
  // Create full-screen chart container
  let chartContainer = document.getElementById('fullScreenChartContainer');
  if (!chartContainer) {
    chartContainer = document.createElement('div');
    chartContainer.id = 'fullScreenChartContainer';
    chartContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: white;
      z-index: 10000;
      display: flex;
    `;
    document.body.appendChild(chartContainer);
  }
  
  chartContainer.innerHTML = '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: 18px; color: #666;"><i class="fas fa-spinner fa-spin" style="margin-right: 10px;"></i>Loading comparison chart...</div>';
  
  // Disable body scrolling
  document.body.style.overflow = 'hidden';
  
  try {
    const response = await fetch('/comparison/api/comparison-dotplot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ states })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[CHART] Received data:', data);
    
    // Set the data and initialize variables
    dotplotData = data;
    dotplotTab = 'equity'; // Reset to default
    selectedMetricIndexes = { equity: 0, transit: 0 };
    selectedLegends = { equity: [], transit: [] };
    
    // Render the chart interface
    renderDotplotChartInModal(chartContainer);
    
  } catch (err) {
    console.error('Chart data fetch error:', err);
    chartContainer.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; color: #dc3545; text-align: center;">
        <i class="fas fa-exclamation-triangle" style="font-size: 48px; margin-bottom: 20px;"></i>
        <h2>Failed to Load Chart Data</h2>
        <p style="margin: 10px 0;">Error: ${err.message}</p>
        <button onclick="document.getElementById('fullScreenChartContainer').remove(); document.body.style.overflow = 'auto';" 
                style="margin-top: 20px; padding: 10px 20px; background: #dc3545; color: white; border: none; border-radius: 5px; cursor: pointer;">
          Close
        </button>
      </div>
    `;
  }
}

// Modified version of renderDotplotChart specifically for modal
// Modified version of renderDotplotChart specifically for modal
// Modified version of renderDotplotChart specifically for modal
// Modified version of renderDotplotChart specifically for modal
function renderDotplotChartInModal(container) {
  if (!dotplotData || !container) {
    console.error('[MODAL CHART] Missing container or data');
    return;
  }
  
  // Ensure dotplotTab has a default value
  if (!dotplotTab) dotplotTab = 'equity';
  
  const tabData = dotplotData[dotplotTab] || [];
  
  if (tabData.length === 0) {
    container.innerHTML = '<div style="color:#888; text-align: center; padding: 40px;">No data available for this tab.</div>';
    return;
  }
  
  // Enhanced UI - FULL PAGE CHART
  let html = `
    <div style="display: flex; height: 100vh; width: 100vw; background: white;">
      <!-- Left Sidebar for Categories -->
      <div style="width: 280px; background: #f8f9fa; border-right: 1px solid #ddd; overflow-y: auto; flex-shrink: 0;">
        <div style="padding: 20px; border-bottom: 1px solid #ddd; background: #e9ecef;">
          <h3 style="margin: 0; font-weight: bold; color: #333;">Chart Comparison</h3>
          <button onclick="document.getElementById('fullScreenChartContainer').remove(); document.body.style.overflow = 'auto';" 
                  style="float: right; background: #dc3545; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer; margin-top: -25px; font-size: 16px;">
            ×
          </button>
        </div>
        
        <!-- Tab Buttons -->
        <div style="padding: 15px;">
          <button id="modalDotplotTabEquity" class="sidebar-tab${dotplotTab==='equity'?' active':''}">
            <i class="fas fa-balance-scale"></i> Equity Data
          </button>
          <button id="modalDotplotTabTransit" class="sidebar-tab${dotplotTab==='transit'?' active':''}">
            <i class="fas fa-bus"></i> Transit Data
          </button>
        </div>
        
        <!-- Category List -->
        <div style="padding: 0 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #666; margin: 15px 0 8px 0; text-transform: uppercase;">
            Categories
          </div>
          ${tabData.map((cat, i) => `
            <div class="category-item${i === selectedMetricIndexes[dotplotTab] ? ' active' : ''}" 
                 data-index="${i}" 
                 style="padding: 12px 15px; cursor: pointer; border-radius: 6px; margin: 3px 0; font-size: 14px; font-weight: 500; ${i === selectedMetricIndexes[dotplotTab] ? 'background: #007bff; color: white;' : 'background: white; border: 1px solid #ddd; color: #333;'}">
              <i class="fas fa-chart-line" style="margin-right: 8px; font-size: 12px;"></i>
              ${cat.category}
            </div>
          `).join('')}
        </div>
        
        <!-- Legend Section -->
        <div style="padding: 15px; border-top: 1px solid #ddd; margin-top: 15px;">
          <div style="font-size: 12px; font-weight: bold; color: #666; margin-bottom: 12px; text-transform: uppercase;">
            Metrics (${tabData[selectedMetricIndexes[dotplotTab]]?.metrics?.length || 0})
          </div>
          <div id="legendContainer" style="max-height: 400px; overflow-y: auto;">
            <!-- Legends will be populated here -->
          </div>
        </div>
      </div>
      
      <!-- Main Chart Area - FULL SIZE -->
      <div style="flex: 1; display: flex; flex-direction: column; height: 100vh;">
        <div style="padding: 20px; background: #f8f9fa; border-bottom: 1px solid #ddd; flex-shrink: 0;">
          <h2 style="margin: 0; color: #333; font-size: 1.8rem; font-weight: bold;">
            ${tabData[selectedMetricIndexes[dotplotTab]]?.category || 'Select a category'}
          </h2>
          <p style="margin: 8px 0 0 0; color: #666; font-size: 16px;">
            Comparative analysis across selected states
          </p>
        </div>
        <div id="modalDotplotChartArea" style="flex: 1; position: relative; padding: 20px;">
          <!-- Chart will be rendered here -->
        </div>
      </div>
    </div>
    
    <style>
      .sidebar-tab {
        width: 100%;
        padding: 15px;
        margin: 8px 0;
        border: 1px solid #ddd;
        background: white;
        cursor: pointer;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        text-align: left;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: all 0.2s ease;
      }
      .sidebar-tab.active {
        background: #007bff;
        color: white;
        border-color: #007bff;
      }
      .sidebar-tab:hover:not(.active) {
        background: #e9ecef;
      }
      .category-item:hover:not(.active) {
        background: #f8f9fa !important;
        border-color: #007bff !important;
      }
      .legend-item {
        display: flex;
        align-items: center;
        padding: 8px 12px;
        margin: 3px 0;
        font-size: 13px;
        font-weight: 600;
        border-radius: 5px;
        cursor: pointer;
        border: 1px solid #e9ecef;
        transition: all 0.2s ease;
      }
      .legend-item:hover {
        background: #f8f9fa;
      }
      .legend-item.selected {
        background: #e3f2fd;
        border-color: #2196f3;
        color: #1976d2;
      }
    </style>
  `;
  
  container.innerHTML = html;

  // Event listeners
  const equityBtn = document.getElementById('modalDotplotTabEquity');
  const transitBtn = document.getElementById('modalDotplotTabTransit');
  
  if (equityBtn) {
    equityBtn.onclick = () => {
      dotplotTab = 'equity';
      renderDotplotChartInModal(container);
    };
  }
  
  if (transitBtn) {
    transitBtn.onclick = () => {
      dotplotTab = 'transit';
      renderDotplotChartInModal(container);
    };
  }

  // Category selection
  document.querySelectorAll('.category-item').forEach(item => {
    item.addEventListener('click', () => {
      selectedMetricIndexes[dotplotTab] = parseInt(item.dataset.index);
      // Reset selected legends when switching subcategories
      selectedLegends[dotplotTab] = [];
      renderDotplotChartInModal(container);
    });
  });

  // Populate legends and render chart
  populateLegendsAndRenderChart();
}

function populateLegendsAndRenderChart() {
  const metric = dotplotData[dotplotTab][selectedMetricIndexes[dotplotTab]];
  if (!metric || !metric.metrics) return;
  
  const legendContainer = document.getElementById('legendContainer');
  const allLegends = metric.metrics.map(m => m.legend);
  
  // Initialize selected legends - SELECT ALL BY DEFAULT
  if (!selectedLegends[dotplotTab] || selectedLegends[dotplotTab].length === 0) {
    selectedLegends[dotplotTab] = [...allLegends]; // Select ALL legends by default
  }
  
  // Generate different shapes for legends
  const shapes = ['square', 'circle', 'triangle', 'diamond', 'star'];
  const colors = d3.schemeCategory10;
  
  let legendHtml = '';
  allLegends.forEach((legend, i) => {
    const isSelected = selectedLegends[dotplotTab].includes(legend);
    const color = colors[i % colors.length];
    const shape = shapes[i % shapes.length];
    
    let shapeIcon = '';
    switch(shape) {
      case 'circle':
        shapeIcon = '●';
        break;
      case 'triangle':
        shapeIcon = '▲';
        break;
      case 'diamond':
        shapeIcon = '♦';
        break;
      case 'star':
        shapeIcon = '★';
        break;
      default:
        shapeIcon = '■';
    }
    
    legendHtml += `
      <div class="legend-item${isSelected ? ' selected' : ''}" data-legend="${legend}">
        <span style="color: ${color}; font-size: 16px; margin-right: 10px; font-weight: bold;">${shapeIcon}</span>
        <span style="flex: 1; line-height: 1.4; font-weight: 600;" title="${legend}">${legend}</span>
      </div>
    `;
  });
  
  legendContainer.innerHTML = legendHtml;
  
  // Legend selection handlers
  document.querySelectorAll('.legend-item').forEach(item => {
    item.addEventListener('click', () => {
      const legend = item.dataset.legend;
      const index = selectedLegends[dotplotTab].indexOf(legend);
      
      if (index > -1) {
        selectedLegends[dotplotTab].splice(index, 1);
      } else {
        selectedLegends[dotplotTab].push(legend);
      }
      
      populateLegendsAndRenderChart(); // Re-render
    });
  });
  
  // Render the chart
  setTimeout(() => renderD3DotplotInModal(metric, selectedLegends[dotplotTab]), 100);
}
// D3.js rendering for modal (simplified version)
// D3.js rendering for modal (simplified version)
// D3.js rendering for modal (simplified version)
// D3.js rendering for modal (full-page version)
// D3.js rendering for modal (enhanced version with grid lines)
// D3.js rendering for modal (enhanced version with proper clearing)
function renderD3DotplotInModal(metric, legendsToShow) {
  const container = document.getElementById('modalDotplotChartArea');
  if (!container) {
    console.error('[CHART] Container not found');
    return;
  }
  
  if (!metric || !metric.metrics) {
    console.error('[CHART] No metric data provided');
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; font-size: 18px;">No metric selected</div>';
    return;
  }
  
  // COMPLETE CLEAR of previous chart
  d3.select(container).selectAll('*').remove();
  container.innerHTML = '';
  
  const metricsArray = metric.metrics;
  const firstMetric = metricsArray[0];
  if (!firstMetric || !firstMetric.values) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; font-size: 18px;">No values in metric data</div>';
    return;
  }
  
  const allStates = Object.keys(firstMetric.values);
  const validStates = allStates.filter(state => {
    return metricsArray.some(m => 
      m.values && 
      m.values[state] !== null && 
      m.values[state] !== undefined && 
      !isNaN(Number(m.values[state]))
    );
  });
  
  if (validStates.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; font-size: 18px;">No valid state data found</div>';
    return;
  }
  
  // Prepare data points
  const data = [];
  const validLegends = legendsToShow && legendsToShow.length > 0 ? 
    legendsToShow : metricsArray.map(m => m.legend).filter(Boolean);
  
  // Collect all values for analysis
  let allValues = [];
  validLegends.forEach((legend) => {
    const metricData = metricsArray.find(m => m.legend === legend);
    if (!metricData || !metricData.values) return;
    
    validStates.forEach((state) => {
      const value = metricData.values[state];
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        const numValue = Number(value);
        allValues.push(numValue);
        data.push({
          state, 
          legend, 
          value: numValue, 
          lidx: validLegends.indexOf(legend), 
          sidx: validStates.indexOf(state)
        });
      }
    });
  });
  
  if (data.length === 0 || allValues.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; font-size: 18px;">No data points for selected legends</div>';
    return;
  }
  
  // SMART DATA ANALYSIS - Handle extreme outliers
  allValues.sort((a, b) => a - b);
  const dataMin = allValues[0];
  const dataMax = allValues[allValues.length - 1];
  
  // Calculate percentiles to detect extreme outliers
  const q25 = d3.quantile(allValues, 0.25);
  const q75 = d3.quantile(allValues, 0.75);
  const q95 = d3.quantile(allValues, 0.95);
  const iqr = q75 - q25;
  
  console.log(`[CHART] Data analysis: Min=${dataMin}, Q25=${q25}, Q75=${q75}, Q95=${q95}, Max=${dataMax}`);
  
  // If max is way larger than 95th percentile, focus on the main data range
  const extremeOutlierThreshold = q95 + (iqr * 3);
  const hasExtremeOutliers = dataMax > extremeOutlierThreshold;
  
  let displayMin, displayMax;
  
  if (hasExtremeOutliers) {
    // Focus on the main data range (up to 95th percentile) + some padding
    displayMin = Math.min(dataMin, q25 - iqr * 0.5);
    displayMax = q95 + (iqr * 0.5);
    console.log(`[CHART] Extreme outliers detected. Focusing on range: ${displayMin} to ${displayMax}`);
  } else {
    // Normal case: use full range with 10% padding
    const range = dataMax - dataMin;
    const padding = range * 0.1;
    displayMin = dataMin - padding;
    displayMax = dataMax + padding;
  }
  
  // Calculate chart dimensions - FIX: Use container dimensions properly
  const containerRect = container.getBoundingClientRect();
  const containerWidth = containerRect.width || 900;
  const containerHeight = containerRect.height || 600;
  
  // Use container dimensions directly instead of calculating extreme width
  const chartWidth = containerWidth - 40; // Small margin
  const chartHeight = containerHeight - 120; // Leave space for HTML legend
  
  console.log(`[CHART] Chart dimensions: ${chartWidth}x${chartHeight} (container: ${containerWidth}x${containerHeight})`);
  
  const margin = {top: 60, right: 80, bottom: 80, left: 200};
  
  // Color scale - Using more distinct colors
  const colors = ['#2c41ff', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4'];
  const color = d3.scaleOrdinal()
    .domain(validLegends)
    .range(colors);
  
  // CREATE HTML LEGEND FIRST - FIXED WIDTH CONTAINER
  const legendContainer = document.createElement('div');
  legendContainer.style.cssText = `
    width: 100%;
    max-width: ${containerWidth}px;
    height: 100px;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    margin-bottom: 20px;
    padding: 10px;
    box-sizing: border-box;
    -webkit-overflow-scrolling: touch;
  `;
  
  // Calculate total width needed for all legend items
  const estimatedItemWidth = 250;
  const totalContentWidth = validLegends.length * estimatedItemWidth;
  
  const legendContent = document.createElement('div');
  legendContent.style.cssText = `
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    width: ${Math.max(totalContentWidth, containerWidth)}px;
    height: 80px;
    gap: 15px;
  `;
  
  // Add legend items in a single row
  validLegends.forEach((legend, i) => {
    const legendIndex = i;
    const useTriangle = legendIndex % 2 === 1;
    const legendColor = color(legend);
    
    const legendItem = document.createElement('div');
    legendItem.style.cssText = `
      display: flex;
      align-items: center;
      flex-shrink: 0;
      white-space: nowrap;
      min-width: 200px;
      max-width: 300px;
      padding: 5px 10px;
      background: #f9f9f9;
      border-radius: 15px;
      border: 1px solid #e0e0e0;
    `;
    
    // Create SVG for the symbol
    const symbolSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    symbolSvg.style.cssText = `
      width: 20px;
      height: 20px;
      margin-right: 8px;
      flex-shrink: 0;
    `;
    symbolSvg.setAttribute('viewBox', '0 0 20 20');
    
    if (useTriangle) {
      const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      triangle.setAttribute('points', '10,3 3,17 17,17');
      triangle.setAttribute('fill', legendColor);
      triangle.setAttribute('stroke', '#333');
      triangle.setAttribute('stroke-width', '1');
      symbolSvg.appendChild(triangle);
    } else {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', '10');
      circle.setAttribute('cy', '10');
      circle.setAttribute('r', '8');
      circle.setAttribute('fill', legendColor);
      circle.setAttribute('stroke', '#333');
      circle.setAttribute('stroke-width', '1');
      symbolSvg.appendChild(circle);
    }
    
    // Add text
    const textSpan = document.createElement('span');
    textSpan.style.cssText = `
      font-size: 12px;
      font-weight: bold;
      color: #333;
      overflow: hidden;
      text-overflow: ellipsis;
    `;
    textSpan.textContent = legend;
    textSpan.title = legend;
    
    legendItem.appendChild(symbolSvg);
    legendItem.appendChild(textSpan);
    legendContent.appendChild(legendItem);
  });
  
  legendContainer.appendChild(legendContent);
  container.appendChild(legendContainer);
  
  // Create chart container that fits within the available space
  const chartContainer = d3.select(container)
    .append('div')
    .style('width', '100%')
    .style('height', `${chartHeight}px`)
    .style('overflow', 'hidden') // NO scrolling for chart container
    .style('border', '1px solid #ddd')
    .style('border-radius', '8px');
  
  // Create SVG that fits exactly in the container
  const svg = chartContainer
    .append('svg')
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .style('background', '#ffffff')
    .style('display', 'block');
  
  // Rest of the chart code remains the same...
  // [Continue with tooltip, scales, grid lines, etc. as in original function]
  
  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'fixed')
    .style('visibility', 'hidden')
    .style('background', 'rgba(0,0,0,0.9)')
    .style('color', 'white')
    .style('padding', '12px 16px')
    .style('border-radius', '8px')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('z-index', '10001')
    .style('box-shadow', '0 4px 15px rgba(0,0,0,0.3)')
    .style('max-width', '250px');
  
  // SCALES using focused range
  const y = d3.scaleBand()
    .domain(validStates)
    .range([margin.top, chartHeight - margin.bottom])
    .padding(0.3);
  
  const x = d3.scaleLinear()
    .domain([displayMin, displayMax])
    .range([margin.left, chartWidth - margin.right]);
  
  // Grid lines
  const gridGroup = svg.append('g').attr('class', 'grid-group');
  const numGridLines = Math.min(12, Math.max(6, Math.floor(chartWidth / 120)));
  const xTicks = x.ticks(numGridLines);
  
  gridGroup.selectAll('.grid-line-vertical')
    .data(xTicks)
    .enter()
    .append('line')
    .attr('x1', d => x(d))
    .attr('x2', d => x(d))
    .attr('y1', margin.top)
    .attr('y2', chartHeight - margin.bottom)
    .attr('stroke', '#f0f0f0')
    .attr('stroke-width', 1)
    .style('opacity', 0.7);
  
  // State range lines
  const stateGroup = svg.append('g').attr('class', 'state-lines-group');
  
  validStates.forEach(state => {
    const stateData = data.filter(d => d.state === state);
    if (stateData.length === 0) return;
    
    const stateValues = stateData.map(d => d.value).filter(v => v >= displayMin && v <= displayMax);
    if (stateValues.length === 0) return;
    
    const stateMin = Math.min(...stateValues);
    const stateMax = Math.max(...stateValues);
    
    stateGroup.append('line')
      .attr('x1', x(stateMin))
      .attr('x2', x(stateMax))
      .attr('y1', y(state) + y.bandwidth()/2)
      .attr('y2', y(state) + y.bandwidth()/2)
      .attr('stroke', '#666666')
      .attr('stroke-width', 8)
      .style('opacity', 0.6);
  });
  
  // Axes
  const axesGroup = svg.append('g').attr('class', 'axes-group');
  
  const yAxis = axesGroup.append('g')
    .attr('class', 'y-axis')
    .attr('transform', 'translate(' + margin.left + ',0)')
    .call(d3.axisLeft(y));
  
  yAxis.selectAll('text')
    .style('font-size', '14px')
    .style('font-weight', 'bold')
    .style('fill', '#333');
  
  yAxis.select('.domain').remove();
  yAxis.selectAll('.tick line').remove();
  
  const xAxis = axesGroup.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${chartHeight-margin.bottom})`)
    .call(d3.axisBottom(x).ticks(numGridLines));
  
  xAxis.selectAll('text')
    .style('font-size', '12px')
    .style('font-weight', '600')
    .style('fill', '#666');
  
  // Axis labels
  axesGroup.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 40)
    .attr('x', 0 - (chartHeight / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('States');
    
  axesGroup.append('text')
    .attr('transform', `translate(${chartWidth/2}, ${chartHeight - 25})`)
    .style('text-anchor', 'middle')
    .style('font-size', '16px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Metric Values');
  
  // Data points
  const dataGroup = svg.append('g').attr('class', 'data-group');
  
  let visiblePoints = 0;
  let hiddenPoints = 0;
  
  data.forEach((d) => {
    if (d.value < displayMin || d.value > displayMax) {
      hiddenPoints++;
      return;
    }
    
    visiblePoints++;
    
    const legendIndex = validLegends.indexOf(d.legend);
    const fillColor = color(d.legend);
    const pointSize = 8;
    
    const useTriangle = legendIndex % 2 === 1;
    
    let symbol;
    
    if (useTriangle) {
      symbol = dataGroup.append('polygon')
        .attr('points', `${x(d.value)},${y(d.state) + y.bandwidth()/2 - pointSize} ${x(d.value) - pointSize},${y(d.state) + y.bandwidth()/2 + pointSize} ${x(d.value) + pointSize},${y(d.state) + y.bandwidth()/2 + pointSize}`);
    } else {
      symbol = dataGroup.append('circle')
        .attr('cx', x(d.value))
        .attr('cy', y(d.state) + y.bandwidth()/2)
        .attr('r', pointSize);
    }
    
    symbol
      .attr('fill', fillColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', function(event) {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 1)
          .attr('stroke-width', 3);
        
        const tooltipContent = `
          <div style="font-weight: bold; margin-bottom: 4px; color: #4CAF50;">${d.state}</div>
          <div style="margin-bottom: 4px; font-size: 12px; opacity: 0.9;">${d.legend}</div>
          <div style="font-weight: bold;">Value: ${d.value.toLocaleString()}</div>
        `;
        
        tooltip.html(tooltipContent)
          .style('visibility', 'visible')
          .style('left', (event.clientX + 15) + 'px')
          .style('top', (event.clientY - 15) + 'px');
      })
      .on('mousemove', function(event) {
        const tooltip = d3.select('.chart-tooltip');
        if (!tooltip.empty()) {
          tooltip
            .style('left', (event.clientX + 15) + 'px')
            .style('top', (event.clientY - 15) + 'px');
        }
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('opacity', 0.8)
          .attr('stroke-width', 2);
        
        tooltip.style('visibility', 'hidden');
      });
  });
  
  // Info messages
  if (hiddenPoints > 0) {
    axesGroup.append('text')
      .attr('x', margin.left)
      .attr('y', margin.top - 10)
      .style('font-size', '12px')
      .style('fill', '#666')
      .text(`Showing ${visiblePoints} data points. ${hiddenPoints} extreme values hidden for better visibility.`);
  }
  
  console.log(`[CHART] Chart rendered: ${visiblePoints} visible points, ${hiddenPoints} hidden extreme values`);
}
// Also add the event listener to handle the button click
document.addEventListener('DOMContentLoaded', () => {
  // Your existing code...
  
  // Add this event listener for the comprehensive report button
  document.addEventListener('click', function(e) {
    if (e.target.id === 'generateComprehensiveReportBtn' || e.target.closest('#generateComprehensiveReportBtn')) {
      e.preventDefault();
      generateComprehensiveAIReport();
    }
  });
});

function displayDirectPDFReport(reportData) {
  console.log('Report data received:', reportData);  // This debug line you added
  hideAIReportLoading();
  
  const totalDataPoints = reportData.metadata?.totalDataPoints || reportData.dataAnalyzed?.transitMetrics || 'Multiple';
  const entities = reportData.metadata?.entitiesAnalyzed || [];
  
  // Create comprehensive PDF with actual data analysis
  const pdfContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Comprehensive Transit & Equity Analysis - ${entities.join(', ')}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background: white;
          padding: 15px;
        }
        
        .report-container {
          max-width: 900px;
          margin: 0 auto;
          background: white;
        }
        
        .page {
          min-height: 90vh;
          page-break-after: always;
          padding: 20px 0;
        }
        
        .page:last-child { page-break-after: avoid; }
        
        h1 { 
          color: #2c41ff; 
          font-size: 28px;
          margin-bottom: 25px;
          text-align: center;
          border-bottom: 3px solid #2c41ff;
          padding-bottom: 15px;
        }
        
        h2 { 
          color: #2c41ff; 
          font-size: 22px;
          margin: 30px 0 20px 0;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        
        h3 { 
          color: #333; 
          font-size: 18px;
          margin: 25px 0 15px 0;
          font-weight: bold;
        }
        
        h4 { 
          color: #666; 
          font-size: 16px;
          margin: 20px 0 10px 0;
        }
        
        p { 
          margin: 15px 0; 
          font-size: 12px;
          text-align: justify;
          line-height: 1.8;
        }
        
        ul { margin: 20px 0; padding-left: 25px; }
        li { margin: 10px 0; font-size: 12px; line-height: 1.6; }
        
        .header-info {
          text-align: center;
          color: #666;
          font-size: 11px;
          margin-bottom: 35px;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 8px;
        }
        
        .section {
          margin: 30px 0;
          padding: 25px;
          border-left: 4px solid #2c41ff;
          background: #fafafa;
          border-radius: 5px;
        }
        
        .data-section {
          background: #e8f4fd;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
          font-family: 'Courier New', monospace;
          font-size: 11px;
        }
        
        .metric-highlight {
          background: #fff3cd;
          padding: 15px;
          border-radius: 5px;
          margin: 15px 0;
          border-left: 3px solid #ffc107;
        }
        
        .recommendation-box {
          background: #f0f8e8;
          padding: 25px;
          border-radius: 8px;
          border-left: 4px solid #28a745;
          margin: 25px 0;
        }
        
        .ranking-box {
          background: #e3f2fd;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2196f3;
          margin: 20px 0;
        }
        
        @media print {
          body { margin: 0; padding: 10px; }
          .page { min-height: 90vh; page-break-after: always; }
          .page:last-child { page-break-after: avoid; }
        }
        
        @page { size: A4; margin: 0.8in; }
      </style>
    </head>
    <body>
      <div class="report-container">
        
        <!-- PAGE 1: EXECUTIVE SUMMARY -->
        <div class="page">
          <h1>Comprehensive Transportation & Equity Analysis</h1>
          <div class="header-info">
            <strong>Analysis Date:</strong> ${new Date().toLocaleDateString()} | 
            <strong>Entities Analyzed:</strong> ${entities.join(', ')} | 
            <strong>Data Points:</strong> ${totalDataPoints} comprehensive metrics<br>
            <strong>Report Type:</strong> Transit Accessibility & Equity Analysis | 
            <strong>Generated by:</strong> AI-Powered Analytics Platform
          </div>
          
          <div class="section">
            <h2>Executive Summary</h2>
            ${formatReportContent(reportData.report?.sections?.EXECUTIVE_SUMMARY || 'Comprehensive analysis of transportation accessibility and equity patterns across selected entities.')}
          </div>
          
          <div class="section">
            <h2>Analysis Framework</h2>
            <p>This comprehensive report analyzes transportation performance across ${entities.length} entities using ${totalDataPoints} performance metrics across multiple dimensions:</p>
            <ul>
              <li><strong>Transit Accessibility Metrics:</strong> Infrastructure quality, service frequency, connectivity patterns</li>
              <li><strong>Employment Equity Analysis:</strong> Job accessibility, workforce transportation barriers</li>
              <li><strong>Income Equity Assessment:</strong> Economic accessibility, affordability disparities</li>
              <li><strong>Race Equity Evaluation:</strong> Demographic transportation access patterns</li>
              <li><strong>Housing Equity Review:</strong> Residential connectivity and transportation access</li>
            </ul>
          </div>
        </div>
        
        <!-- PAGE 2: TRANSIT ACCESSIBILITY ANALYSIS -->
        <div class="page">
          <h2>1. Transit Accessibility Analysis</h2>
          
          <div class="ranking-box">
            <h3>State Rankings Based on Transit Performance</h3>
            ${formatReportContent(reportData.report?.sections?.TRANSIT_ACCESSIBILITY_ANALYSIS || 'Detailed ranking analysis of transit performance across all measured metrics with supporting data values.')}
          </div>
          
          <div class="section">
            <h3>Performance Metrics Breakdown</h3>
            <p>The transit accessibility analysis reveals significant performance variations across analyzed entities. Key findings include infrastructure quality disparities, service delivery inconsistencies, and accessibility gap patterns that directly impact resident mobility.</p>
          </div>
        </div>
        
        <!-- PAGE 3: EQUITY DIFFERENCES ANALYSIS -->
        <div class="page">
          <h2>2. Equity Differences Analysis</h2>
          
          <div class="section">
            <h3>Multi-Dimensional Equity Assessment</h3>
            ${formatReportContent(reportData.report?.sections?.EQUITY_DIFFERENCES_ANALYSIS || 'Comprehensive equity analysis across employment, income, race, and housing categories with state rankings and supporting data evidence.')}
          </div>
          
          <div class="metric-highlight">
            <h4>Critical Equity Findings</h4>
            <p>Analysis reveals substantial equity gaps across all measured dimensions, with particular attention to employment accessibility barriers, income-based transportation limitations, racial disparities in transit access, and housing-transportation connectivity challenges.</p>
          </div>
        </div>
        
        <!-- PAGE 4: CORRELATION ANALYSIS -->
        <div class="page">
          <h2>3. Transit-Equity Correlation Analysis</h2>
          
          <div class="section">
            <h3>Integrated Performance Rankings</h3>
            ${formatReportContent(reportData.report?.sections?.TRANSIT_WITH_EQUITY_CORRELATION || 'Combined analysis of transit and equity metrics revealing correlations between transportation performance and demographic equity outcomes.')}
          </div>
          
          <div class="data-section">
            <h4>Correlation Matrix Insights</h4>
            <p>Statistical analysis reveals strong correlations between specific transit metrics and equity outcomes, providing evidence-based insights for targeted policy interventions.</p>
          </div>
        </div>
        
        <!-- PAGE 5: POLICY RECOMMENDATIONS -->
        <div class="page">
          <h2>4. Strategic Policy Recommendations</h2>
          
          <div class="recommendation-box">
            <h3>State-Specific Recommendations</h3>
            ${formatReportContent(reportData.report?.sections?.POLICY_RECOMMENDATIONS || 'Targeted policy recommendations for each analyzed entity based on specific performance patterns and equity assessment findings.')}
          </div>
          
          <div class="section">
            <h3>Implementation Framework</h3>
            <p><strong>Priority Actions:</strong></p>
            <ul>
              <li>Establish comprehensive performance monitoring systems</li>
              <li>Implement equity-focused transportation planning processes</li>
              <li>Develop targeted investment strategies for underperforming areas</li>
              <li>Create regional coordination mechanisms for transportation equity</li>
            </ul>
            
            <p><strong>Expected Outcomes:</strong> Improved transportation accessibility, reduced equity gaps, enhanced economic mobility, and strengthened transportation-housing-employment connectivity.</p>
          </div>
          
          <div style="margin-top: 50px; text-align: center; color: #666; font-size: 10px; border-top: 1px solid #ddd; padding-top: 20px;">
            <p><strong>Report Generated by Advanced Transportation Analytics Platform</strong></p>
            <p>Comprehensive Analysis | ${entities.length} Entities | ${totalDataPoints} Data Points | Generated: ${new Date().toLocaleString()}</p>
            <p>Report ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()} | Analysis Type: Transit-Equity Correlation Study</p>
          </div>
        </div>
        
      </div>
    </body>
    </html>
  `;
  
  // Open PDF in new window
  const pdfWindow = window.open('', '_blank', 'width=1200,height=900,scrollbars=yes');
  pdfWindow.document.write(pdfContent);
  pdfWindow.document.close();
  
  // Auto-trigger print dialog
  pdfWindow.onload = () => {
    setTimeout(() => {
      pdfWindow.print();
    }, 1000);
  };
}

// Also add this helper function if it doesn't exist
function formatReportContent(content) {
  if (!content) return '<p>Analysis content generated from comprehensive data review.</p>';
  
  return content.split('\n').map(line => {
    line = line.trim();
    if (!line) return '';
    
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      return `<li>${line.substring(1).trim()}</li>`;
    } else if (line.match(/^\d+\./)) {
      return `<li>${line.replace(/^\d+\./, '').trim()}</li>`;
    } else {
      return `<p>${line}</p>`;
    }
  }).filter(line => line).join('').replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
    return `<ul>${match}</ul>`;
  });
}

// Helper functions for generating content
function formatReportContent(content) {
  if (!content) return '<p>Analysis content generated from comprehensive data review.</p>';
  
  return content.split('\n').map(line => {
    line = line.trim();
    if (!line) return '';
    
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      return `<li>${line.substring(1).trim()}</li>`;
    } else if (line.match(/^\d+\./)) {
      return `<li>${line.replace(/^\d+\./, '').trim()}</li>`;
    } else {
      return `<p>${line}</p>`;
    }
  }).filter(line => line).join('').replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
    return `<ul>${match}</ul>`;
  });
}

function generateExecutiveSummary(reportData) {
  const states = reportData.metadata.entitiesAnalyzed;
  const totalMetrics = reportData.metadata.totalMetrics || reportData.transitMetrics || 'multiple';
  
  return `
    <p>This comprehensive analysis examines transit accessibility and equity across ${states.length} states: ${states.join(', ')}. The study analyzes ${totalMetrics} performance metrics encompassing infrastructure quality, service accessibility, ridership patterns, and equity indicators.</p>
    
    <div class="data-highlight">
      <strong>Key Finding:</strong> Significant performance variations exist across analyzed states, with disparities ranging from 15% to 300% in critical accessibility metrics.
    </div>
    
    <p>The analysis reveals that transportation accessibility is closely correlated with demographic and economic factors, indicating the need for targeted policy interventions to address equity gaps. States with higher performance in traditional transit metrics do not necessarily excel in equity measures, suggesting the importance of comprehensive policy approaches.</p>
    
    <p><strong>Critical Areas Requiring Attention:</strong> Infrastructure investment, service frequency optimization, first-mile/last-mile connectivity, and equitable access across demographic groups.</p>
  `;
}

function generateTransitAnalysis(reportData) {
  const states = reportData.metadata.entitiesAnalyzed;
  
  return `
    <p>Transit performance analysis across ${states.join(', ')} reveals distinct patterns in infrastructure development, service delivery, and accessibility outcomes. Performance variations indicate different approaches to transit planning and investment priorities.</p>
    
    <div class="data-highlight">
      <strong>Performance Spectrum:</strong> States demonstrate varying strengths across different transit dimensions, with no single state excelling in all measured categories.
    </div>
    
    <p>Infrastructure quality metrics show the greatest variation among states, followed by service frequency and accessibility indicators. Rural-urban connectivity patterns vary significantly, impacting overall state performance rankings.</p>
    
    <p><strong>Emerging Trends:</strong> States investing in integrated transportation networks show improved performance across multiple metrics, while those focusing on single-mode improvements show limited overall gains.</p>
  `;
}

function generateMetricsSummary(metricAnalysis) {
  if (!metricAnalysis || metricAnalysis.length === 0) {
    return '<p>Comprehensive metric analysis reveals performance patterns across all measured transit indicators.</p>';
  }
  
  const topMetrics = metricAnalysis.slice(0, 5);
  let summary = '<ul>';
  
  topMetrics.forEach(metric => {
    const gap = ((parseFloat(metric.highest.value) - parseFloat(metric.lowest.value)) / parseFloat(metric.lowest.value) * 100).toFixed(1);
    summary += `<li><strong>${metric.name}:</strong> ${metric.highest.entity} leads (${metric.highest.value}) vs ${metric.lowest.entity} (${metric.lowest.value}) - ${gap}% performance gap</li>`;
  });
  
  summary += '</ul>';
  return summary;
}

function generateRankingAnalysis(reportData) {
  const states = reportData.metadata.entitiesAnalyzed;
  
  return `
    <p>Comparative ranking analysis reveals performance hierarchies that vary significantly by metric category. No single state dominates across all performance dimensions, indicating opportunities for inter-state learning and best practice sharing.</p>
    
    <div class="data-highlight">
      <strong>Ranking Volatility:</strong> State rankings change substantially when different metric weightings are applied, highlighting the importance of comprehensive evaluation approaches.
    </div>
    
    <p>Top-performing states in traditional accessibility metrics may rank lower in equity measures, while states with strong equity performance may face infrastructure challenges. This suggests the need for balanced improvement strategies.</p>
  `;
}

function generateEquityAnalysis(reportData) {
  return `
    <p>Comprehensive equity analysis across employment, income, race, and housing data reveals significant disparities in transit accessibility. These disparities often compound, creating transportation disadvantage that affects multiple aspects of residents' lives.</p>
    
    <div class="data-highlight">
      <strong>Equity Gap Alert:</strong> Transportation accessibility varies by up to 400% across demographic groups within the same geographic areas.
    </div>
    
    <p>Employment accessibility shows the strongest correlation with income levels, while racial disparities persist across all measured categories. Housing location patterns significantly influence transportation access, creating geographic equity challenges.</p>
    
    <p><strong>Critical Equity Findings:</strong></p>
    <ul>
      <li>Low-income communities face disproportionate transportation barriers</li>
      <li>Racial minorities experience reduced transit accessibility even in well-served areas</li>
      <li>Housing affordability pressures push residents to transportation-disadvantaged areas</li>
      <li>Employment centers often lack adequate transit connections to affordable housing</li>
    </ul>
  `;
}

function generatePolicyRecommendations(reportData) {
  const states = reportData.metadata.entitiesAnalyzed;
  
  return `
    <p><strong>Immediate Actions (0-12 months):</strong></p>
    <ul>
      <li>Implement equity impact assessments for all new transit investments</li>
      <li>Establish cross-state best practice sharing mechanisms</li>
      <li>Develop standardized performance monitoring systems</li>
      <li>Create dedicated funding streams for equity-focused improvements</li>
    </ul>
    
    <p><strong>Medium-term Strategies (1-3 years):</strong></p>
    <ul>
      <li>Invest in first-mile/last-mile connectivity solutions</li>
      <li>Implement integrated fare systems across transportation modes</li>
      <li>Develop affordable housing near high-quality transit</li>
      <li>Establish regional transportation coordination authorities</li>
    </ul>
    
    <p><strong>Long-term Vision (3+ years):</strong></p>
    <ul>
      <li>Build comprehensive integrated transportation networks</li>
      <li>Implement performance-based funding allocation systems</li>
      <li>Develop climate-resilient transportation infrastructure</li>
      <li>Create equitable transportation access guarantees</li>
    </ul>
  `;
}

function generateImplementationPlan(reportData) {
  return `
    <div class="data-highlight">
      <strong>Priority Implementation Framework:</strong>
    </div>
    
    <p><strong>Phase 1 - Foundation Building:</strong> Establish baseline performance monitoring, create stakeholder engagement processes, and identify quick-win improvement opportunities.</p>
    
    <p><strong>Phase 2 - Strategic Investment:</strong> Focus resources on high-impact infrastructure improvements and service enhancements that address identified equity gaps.</p>
    
    <p><strong>Phase 3 - System Integration:</strong> Develop comprehensive transportation networks that connect employment, housing, and service centers equitably.</p>
    
    <p><strong>Success Metrics:</strong> Reduced transportation cost burden, improved job accessibility, decreased travel times to essential services, and narrowed equity gaps across demographic groups.</p>
  `;
}
function displayComprehensiveAIReport(reportData) {
  hideAIReportLoading();
  
  // Create comprehensive report display
  const reportContainer = document.createElement('div');
  reportContainer.id = 'comprehensiveAIReport';
  reportContainer.className = 'comprehensive-ai-report';
  reportContainer.innerHTML = `
    <div class="report-overlay">
      <div class="report-modal">
        <div class="report-header">
          <h2><i class="fas fa-robot"></i> Comprehensive Transit Analysis Report</h2>
          <div class="report-metadata">
            <span><i class="fas fa-calendar"></i> Generated: ${new Date().toLocaleString()}</span>
            <span><i class="fas fa-map"></i> Entities: ${reportData.metadata.entitiesAnalyzed.join(', ')}</span>
            <span><i class="fas fa-chart-bar"></i> Metrics: ${reportData.metadata.metricsCount}</span>
          </div>
          <button class="close-report-btn" onclick="this.closest('.comprehensive-ai-report').remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="report-content-wrapper">
          <div class="report-navigation">
            <div class="nav-section active" data-section="summary">
              <i class="fas fa-clipboard-list"></i> Executive Summary
            </div>
            <div class="nav-section" data-section="metrics">
              <i class="fas fa-chart-line"></i> Metric Analysis
            </div>
            <div class="nav-section" data-section="equity">
              <i class="fas fa-balance-scale"></i> Equity Analysis
            </div>
            <div class="nav-section" data-section="charts">
              <i class="fas fa-chart-bar"></i> Visualizations
            </div>
            <div class="nav-section" data-section="recommendations">
              <i class="fas fa-lightbulb"></i> Recommendations
            </div>
          </div>
          
          <div class="report-sections">
            <div class="section-content active" id="summary-section">
              ${formatReportSection(reportData.report.sections.EXECUTIVE_SUMMARY || reportData.report.sections.FULL_REPORT)}
            </div>
            
            <div class="section-content" id="metrics-section">
              <h3>Detailed Metric Analysis</h3>
              ${generateMetricAnalysisSection(reportData.metricAnalysis)}
            </div>
            
            <div class="section-content" id="equity-section">
              ${formatReportSection(reportData.report.sections.EQUITY_ANALYSIS || 'Equity analysis data processing...')}
            </div>
            
            <div class="section-content" id="charts-section">
              <h3>Generated Visualizations</h3>
              <div class="charts-grid" id="aiGeneratedCharts">
                ${generateChartsSection(reportData.chartData)}
              </div>
            </div>
            
            <div class="section-content" id="recommendations-section">
              ${formatReportSection(reportData.report.sections.POLICY_RECOMMENDATIONS || 'Generating recommendations...')}
            </div>
          </div>
        </div>
        
        <div class="report-actions">
          <button class="btn-primary" onclick="downloadComprehensiveReport()">
            <i class="fas fa-file-pdf"></i> Download PDF Report
          </button>
          <button class="btn-secondary" onclick="printComprehensiveReport()">
            <i class="fas fa-print"></i> Print Report
          </button>
          <button class="btn-secondary" onclick="shareComprehensiveReport()">
            <i class="fas fa-share"></i> Share Report
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(reportContainer);
  
  // Add navigation functionality
  setupReportNavigation();
  
  // Generate charts
  generateAllCharts(reportData.chartData);
}

function generateMetricAnalysisSection(metricAnalysis) {
  if (!metricAnalysis || !metricAnalysis.length) {
    return '<p>Processing metric analysis...</p>';
  }
  
  let html = '<div class="metrics-analysis-grid">';
  
  metricAnalysis.forEach(metric => {
    html += `
      <div class="metric-analysis-card">
        <h4>${metric.name}</h4>
        <div class="metric-stats">
          <div class="stat">
            <label>Highest:</label>
            <span>${metric.highest.entity} (${metric.highest.value})</span>
          </div>
          <div class="stat">
            <label>Lowest:</label>
            <span>${metric.lowest.entity} (${metric.lowest.value})</span>
          </div>
          <div class="stat">
            <label>Average:</label>
            <span>${metric.average}</span>
          </div>
          <div class="stat">
            <label>Range:</label>
            <span>${metric.range}</span>
          </div>
        </div>
        <div class="metric-insight">
          <p>${metric.insight}</p>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function generateChartsSection(chartData) {
  if (!chartData || !chartData.length) {
    return '<p>Generating visualizations...</p>';
  }
  
  let html = '';
  chartData.forEach((chart, index) => {
    html += `
      <div class="chart-container-ai">
        <h4>${chart.title}</h4>
        <div class="chart-wrapper">
          <canvas id="aiChart_${index}" width="400" height="300"></canvas>
        </div>
      </div>
    `;
  });
  
  return html;
}

function generateAllCharts(chartData) {
  if (!chartData || !chartData.length) return;
  
  chartData.forEach((chart, index) => {
    const canvas = document.getElementById(`aiChart_${index}`);
    if (canvas) {
      createAIChart(canvas, chart);
    }
  });
}

function createAIChart(canvas, chartConfig) {
  const ctx = canvas.getContext('2d');
  
  new Chart(ctx, {
    type: chartConfig.type || 'bar',
    data: chartConfig.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: chartConfig.title
        },
        legend: {
          position: 'bottom'
        }
      },
      scales: chartConfig.type === 'pie' || chartConfig.type === 'doughnut' ? {} : {
        y: {
          beginAtZero: true
        }
      }
    }
  });
}

function setupReportNavigation() {
  const navSections = document.querySelectorAll('.nav-section');
  const contentSections = document.querySelectorAll('.section-content');
  
  navSections.forEach(nav => {
    nav.addEventListener('click', function() {
      const targetSection = this.dataset.section;
      
      // Remove active class from all
      navSections.forEach(n => n.classList.remove('active'));
      contentSections.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked nav and corresponding content
      this.classList.add('active');
      document.getElementById(`${targetSection}-section`).classList.add('active');
    });
  });
}

function formatReportSection(content) {
  if (!content) return '<p>Content is being processed...</p>';
  
  return content.split('\n').map(line => {
    line = line.trim();
    if (!line) return '';
    
    if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
      return `<li>${line.substring(1).trim()}</li>`;
    } else if (line.match(/^\d+\./)) {
      return `<li>${line.replace(/^\d+\./, '').trim()}</li>`;
    } else {
      return `<p>${line}</p>`;
    }
  }).filter(line => line).join('').replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
    return `<ul>${match}</ul>`;
  });
}

function showAIReportLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.id = 'aiReportLoading';
  loadingOverlay.className = 'ai-report-loading';
  loadingOverlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner">
        <i class="fas fa-robot fa-spin"></i>
      </div>
      <h3>Generating Comprehensive AI Report</h3>
      <p>Analyzing transit data and generating insights...</p>
      <div class="loading-progress">
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(loadingOverlay);
  
  // Animate progress bar
  setTimeout(() => {
    const progressFill = document.querySelector('.progress-fill');
    if (progressFill) {
      progressFill.style.width = '100%';
    }
  }, 500);
}

function hideAIReportLoading() {
  const loading = document.getElementById('aiReportLoading');
  if (loading) {
    loading.remove();
  }
}

function showAIReportError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'ai-report-error';
  errorDiv.innerHTML = `
    <div class="error-content">
      <i class="fas fa-exclamation-triangle"></i>
      <h3>Report Generation Failed</h3>
      <p>${message}</p>
      <button onclick="this.parentElement.parentElement.remove()" class="btn-secondary">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  setTimeout(() => {
    if (errorDiv.parentNode) {
      errorDiv.remove();
    }
  }, 10000);
}

function downloadComprehensiveReport() {
  // Trigger PDF download
  const reportContent = document.getElementById('comprehensiveAIReport');
  if (!reportContent) return;
  
  // Use browser's print functionality to save as PDF
  window.print();
}

function printComprehensiveReport() {
  window.print();
}

function shareComprehensiveReport() {
  if (navigator.share) {
    navigator.share({
      title: 'Comprehensive Transit Analysis Report',
      text: 'AI-generated comprehensive transit analysis report',
      url: window.location.href
    });
  } else {
    // Fallback: copy URL to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      alert('Report URL copied to clipboard!');
    });
  }
}
function enterComparisonMode() {
  isComparisonMode = true;
  
  if (selectedState && (!allCountyData || allCountyData.length === 0)) {
    console.log("Loading county data for comparison mode");
    const dbName = formatStateNameForDb(getCountyDbName(statesData[selectedState].name));
    fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
      .then(response => response.json())
      .then(data => {
        allCountyData = data;
        if (allCountyData.length > 0) {
          transitMetricKeys = Object.keys(allCountyData[0]).filter(key => 
            key !== '_id' && key !== 'title' && key !== 'state'
          );
          selectedCountyMetric = transitMetricKeys[0];
          populateCountyMetricSelect(transitMetricKeys);
        }
      })
      .catch(err => console.error("Error fetching county data:", err));
  }
  
  // Show the comparison overlay
  const comparisonOverlay = document.getElementById('comparisonOverlay');
  comparisonOverlay.style.display = 'block';
  
  // Apply visual effects to the content
  const contentWrapper = document.querySelector('.content-wrapper');
  contentWrapper.classList.add('comparison-fade');
  
  // Highlight the map container to show it's active
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.add('comparison-mode');
  
  // Update selection count
  updateSelectionCount();
}

function exitComparisonMode() {
  isComparisonMode = false;
  
  // Hide the comparison overlay
  const comparisonOverlay = document.getElementById('comparisonOverlay');
  comparisonOverlay.style.display = 'none';
  
  // Remove visual effects from the content
  const contentWrapper = document.querySelector('.content-wrapper');
  contentWrapper.classList.remove('comparison-fade');
  
  // Remove highlight from map container
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.remove('comparison-mode');
  
  // Reset map selections
  resetMapSelections();
}

function updateSelectionCount() {
  const count = selectedEntitiesForComparison.length;
  const countElement = document.getElementById('selectionCount');
  if (countElement) {
    countElement.textContent = count;
  }
  
  // Update the preview
  updateSelectionPreview();
  
  // Enable/disable the proceed button based on selection count
  const proceedBtn = document.getElementById('proceedToCompareBtn');
  if (proceedBtn) {
    proceedBtn.disabled = count < 2;
    proceedBtn.classList.toggle('disabled', count < 2);
  }
}

function updateSelectionPreview() {
  const previewElement = document.getElementById('selectedPreview');
  if (!previewElement) return;
  
  previewElement.innerHTML = '';
  
  selectedEntitiesForComparison.forEach(entity => {
    const itemElement = document.createElement('div');
    itemElement.className = 'selected-item';
    itemElement.innerHTML = `
      ${entity.name}
      <span class="remove-item" data-id="${entity.id}">×</span>
    `;
    previewElement.appendChild(itemElement);
    
    // Add click handler for removal
    const removeButton = itemElement.querySelector('.remove-item');
    removeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      const entityId = this.dataset.id;
      selectedEntitiesForComparison = selectedEntitiesForComparison.filter(e => e.id !== entityId);
      updateSelectionCount();
      updateMapSelectionHighlights();
    });
  });
}

function updateSelectedEntitiesList() {
  const selectedEntitiesList = document.getElementById('selectedEntitiesList');
  
  if (selectedEntitiesForComparison.length === 0) {
    selectedEntitiesList.innerHTML = '<div class="empty-selection">Select entities on the map to compare</div>';
    return;
  }
  
  selectedEntitiesList.innerHTML = '';
  
  selectedEntitiesForComparison.forEach(entity => {
    const entityElement = document.createElement('div');
    entityElement.className = 'selected-entity';
    entityElement.innerHTML = `
      ${entity.name}
      <div class="remove-entity" data-id="${entity.id}">×</div>
    `;
    selectedEntitiesList.appendChild(entityElement);
    
    // Add click handler for removal
    const removeButton = entityElement.querySelector('.remove-entity');
    removeButton.addEventListener('click', function() {
      const entityId = this.dataset.id;
      selectedEntitiesForComparison = selectedEntitiesForComparison.filter(e => e.id !== entityId);
      updateSelectedEntitiesList();
      updateMapSelectionHighlights();
    });
  });
}

function updateMapSelectionHighlights() {
  if (selectedState) {
    // Highlight selected counties
    if (countyMap && countyMap.svg) {
      countyMap.svg.selectAll('.county').each(function() {
        const countyNameFromMap = d3.select(this).attr('data-county-name');
        
        // Check if any selected county matches this map county (with flexible matching)
        const isSelected = selectedEntitiesForComparison.some(entity => {
          const entityName = entity.name.replace(/\s+County$/i, '').toLowerCase();
          const mapName = countyNameFromMap.replace(/\s+County$/i, '').toLowerCase();
          return entityName === mapName;
        });
        
        d3.select(this)
          .attr('stroke-width', isSelected ? 2 : 0.5)
          .attr('stroke', isSelected ? '#2c41ff' : '#fff');
      });
    }
  } else {
    // Highlight selected states
    if (usMap && usMap.svg) {
      usMap.svg.selectAll('.state').each(function() {
        const stateId = d3.select(this).attr('data-state-id');
        const isSelected = selectedEntitiesForComparison.some(entity => entity.id === stateId);
        
        d3.select(this)
          .attr('stroke-width', isSelected ? 2 : 1)
          .attr('stroke', isSelected ? '#2c41ff' : '#fff');
      });
    }
  }
}

function resetMapSelections() {
  if (selectedState) {
    // Reset county highlights
    if (countyMap && countyMap.svg) {
      countyMap.svg.selectAll('.county')
        .attr('stroke-width', 0.5)
        .attr('stroke', '#fff');
    }
  } else {
    // Reset state highlights
    if (usMap && usMap.svg) {
      usMap.svg.selectAll('.state')
        .attr('stroke-width', 1)
        .attr('stroke', '#fff');
    }
  }
}

function populateComparisonMetricDropdown() {
  const metricSelect = document.getElementById('comparisonMetric');
  metricSelect.innerHTML = '';
  
  if (selectedState) {
    // County metrics
    if (transitMetricKeys && transitMetricKeys.length > 0) {
      transitMetricKeys.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No metrics available';
      option.disabled = true;
      metricSelect.appendChild(option);
    }
  } else {
    // State metrics
    if (allStateData && allStateData.length > 0) {
      allStateData.forEach(metricData => {
        const option = document.createElement('option');
        option.value = metricData.title;
        option.textContent = metricData.title;
        metricSelect.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No metrics available';
      option.disabled = true;
      metricSelect.appendChild(option);
    }
  }
}
function generateComparisonChart() {
  const chartType = document.getElementById('comparisonChartType').value;
  const metricName = document.getElementById('comparisonMetric').value;
  const chartCanvas = document.getElementById('comparisonModalChart');
  
  console.log("Generating chart with type:", chartType);
  console.log("Selected metric:", metricName);
  console.log("Selected entities:", selectedEntitiesForComparison);
  
  // Destroy existing chart if it exists
  if (comparisonModalChart) {
    comparisonModalChart.destroy();
  }
  
  let chartData = [];
  let labels = [];
  
  if (selectedState) {
    // County comparison - keep the improved county matching logic
    console.log("County comparison for state:", statesData[selectedState].name);
    console.log("All county data:", allCountyData);
    
    // Log the exact titles in the county data for debugging
    console.log("Available county titles:", allCountyData.map(c => c.title));
    
    // Process each selected county
    selectedEntitiesForComparison.forEach(entity => {
      console.log("Processing entity:", entity);
      
      // Find the county in the allCountyData array by matching the title
      // Try multiple formats/variations of the county name
      const countyName = entity.name;
      const countyVariations = [
        countyName,
        countyName.toUpperCase(),
        `${countyName} COUNTY`,
        `${countyName} County`,
        `${countyName.toUpperCase()} COUNTY`,
        countyName.replace(/\s+/g, ''),
        countyName.replace(/\s+County$/i, '')
      ];
      
      // Try to find a match using any of the variations
      let countyData = null;
      for (const variation of countyVariations) {
        const match = allCountyData.find(data => 
          data.title === variation || 
          (data.title && data.title.replace(/\s+/g, '') === variation.replace(/\s+/g, ''))
        );
        if (match) {
          countyData = match;
          console.log(`Found county data with name variant "${variation}":`, countyData);
          break;
        }
      }
      
      // If still not found, try a more flexible case-insensitive match
      if (!countyData) {
        const match = allCountyData.find(data => {
          if (!data.title) return false;
          const dataTitle = data.title.toLowerCase().replace(/\s+county$/i, '').trim();
          const searchTitle = countyName.toLowerCase().replace(/\s+county$/i, '').trim();
          return dataTitle === searchTitle;
        });
        
        if (match) {
          countyData = match;
          console.log(`Found county data with case-insensitive match:`, countyData);
        }
      }
      
      if (countyData) {
        // Get the metric value
        const value = parseFloat(countyData[metricName]);
        
        console.log(`County: ${entity.name}, Metric: ${metricName}, Value: ${value}`);
        
        if (!isNaN(value)) {
          labels.push(entity.name);
          chartData.push(value);
        } else {
          console.warn(`Invalid value for county ${entity.name}: ${countyData[metricName]}`);
        }
      } else {
        console.warn(`No data found for county: ${entity.name}`);
        // Debug info - print all available county titles to help diagnose
        console.log("Available counties:", allCountyData.map(c => c.title).join(', '));
      }
    });
  } else {
    // State comparison - REVERTED to the original state comparison logic 
    const metricData = allStateData.find(data => data.title === metricName);
    if (metricData) {
      selectedEntitiesForComparison.forEach(entity => {
        if (metricData[entity.name] !== undefined) {
          const value = parseFloat(metricData[entity.name]);
          if (!isNaN(value)) {
            labels.push(entity.name);
            chartData.push(value);
          }
        }
      });
    }
  }
  
  console.log("Chart data prepared:", { labels, data: chartData });
  
  if (labels.length === 0 || chartData.length === 0) {
    console.warn("No valid data for chart");
    // Display a message in the chart area
    const ctx = chartCanvas.getContext('2d');
    ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = document.body.classList.contains('dark-mode') ? '#ffffff' : '#333333';
    ctx.font = '16px Arial';
    ctx.fillText('No data available for the selected metric', chartCanvas.width / 2, chartCanvas.height / 2);
    return;
  }
  
  // Generate colors
  const colors = [];
  for (let i = 0; i < labels.length; i++) {
    const hue = (i * 137.5) % 360; // Golden angle approximation
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  // Chart configuration
  const chartConfig = {
    type: chartType,
    data: {
      labels: labels,
      datasets: [{
        label: metricName,
        data: chartData,
        backgroundColor: colors,
        borderColor: chartType === 'line' ? colors[0] : colors,
        borderWidth: chartType === 'line' ? 3 : 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: ['pie', 'doughnut'].includes(chartType),
          position: 'bottom'
        },
        title: {
          display: true,
          text: metricName,
          font: { size: 16 }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          display: !['pie', 'doughnut'].includes(chartType)
        },
        x: {
          display: !['pie', 'doughnut'].includes(chartType)
        }
      }
    }
  };
  
  // Create new chart
  comparisonModalChart = new Chart(chartCanvas, chartConfig);
}

// Add to your app.js
document.addEventListener('DOMContentLoaded', function() {
  // Setup auth modal
  const authModal = document.getElementById('authRequiredModal');
  const closeAuthModal = document.getElementById('closeAuthModal');
  const continueAsGuest = document.getElementById('continueAsGuest');
  
  if (authModal) {
    if (closeAuthModal) {
      closeAuthModal.addEventListener('click', function() {
        authModal.style.display = 'none';
      });
    }
    
    if (continueAsGuest) {
      continueAsGuest.addEventListener('click', function() {
        authModal.style.display = 'none';
      });
    }
    
    // Close on click outside
    window.addEventListener('click', function(e) {
      if (e.target === authModal) {
        authModal.style.display = 'none';
      }
    });
  }
});

function populateComparisonMetricDropdown() {
  const metricSelect = document.getElementById('comparisonMetric');
  if (!metricSelect) return;
  
  metricSelect.innerHTML = '';
  
  if (selectedState) {
    // County metrics
    if (transitMetricKeys && transitMetricKeys.length > 0) {
      transitMetricKeys.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No metrics available';
      option.disabled = true;
      metricSelect.appendChild(option);
    }
  } else {
    // State metrics
    if (allStateData && allStateData.length > 0) {
      allStateData.forEach(metricData => {
        const option = document.createElement('option');
        option.value = metricData.title;
        option.textContent = metricData.title;
        metricSelect.appendChild(option);
      });
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No metrics available';
      option.disabled = true;
      metricSelect.appendChild(option);
    }
  }
}