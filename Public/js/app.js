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

// Helper: Return chart text color based on dark mode status.
function getChartTextColor() {
  return document.body.classList.contains("dark-mode") ? "#ffffff" : "#2c3e50";
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

// -----------------------------------------------------------------------------
// UPDATE LEFT PANEL FUNCTION (Modified for Equity Comparison button disable)
function updateLeftPanel() {
  const equityBtn = document.getElementById('equityComparisonTab');
  if (!selectedState) {
    document.getElementById('metricSelection').style.display = 'block';
    document.getElementById('countryChartsContainer').style.display = 'block';
    document.getElementById('countyMetricSelection').style.display = 'none';
    equityBtn.style.display = 'none';
  } else {
    document.getElementById('metricSelection').style.display = 'none';
    document.getElementById('countryChartsContainer').style.display = 'none';
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
  document.getElementById('homeButton').addEventListener('click', handleBackToStates);
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
    .map(([, value]) => value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const colorScale = d3.scaleQuantize()
    .domain([minVal, maxVal])
    .range(['#27ae60', '#e67e22', '#e74c3c']);
  usMap.svg.selectAll('.state')
    .attr('fill', d => {
      const value = metricData[statesData[d.id]?.name];
      return value !== undefined ? colorScale(value) : '#bdc3c7';
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
      <div style="width: 20px; height: 20px; background: ${colorScale(minVal)};"></div> ${minVal.toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale(thresholds[0])};"></div> ${thresholds[0].toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale(maxVal)};"></div> ${maxVal.toFixed(1)}
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
    .map(([, value]) => value);
  const binCount = 10;
  const bins = d3.histogram()
    .domain([Math.min(...values), Math.max(...values)])
    .thresholds(binCount)(values);
  const labels = bins.map(bin => `${bin.x0.toFixed(1)} - ${bin.x1.toFixed(1)}`);
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

function createTopBottomChart() {
  const canvas = document.getElementById('topBottomChart');
  if (!canvas) return;
  if (topBottomChart && typeof topBottomChart.destroy === 'function') {
    topBottomChart.destroy();
  }
  const stateValues = Object.entries(allStateData.find(d => d.title === selectedMetric) || {})
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([state, value]) => ({ state, value }));
  stateValues.sort((a, b) => b.value - a.value);
  const top5 = stateValues.slice(0, 5);
  const bottom5 = stateValues.slice(-5).reverse();
  const labels = [...top5.map(d => d.state), ...bottom5.map(d => d.state)];
  const data = [...top5.map(d => d.value), ...bottom5.map(d => d.value)];
  const colors = [...top5.map(() => '#e74c3c'), ...bottom5.map(() => '#27ae60')];
  const chartTextColor = getChartTextColor();
  topBottomChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: selectedMetric,
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
      }
    }
  });
}

// -----------------------------------------------------------------------------
// COUNTY MAP AND DATA FUNCTIONS
function createUSMap() {
  const mapContainer = document.getElementById('mapView');
  mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const width = mapContainer.clientWidth;
  const height = mapContainer.clientHeight || 600;
  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'width: 100%; height: 100%;');
  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
    .then(us => {
      mapContainer.innerHTML = '';
      const projection = d3.geoAlbersUsa().fitSize([width, height], topojson.feature(us, us.objects.states));
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

function handleStateClick(stateId) {
  setTimeout(() => {
    selectedState = stateId;
    selectedCounty = null;
    activeView = 'county';
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

function createCountyMap(stateId) {
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.add('zoom-to-county');
  setTimeout(() => {
    mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const width = mapContainer.clientWidth;
    const height = mapContainer.clientHeight || 600;
    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'width: 100%; height: 100%;');
    
    d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json')
      .then(us => {
        mapContainer.innerHTML = '';
        mapContainer.appendChild(svg.node());
        
        const counties = topojson.feature(us, us.objects.counties).features.filter(c => c.id.toString().startsWith(stateId));
        const stateFeature = topojson.feature(us, us.objects.states).features.find(s => s.id === stateId);
        const projection = d3.geoAlbersUsa().fitSize([width, height], stateFeature);
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
        
        // Add counties
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
          .attr('data-clickable', 'true')  // Add clickable flag attribute
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
                .attr('stroke-width', 1.5);
              
              // Calculate centroid for text placement
              const centroid = path.centroid(d);
              
              // Remove any existing labels
              svg.selectAll(".county-hover-label").remove();
              
              // Create a background for the label (white box)
              svg.append("rect")
                .attr("class", "county-hover-label")
                .attr("x", centroid[0] - (d.properties.name.length * 3) - 5)
                .attr("y", centroid[1] - 9)
                .attr("width", d.properties.name.length * 6 + 10)
                .attr("height", 18)
                .attr("fill", "white")
                .attr("stroke", "#333")
                .attr("stroke-width", 0.5)
                .attr("rx", 3);
              
              // Add the county name label above everything
              svg.append("text")
                .attr("class", "county-hover-label")
                .attr("x", centroid[0])
                .attr("y", centroid[1] + 4)  // Small vertical adjustment to center in box
                .attr("text-anchor", "middle")
                .attr("fill", "#000")
                .attr("font-size", "10px")
                .attr("font-weight", "bold")
                .text(d.properties.name);
            }
          })
          .on('mouseout', function() {
            // Only reset if county is clickable
            if (d3.select(this).attr('data-clickable') === 'true') {
              // Reset county stroke
              d3.select(this).attr('stroke-width', 0.5);
              
              // Hide label
              svg.selectAll(".county-hover-label").remove();
              
              // Update county colors if no county is selected
              if (!selectedCounty) {
                updateCountyMapColors();
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
      metrics[metric.title] = avg.toFixed(1);
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
      const value = typeof metric[stateName] === 'number' ? metric[stateName].toFixed(1) : metric[stateName];
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
  const equityCategory = document.getElementById('equityCategorySelect').value;
  const dbName = formatStateNameForDb(getCountyDbName(stateName));
  fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
    .then(response => response.json())
    .then(data => {
      allCountyData = data;
      if (allCountyData.length > 0) {
        transitMetricKeys = Object.keys(allCountyData[0]).filter(key => key !== '_id' && key !== 'title' && key !== 'state');
        selectedCountyMetric = transitMetricKeys[0] || null;
        populateTransitMetricDropdown();
      } else {
        transitMetricKeys = [];
        selectedCountyMetric = null;
      }
      loadEquityComparisonData(equityCategory, stateName);
    })
    .catch(err => console.error("Error fetching transit county averages:", err));
}

function loadEquityComparisonData(category, stateName) {
  const formattedState = formatStateNameForDb(stateName);
  fetch(`/api/equityCountyAverageValues/${encodeURIComponent(category)}/${encodeURIComponent(formattedState)}`)
    .then(response => response.json())
    .then(data => {
      equityCountyData = data;
      if (equityCountyData.length > 0) {
        if (equityCountyData[0].data && typeof equityCountyData[0].data === 'object') {
          equityMetricKeys = Object.keys(equityCountyData[0].data);
        } else {
          equityMetricKeys = Object.keys(equityCountyData[0]).filter(key => key !== '_id' && key !== 'title' && key !== 'state');
        }
      } else {
        equityMetricKeys = [];
      }
      populateEquityMetricDropdown();
    })
    .catch(err => console.error("Error fetching equity county averages:", err));
}

function populateTransitMetricDropdown() {
  const select = document.getElementById('transitMetricSelect');
  select.innerHTML = '';
  transitMetricKeys.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric;
    option.textContent = metric;
    select.appendChild(option);
  });
  select.addEventListener('change', createComparisonScatterPlotFull);
  if (select.options.length > 0) {
    select.value = select.options[0].value;
    createComparisonScatterPlotFull();
  }
}

function populateEquityMetricDropdown() {
  const select = document.getElementById('equityMetricSelect');
  select.innerHTML = '';
  equityMetricKeys.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric;
    option.textContent = metric;
    select.appendChild(option);
  });
  select.addEventListener('change', createComparisonScatterPlotFull);
  if (select.options.length > 0) {
    select.value = select.options[0].value;
    createComparisonScatterPlotFull();
  }
}

function createComparisonScatterPlotFull() {
  if (!selectedState || selectedCounty) return;
  const equitySelect = document.getElementById('equityMetricSelect');
  const transitSelect = document.getElementById('transitMetricSelect');
  if (!equitySelect || !transitSelect) {
    console.error("Dropdowns for equity or transit metrics are missing.");
    return;
  }
  const equityMetric = equitySelect.value || (equitySelect.options[0] && equitySelect.options[0].value);
  const transitMetric = transitSelect.value || (transitSelect.options[0] && transitSelect.options[0].value);
  if (!equityMetric || !transitMetric) return;
  const dataPoints = [];
  allCountyData.forEach(transitDoc => {
    const transitCounty = transitDoc.title ? String(transitDoc.title).toUpperCase().replace(/\s*COUNTY$/, "").trim() : "";
    const equityDoc = equityCountyData.find(d => {
      const docTitle = d.title ? String(d.title).toUpperCase().replace(/\s*COUNTY$/, "").trim() : "";
      return docTitle === transitCounty;
    });
    if (equityDoc) {
      const transitValue = Number(transitDoc[transitMetric]);
      let equityValue;
      if (equityDoc.data && typeof equityDoc.data === 'object') {
        equityValue = Number(equityDoc.data[equityMetric]);
      } else {
        equityValue = Number(equityDoc[equityMetric]);
      }
      if (!isNaN(transitValue) && !isNaN(equityValue)) {
        dataPoints.push({
          label: transitDoc.title,
          x: equityValue,
          y: transitValue
        });
      }
    }
  });
  const ctx = document.getElementById('comparisonChart').getContext('2d');
  if (comparisonChart && typeof comparisonChart.destroy === 'function') {
    comparisonChart.destroy();
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
        x: { title: { display: true, text: `Equity: ${equityMetric}`, color: getChartTextColor() }, beginAtZero: true, ticks: { color: getChartTextColor() } },
        y: { title: { display: true, text: `Transit: ${transitMetric}`, color: getChartTextColor() }, beginAtZero: true, ticks: { color: getChartTextColor() } }
      }
    }
  });
}

window.addEventListener('resize', () => {
  if (activeView === 'state' && usMap) {
    createUSMap();
  } else if (activeView === 'county' && selectedState) {
    createCountyMap(selectedState);
  }
});