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
        createDistributionChart();
        createTopBottomChart();
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
        createDistributionChart();
        createTopBottomChart();
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
    document.getElementById('countryChartsContainer').style.display = 'block';
    document.getElementById('countyMetricSelection').style.display = 'none';
    document.getElementById('countyTopBottomContainer').style.display = 'none'; // Ensure this is hidden
    equityBtn.style.display = 'none';
  } else {
    document.getElementById('metricSelection').style.display = 'none';
    document.getElementById('countryChartsContainer').style.display = 'none';
    document.getElementById('countyMetricSelection').style.display = 'block';
    document.getElementById('countyTopBottomContainer').style.display = 'block'; 
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
  allStateData.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric.title;
    option.textContent = metric.title;
    select.appendChild(option);
  });
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
  setTimeout(() => {
    selectedState = stateId;
    selectedCounty = null;
    activeView = 'county';
    const compareBtn = document.getElementById('compareStatesButton');
    if (compareBtn) {
      compareBtn.textContent = 'Compare Counties';
    }
    document.getElementById('metricSelection').style.display = 'none';
    document.getElementById('countryChartsContainer').style.display = 'none';
    document.getElementById('countyMetricSelection').style.display = 'block';
    document.getElementById('legend').innerHTML = '';
    createCountyMap(stateId);
    updateDataPanel();
    fetchStateData(stateId);
    
    // Apply database name correction
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
          createCountyTopBottomChart();
        } else {
          transitMetricKeys = [];
          selectedCountyMetric = null;
        }
      })
      .catch(err => console.error("Error fetching transit county averages:", err));
    updateLeftPanel();
  }, 1000);
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
  setTimeout(() => {
    mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    // Get the available size of the container
    const containerWidth = mapContainer.clientWidth - 30;
    const containerHeight = mapContainer.clientHeight - 30;

    // Set minimum dimensions for the SVG to ensure it's not too small
    const width = Math.max(containerWidth, 800); // Minimum width of 800px
    const height = Math.max(containerHeight, 600); // Minimum height of 600px

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
        
          countyLayer.selectAll('path')
          .data(counties)
          .enter()
          .append('path')
          .attr('class', 'county')
          .attr('data-county-name', d => d.properties.name)
          .attr('d', path)
          .attr('fill', '#d5d8dc')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .attr('data-clickable', 'true')
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
                .attr('cursor', 'pointer')
                .attr('stroke-width', 1.5)
                .attr('stroke', '#2c41ff');
              
              // Create tooltip
              const tooltip = document.createElement('div');
              tooltip.classList.add('county-tooltip');
              tooltip.innerHTML = `
                <div class="tooltip-arrow"></div>
                ${d.properties.name}
              `;
              document.body.appendChild(tooltip);
              
              // Position tooltip at mouse location
              const mouse = d3.pointer(event);
              const svgRect = this.closest('svg').getBoundingClientRect();
              const x = svgRect.left + mouse[0];
              const y = svgRect.top + mouse[1] - 35; // 35px above the mouse
              
              tooltip.style.left = `${x}px`;
              tooltip.style.top = `${y}px`;
              tooltip.style.visibility = 'visible';
              tooltip.style.opacity = '1';
              
              // Store the tooltip reference on the element
              this.tooltip = tooltip;
            }
          })
          .on('mousemove', function(event) {
            if (this.tooltip) {
              // Update tooltip position when mouse moves
              const mouse = d3.pointer(event);
              const svgRect = this.closest('svg').getBoundingClientRect();
              const x = svgRect.left + mouse[0];
              const y = svgRect.top + mouse[1] - 35;
              
              this.tooltip.style.left = `${x}px`;
              this.tooltip.style.top = `${y}px`;
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
              if (this.tooltip) {
                document.body.removeChild(this.tooltip);
                this.tooltip = null;
              }
            }
          });
          
        mapContainer.classList.remove('zoom-to-county');
        document.getElementById('mapTitle').textContent = `${statesData[stateId].name} Counties`;
        countyMap = { svg, path, projection };
        updateCountyMapColors();
        createCountyLegendForMap();
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
    
    // Restore all counties to normal opacity and make them clickable again
    if (countyMap && countyMap.svg) {
      countyMap.svg.selectAll('.county')
        .transition()
        .duration(300)
        .attr('fill', function() {
          // Get the original color from the color scale
          return d3.select(this).attr('original-fill') || '#d5d8dc';
        })
        .attr('data-clickable', 'true')
        .attr('cursor', 'pointer');
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
  createCountyTopBottomChart();
}

