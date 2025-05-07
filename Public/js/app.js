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
    "Michigan": "MIchigan",
    "Pennsylvania": "Pennisylvania"
  };
  return corrections[stateName] || stateName;
}

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
  return name.replace(/\s+/g, '_');
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
     return; // Stop execution for non-logged in users
   }
  
  // Original state click logic for logged in users
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
    const dbName = formatStateNameForDb(getCountyDbName(statesData[stateId].name));
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
  selectedCounty = countyName;
  
  // Fade out and disable non-selected counties
  if (countyMap && countyMap.svg) {
    countyMap.svg.selectAll('.county')
      .transition()
      .duration(300)
      .attr('fill', function() {
        const name = d3.select(this).attr('data-county-name');
        if (name === countyName) {
          // Keep selected county at full opacity with current color and clickable
          d3.select(this).attr('data-clickable', 'true');
          return d3.select(this).attr('fill');
        } else {
          // Fade out non-selected counties and make them non-clickable
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
  
  fetchCountyData(countyName);
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
  const stateNameForDb = formatStateNameForDb(stateRaw);
  const countyNameForDb = countyName.toUpperCase().trim();
  fetch(`/api/countyFullData/${encodeURIComponent(stateNameForDb)}/${encodeURIComponent(countyNameForDb)}`)
    .then(response => response.json())
    .then(data => {
      updateDataPanel();
      displayCountyData(data, countyName);
    })
    .catch(err => console.error("Error fetching county data:", err));
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
      const countyName = String(doc.title).toUpperCase();
      const val = formatNumberToTwoDecimals(doc[selectedCountyMetric]);
      if (!isNaN(val)) {
        metricValues[countyName] = val;
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
      const countyNameKey = d3.select(this).attr('data-county-name').toUpperCase();
      const value = metricValues[countyNameKey];
      const color = value === undefined ? '#808080' : colorScale(value);
      
      // Store original fill color to restore when deselecting
      d3.select(this).attr('original-fill', color);
      
      // If a county is selected, fade all others and make them non-clickable
      if (selectedCounty) {
        if (countyNameKey !== selectedCounty.toUpperCase()) {
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
  const dbName = formatStateNameForDb(getCountyDbName(stateName));
  
  // Add console logs for debugging
  console.log("Loading county data for state:", stateName);
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
        // Log all keys to see what metrics are available
        console.log("County data keys:", Object.keys(allCountyData[0]));
        
        transitMetricKeys = Object.keys(allCountyData[0]).filter(key => 
          key !== '_id' && key !== 'title' && key !== 'state'
        );
        
        console.log("Transit Metric Keys:", transitMetricKeys);
        
        selectedCountyMetric = transitMetricKeys[0] || null;
        
        // Populate dropdowns
        populateTransitMetricDropdown();
        populateComparisonMetricDropdown();
      } else {
        console.warn("No county data found");
        transitMetricKeys = [];
        selectedCountyMetric = null;
      }
      
      // Load equity comparison data
      const equityCategory = document.getElementById('equityCategorySelect').value;
      loadEquityComparisonData(equityCategory, stateName);
    })
    .catch(err => {
      console.error("Error fetching transit county averages:", err);
    });
}

function loadEquityComparisonData(category, stateName) {
  const formattedState = formatStateNameForDb(stateName);
  
  console.log("Loading equity data for category:", category);
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
        
        // Enhanced data extraction for Population_Data specifically
        if (category === 'Housing_Data') {
          // Try to find data in nested structures more aggressively
          if (equityCountyData[0].data) {
            console.log("Found nested data structure:", equityCountyData[0].data);
            equityMetricKeys = Object.keys(equityCountyData[0].data);
          } else if (equityCountyData[0].Population) {
            console.log("Found Population nested data:", equityCountyData[0].Population);
            equityMetricKeys = Object.keys(equityCountyData[0].Population);
          } else {
            // Extract all property keys except common metadata
            equityMetricKeys = Object.keys(equityCountyData[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && 
              key !== 'county' && key !== 'data' && key !== 'Population'
            );
          }
        } else {
          // For other categories, use the standard approach
          if (equityCountyData[0].data && typeof equityCountyData[0].data === 'object') {
            equityMetricKeys = Object.keys(equityCountyData[0].data);
          } else {
            // Try to extract keys from the first object, excluding standard metadata
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
      
      // Populate dropdowns
      populateEquityMetricDropdown();
      
      // Trigger scatter plot creation
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
  const generateComparisonBtn = document.getElementById('generateComparisonBtn');
  const downloadComparisonBtn = document.getElementById('downloadComparisonBtn');
  const backToComparisonOptions = document.getElementById('backToComparisonOptions');
  const comparisonInfo = document.querySelector('.comparison-info');
  const comparisonChartWrapper = document.querySelector('.comparison-chart-wrapper');
  
  if (!compareStatesButton) return;
  
  // Start comparison mode
  compareStatesButton.addEventListener('click', function() {
    // Reset the comparison entities
    selectedEntitiesForComparison = [];
    
    // Update the overlay title and button text dynamically
    const comparisonOverlayTitle = document.getElementById('comparisonOverlayTitle');
    
    if (!selectedState) {
      // We're comparing states
      comparisonOverlayTitle.textContent = 'Select States to Compare';
      compareStatesButton.textContent = 'Compare States';
    } else {
      // We're comparing counties within a selected state
      comparisonOverlayTitle.textContent = `Select Counties in ${statesData[selectedState].name} to Compare`;
      compareStatesButton.textContent = 'Compare Counties';
    }
    
    // Enter comparison mode
    enterComparisonMode();
  });
  
  // Cancel comparison
  cancelComparisonBtn.addEventListener('click', function() {
    exitComparisonMode();
  });
  
  // Proceed to compare
  proceedToCompareBtn.addEventListener('click', function() {
    if (selectedEntitiesForComparison.length < 2) {
      alert('Please select at least 2 entities to compare.');
      return;
    }
    
    // Show the modal
    comparisonModal.style.display = 'flex';
    
    // Update the modal title based on the current view
    const comparisonModalTitle = document.getElementById('comparisonModalTitle');
    if (selectedState) {
      comparisonModalTitle.textContent = 'Compare Counties';
      
      // Make sure county data is loaded for the dropdown
      if (!allCountyData || allCountyData.length === 0) {
        console.log("Loading county data for metrics dropdown");
        const dbName = formatStateNameForDb(getCountyDbName(statesData[selectedState].name));
        fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
          .then(response => response.json())
          .then(data => {
            allCountyData = data;
            if (allCountyData.length > 0) {
              transitMetricKeys = Object.keys(allCountyData[0]).filter(key => 
                key !== '_id' && key !== 'title' && key !== 'state'
              );
              populateComparisonMetricDropdown();
            }
          })
          .catch(err => console.error("Error fetching county data:", err));
      }
    } else {
      comparisonModalTitle.textContent = 'Compare States';
    }
    
    // Populate metric dropdown
    populateComparisonMetricDropdown();
    
    // Update the entities list in the modal
    updateSelectedEntitiesList();
    
    // Show comparison info, hide chart
    comparisonInfo.style.display = 'flex';
    comparisonChartWrapper.style.display = 'none';
    
    // Exit comparison selection mode
    exitComparisonMode();
  });
  
  // Other event handlers remain the same
  closeComparisonModal.addEventListener('click', function() {
    comparisonModal.style.display = 'none';
  });
  
  generateComparisonBtn.addEventListener('click', function() {
    if (selectedEntitiesForComparison.length < 2) {
      alert('Please select at least 2 entities to compare.');
      return;
    }
    
    generateComparisonChart();
    
    comparisonInfo.style.display = 'none';
    comparisonChartWrapper.style.display = 'block';
  });
  
  backToComparisonOptions.addEventListener('click', function() {
    comparisonChartWrapper.style.display = 'none';
    comparisonInfo.style.display = 'flex';
  });
  
  downloadComparisonBtn.addEventListener('click', function() {
    if (!comparisonModalChart) return;
    
    const canvas = document.getElementById('comparisonModalChart');
    const link = document.createElement('a');
    link.download = 'comparison-chart.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
  
  // Click outside to close modal
  window.addEventListener('click', function(e) {
    if (e.target === comparisonModal) {
      comparisonModal.style.display = 'none';
    }
  });
  
// Modify the state and county click handlers for comparison mode
const originalStateClick = handleStateClick;
handleStateClick = function(stateId) {
  // If in comparison modal or comparison overlay is active
  if (comparisonModal.style.display === 'flex' || 
      (document.getElementById('comparisonOverlay').style.display === 'block' && !selectedState)) {
    // We're in comparison mode for states
    const stateName = statesData[stateId]?.name;
    if (!stateName) return;
    
    // Prevent default state click behavior (opening county map)
    event.preventDefault();
    event.stopPropagation();
    
    // Toggle selection
    const index = selectedEntitiesForComparison.findIndex(entity => entity.id === stateId);
    if (index >= 0) {
      selectedEntitiesForComparison.splice(index, 1);
    } else {
      selectedEntitiesForComparison.push({
        id: stateId,
        name: stateName,
        type: 'state'
      });
    }
    
    updateSelectedEntitiesList();
    updateMapSelectionHighlights();
    updateSelectionCount();
    
    return;
  }
  
  // Call the original handler if not in comparison mode
  originalStateClick(stateId);
};

const originalCountyClick = handleCountyClick;
handleCountyClick = function(countyName) {
  // If in comparison modal or comparison overlay is active for counties
  if ((comparisonModal.style.display === 'flex' || 
    document.getElementById('comparisonOverlay').style.display === 'block') && 
    selectedState) {
  // Prevent default county click behavior
  event.preventDefault();
  event.stopPropagation();
  
  // Find the exact county name from allCountyData to ensure it matches
  let exactCountyName = countyName;
  const matchingCounty = allCountyData.find(c => 
    c.title && c.title.replace(/\s+County$/i, '').toLowerCase() === countyName.replace(/\s+County$/i, '').toLowerCase()
  );
  
  if (matchingCounty) {
    exactCountyName = matchingCounty.title;
    console.log(`Using exact county name from database: ${exactCountyName}`);
  }
  
  // Toggle selection
  const index = selectedEntitiesForComparison.findIndex(entity => 
    entity.name.replace(/\s+County$/i, '').toLowerCase() === countyName.replace(/\s+County$/i, '').toLowerCase()
  );
  if (index >= 0) {
    selectedEntitiesForComparison.splice(index, 1);
  } else {
    selectedEntitiesForComparison.push({
      id: countyName,
      name: exactCountyName, // Use the exact name from the database
      type: 'county'
    });
  }
  
  updateSelectedEntitiesList();
  updateMapSelectionHighlights();
  updateSelectionCount();
  
  return;
}
  
  // Call the original handler if not in comparison mode
  originalCountyClick(countyName);
  };
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