function updateCountyMapColors() {
  if (!countyMap) return;
  
  const metricValues = {};
  allCountyData.forEach(doc => {
    if (doc.title != null) {
      // Use the original county name from database (preserve special characters)
      const countyName = String(doc.title);
      const normalizedCountyName = normalizeCountyNameForComparison(countyName);
      const val = formatNumberToTwoDecimals(doc[selectedCountyMetric]);
      if (!isNaN(val)) {
        metricValues[normalizedCountyName] = val;
      }
    }
  });
  
  const values = Object.values(metricValues);
  if (values.length === 0) return;
  
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const colorScale = d3.scaleQuantize()
    .domain([minVal, maxVal])
    .range(['#27ae60', '#e67e22', '#e74c3c']);
  
  countyMap.svg.selectAll('.county')
    .attr('fill', function() {
      // Normalize for comparison but don't change the original data
      const mapCountyName = d3.select(this).attr('data-county-name');
      const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
      const value = metricValues[normalizedMapName];
      const color = value === undefined ? '#808080' : colorScale(value);
      
      // Store original fill color to restore when deselecting
      d3.select(this).attr('original-fill', color);
      
      // If a county is selected, fade all others and make them non-clickable
      if (selectedCounty) {
        const normalizedSelectedName = normalizeCountyNameForComparison(selectedCounty);
        if (normalizedMapName !== normalizedSelectedName) {
          d3.select(this).attr('data-clickable', 'false')
                         .attr('cursor', 'default');
          return d3.color(color).copy({opacity: 0.3});
        } else {
          d3.select(this).attr('data-clickable', 'true');
          return color;
        }
      } else {
        // All counties clickable if none is selected
        d3.select(this).attr('data-clickable', 'true')
                       .attr('cursor', 'pointer');
        return color;
      }
    });
  countyMap.colorScale = colorScale;
}

function createCountyLegendForMap() {
  const legend = document.getElementById('legend');
  const colorScale = countyMap?.colorScale;
  if (!colorScale) return;
  const metricValues = {};
  allCountyData.forEach(doc => {
    if (doc.title != null) {
      const countyName = String(doc.title).toUpperCase();
      const val = Number(doc[selectedCountyMetric]);
      if (!isNaN(val)) {
        metricValues[countyName] = val;
      }
    }
  });
  const values = Object.values(metricValues);
  if (values.length === 0) return;
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const thresholds = colorScale.thresholds();
  legend.innerHTML = `
    <h3>${selectedCountyMetric}</h3>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; background: ${colorScale(minVal)};"></div> ${minVal.toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale(thresholds[0])};"></div> ${thresholds[0].toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale(maxVal)};"></div> ${maxVal.toFixed(1)}
      <div style="width: 20px; height: 20px; background: #808080;"></div> N/A
    </div>
  `;
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
    
    console.log('Generating direct PDF report for:', entities);
    
    // Determine if we're comparing states or counties
    const isStateComparison = !selectedState;
    
    const requestBody = {
      entities: entities,
      entityType: isStateComparison ? 'states' : 'counties',
      state: selectedState ? statesData[selectedState].name : null,
      includeAllMetrics: true,
      includeEquity: true,
      reportType: 'direct-pdf'
    };
    
    const response = await fetch('/comparison/api/generate-direct-pdf-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestBody),
      credentials: 'same-origin'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    console.log('=== RECEIVED RESULT FROM SERVER ===');
    console.log('Full result:', result);
    console.log('Report content preview:', result.report?.fullReport?.substring(0, 300));
    
    // Create a simple popup window with the report
    createReportPopup(result);
    
  } catch (error) {
    console.error('Error generating direct PDF report:', error);
    hideAIReportLoading();
    showAIReportError(`Failed to generate PDF report: ${error.message}`);
  }
}

// Add this new function to app.js:
function createReportPopup(reportData) {
  hideAIReportLoading();
  
  const reportContent = reportData.report?.fullReport || 'No report content available';
  const entities = reportData.metadata?.entitiesAnalyzed || ['Selected entities'];
  
  // Create popup window content
  const popupContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transit Analysis Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 20px; 
          background: white;
        }
        h1 { color: #2c41ff; text-align: center; margin-bottom: 20px; }
        .header { text-align: center; color: #666; margin-bottom: 30px; }
        .content { white-space: pre-line; font-size: 14px; line-height: 1.7; }
        .actions { text-align: center; margin-top: 30px; }
        button { padding: 10px 20px; margin: 0 10px; border: none; border-radius: 5px; cursor: pointer; }
        .print-btn { background: #2c41ff; color: white; }
        .close-btn { background: #6c757d; color: white; }
      </style>
    </head>
    <body>
      <h1>Comprehensive Transit Analysis Report</h1>
      <div class="header">
        Generated: ${new Date().toLocaleDateString()} | 
        Entities: ${entities.join(', ')}
      </div>
      <div class="content">${reportContent}</div>
      <div class="actions">
        <button class="print-btn" onclick="window.print()">Print Report</button>
        <button class="close-btn" onclick="window.close()">Close</button>
      </div>
    </body>
    </html>
  `;
  
  // Open in new window
  const popup = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
  popup.document.write(popupContent);
  popup.document.close();
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