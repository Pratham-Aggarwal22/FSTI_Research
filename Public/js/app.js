// public/js/app.js

// Define statesData mapping (FIPS codes to state names)
// Note: State names are in "Title Case" (first letter uppercase, rest lower)
const statesData = {
  "01": { name: "Alabama" },
  "02": { name: "Alaska" },
  "04": { name: "Arizona" },
  "05": { name: "Arkansas" },
  "06": { name: "California" },
  "08": { name: "Colorado" },
  "09": { name: "Connecticut" },
  "10": { name: "Delaware" },
  "11": { name: "District of Columbia" },
  "12": { name: "Florida" },
  "13": { name: "Georgia" },
  "15": { name: "Hawaii" },
  "16": { name: "Idaho" },
  "17": { name: "Illinois" },
  "18": { name: "Indiana" },
  "19": { name: "Iowa" },
  "20": { name: "Kansas" },
  "21": { name: "Kentucky" },
  "22": { name: "Louisiana" },
  "23": { name: "Maine" },
  "24": { name: "Maryland" },
  "25": { name: "Massachusetts" },
  "26": { name: "Michigan" },
  "27": { name: "Minnesota" },
  "28": { name: "Mississippi" },
  "29": { name: "Missouri" },
  "30": { name: "Montana" },
  "31": { name: "Nebraska" },
  "32": { name: "Nevada" },
  "33": { name: "New Hampshire" },
  "34": { name: "New Jersey" },
  "35": { name: "New Mexico" },
  "36": { name: "New York" },
  "37": { name: "North Carolina" },
  "38": { name: "North Dakota" },
  "39": { name: "Ohio" },
  "40": { name: "Oklahoma" },
  "41": { name: "Oregon" },
  "42": { name: "Pennsylvania" },
  "44": { name: "Rhode Island" },
  "45": { name: "South Carolina" },
  "46": { name: "South Dakota" },
  "47": { name: "Tennessee" },
  "48": { name: "Texas" },
  "49": { name: "Utah" },
  "50": { name: "Vermont" },
  "51": { name: "Virginia" },
  "53": { name: "Washington" },
  "54": { name: "West Virginia" },
  "55": { name: "Wisconsin" },
  "56": { name: "Wyoming" }
};

// Global variables
let usMap = null;
let countyMap = null;
let selectedState = null;
let selectedCounty = null;
let activeView = 'state';
let stateCharts = [];
// Holds the state-level "Percent Access" values from the average metrics
let statePercentAccess = {};
// This global variable will hold the fetched county documents (from the Averages collection) for the current state.
let currentStateAverages = null;

// Helper function to format the state name for the database connection.
// It converts spaces to underscores. For example, "New York" becomes "New_York".
function formatStateNameForDb(name) {
  return name.replace(/\s+/g, '_');
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  document.getElementById('homeButton').addEventListener('click', handleBackToStates);
  document.getElementById('databaseInfoButton').addEventListener('click', showDatabaseInfo);
  document.querySelector('.close-button').addEventListener('click', hideDatabaseInfo);
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('databaseInfoModal');
    if (event.target === modal) {
      hideDatabaseInfo();
    }
  });
});

function initApp() {
  // Start with the full US map view
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  createUSMap();
  updateDataPanel();
}



function createUSMap() {
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.add('fade-out');
  setTimeout(() => {
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

        const statesGroup = svg.append('g')
          .selectAll('path')
          .data(states)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', (_, i) => d3.interpolateBlues(0.2 + (i / states.length) * 0.5))
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .attr('class', 'state')
          .attr('data-state-id', d => d.id)
          .on('click', (event, d) => handleStateClick(d.id))
          .on('mouseover', function() {
            d3.select(this).attr('cursor', 'pointer').transition().attr('fill', '#f59e0b');
          })
          .on('mouseout', function() {
            d3.select(this).transition().attr('fill', (_, i) => d3.interpolateBlues(0.2 + (i / states.length) * 0.5));
          });

        svg.append('g')
          .selectAll('text')
          .data(states)
          .enter()
          .append('text')
          .attr('transform', d => `translate(${path.centroid(d)})`)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#fff')
          .text(d => statesData[d.id]?.name || '');

        mapContainer.appendChild(svg.node());
        mapContainer.classList.remove('fade-out');
        mapContainer.classList.add('fade-in');
        usMap = { svg, path, projection, states };
        if (Object.keys(statePercentAccess).length > 0) updateStateColors();
      });
  }, 300);
}

function createCountyMap(stateId) {
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.add('fade-out');
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
        const counties = topojson.feature(us, us.objects.counties).features.filter(c => c.id.toString().startsWith(stateId));
        const stateFeature = topojson.feature(us, us.objects.states).features.find(s => s.id === stateId);
        const projection = d3.geoAlbersUsa().fitSize([width, height], stateFeature);
        const path = d3.geoPath().projection(projection);

        svg.append('path')
          .datum(stateFeature)
          .attr('d', path)
          .attr('fill', 'none')
          .attr('stroke', '#fff')
          .attr('stroke-width', 2);

        const countiesGroup = svg.append('g')
          .selectAll('path')
          .data(counties)
          .enter()
          .append('path')
          .attr('d', path)
          .attr('fill', (_, i) => d3.interpolateGreens(0.2 + (i / counties.length) * 0.6))
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .on('click', (event, d) => {
            openCountyDataModal(d.properties.name);
            countiesGroup.selectAll('path').attr('stroke-width', 0.5);
            d3.select(event.currentTarget).attr('stroke-width', 2).attr('stroke', '#f59e0b');
          })
          .on('mouseover', function() {
            d3.select(this).attr('cursor', 'pointer').transition().attr('fill', '#f59e0b');
          })
          .on('mouseout', function() {
            d3.select(this).transition().attr('fill', (_, i) => d3.interpolateGreens(0.2 + (i / counties.length) * 0.6));
          });

        svg.append('g')
          .selectAll('text')
          .data(counties)
          .enter()
          .append('text')
          .attr('transform', d => `translate(${path.centroid(d)})`)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('fill', '#fff')
          .text(d => d.properties.name);

        mapContainer.appendChild(svg.node());
        mapContainer.classList.remove('fade-out');
        mapContainer.classList.add('fade-in');
        document.getElementById('mapTitle').textContent = `${statesData[stateId].name} Counties`;
        countyMap = { svg, path, projection, counties };
      });
  }, 300);
}

// Handle state click: update maps and fetch state data
function handleStateClick(stateId) {
  selectedState = stateId;
  selectedCounty = null;
  activeView = 'county';
  createCountyMap(stateId);
  updateDataPanel();
  fetchStateData(stateId);
}

// In state view, clicking a county card or a county on the map opens the county modal.
function handleCountyClick(countyName) {
  openCountyDataModal(countyName);
}

// --- New Function: openCountyDataModal ---
// This function calls a new API endpoint to fetch full county data (averages and frequencies)
// from the state-specific database. It formats the state name (by replacing spaces with underscores)
// and ensures the county name is uppercase.
function openCountyDataModal(countyName) {
  const stateRaw = statesData[selectedState]?.name;
  if (!stateRaw) {
    console.error("State name not found for selected state:", selectedState);
    return;
  }
  const stateNameForDb = formatStateNameForDb(stateRaw);
  const countyNameForDb = countyName.toUpperCase().trim();
  
  fetch(`/api/countyFullData/${encodeURIComponent(stateNameForDb)}/${encodeURIComponent(countyNameForDb)}`)
    .then(response => {
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      return response.json();
    })
    .then(data => {
      const modalContent = document.getElementById('countyDataModalContent');
      let html = '';
      if (data.averages && data.averages.title) {
        html += `<h2>${data.averages.title} County Data</h2>`;
        html += `<h3>Averages</h3>`;
        html += `<table class="data-table">`;
        for (const key in data.averages) {
          if (key === '_id' || key === 'title') continue;
          html += `<tr><td><strong>${key}</strong></td><td>${data.averages[key]}</td></tr>`;
        }
        html += `</table>`;
      } else {
        html += `<h2>${countyName} County Data</h2><p>No average data found.</p>`;
      }
      // Add a container for frequency charts
      html += `<h3>Frequency Distributions</h3>`;
      html += `<div id="countyChartsContainer"></div>`;
      modalContent.innerHTML = html;
      
      // If frequency data exists, render charts
      if (data.frequencies && Object.keys(data.frequencies).length > 0) {
        displayCountyFrequencyCharts(data.frequencies);
      }
      document.getElementById('countyDataModal').style.display = 'block';
    })
    .catch(err => {
      console.error("Error in openCountyDataModal:", err);
      document.getElementById('countyDataModalContent').innerHTML = `<h2>${countyName} County Data</h2><p>Error loading data.</p>`;
      document.getElementById('countyDataModal').style.display = 'block';
    });
}

// New function to render county frequency charts using Chart.js with gradient fills.
function displayCountyFrequencyCharts(frequencies) {
  const container = document.getElementById('countyChartsContainer');
  if (!container) return;
  container.innerHTML = '';
  for (const [collectionName, freqData] of Object.entries(frequencies)) {
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
    container.appendChild(wrapper);
    
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
    
    let barColor = '#4299E1';
    if (collectionName.includes('Transit')) barColor = '#3182CE';
    else if (collectionName.includes('Population')) barColor = '#38A169';
    else if (collectionName.includes('Economic')) barColor = '#805AD5';
    
    const ctx = canvas.getContext("2d");
    // Create a vertical gradient from the top (barColor) to bottom (white)
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(1, "#ffffff");
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.range),
        datasets: [{
          label: collectionName,
          data: chartData.map(d => d.count),
          backgroundColor: gradient,
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
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
              label: (context) => `Frequency: ${context.raw}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Frequency' } },
          x: { title: { display: true, text: 'Range' } }
        },
        animation: { duration: 1500 }
      }
    });
  }
}

// Handle back to state view (using Home button)
function handleBackToStates() {
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  createUSMap();
  updateDataPanel();
  stateCharts.forEach(chart => chart.destroy());
  stateCharts = [];
}

// Update the data panel (footer) for state view only (state display remains unchanged)
function updateDataPanel() {
  const dataPanelContent = document.getElementById('dataPanelContent');
  if (!selectedState) {
    dataPanelContent.innerHTML = `
      <h2>US Geographic Explorer</h2>
      <p>Click on a state to view detailed information and county map.</p>
      <div class="info-box info-box-blue">
        <h3><span class="icon info-icon"></span>How to use this map</h3>
        <ul>
          <li>Click on any state to view its details</li>
          <li>Explore county-level data by clicking on counties</li>
          <li>Use the home button to return to the US map view</li>
        </ul>
      </div>
      <div class="info-box info-box-purple">
        <h3><span class="icon map-pin-icon"></span>Data Visualization</h3>
        <p>This application connects to a MongoDB database to display state-level average metrics and interactive frequency charts.</p>
      </div>
    `;
    return;
  }
  // For state view, use the existing state template (unchanged)
  const template = document.getElementById('stateDataTemplate');
  const statePanel = template.content.cloneNode(true);
  dataPanelContent.innerHTML = '';
  dataPanelContent.appendChild(statePanel);
}

function fetchStateData(stateId) {
  const stateName = statesData[stateId]?.name;
  if (!stateName) return;
  fetch(`/api/averageValues`)
    .then(response => response.json())
    .then(data => {
      // Save statePercentAccess if the metric is found
      data.forEach(metric => {
        if (metric.title === "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)") {
          // Remove extra keys and store only state names and values.
          Object.keys(metric).forEach(key => {
            if (key !== '_id' && key !== 'title') {
              statePercentAccess[key] = metric[key];
            }
          });
          updateStateColors();
        }
      });
      // Store the fetched county documents (averages) for the current state
      currentStateAverages = data;
      displayStateMetrics(data, stateName);
    })
    .catch(error => {
      console.error('Error fetching average values:', error);
      const container = document.getElementById('stateMetricsContainer');
      if (container) container.innerHTML = `<div class="error">Error loading state metrics. Please try again later.</div>`;
    });
  fetch(`/api/frequencyDistributions/${encodeURIComponent(stateName)}`)
    .then(response => response.json())
    .then(data => {
      displayFrequencyDistributions(data);
    })
    .catch(error => {
      console.error('Error fetching frequency distributions:', error);
      const container = document.getElementById('frequencyDistributionsContainer');
      if (container) container.innerHTML = `<div class="error">Error loading frequency distributions. Please try again later.</div>`;
    });
}

function displayStateMetrics(data, stateName) {
  const container = document.getElementById('stateMetricsContainer');
  const grid = document.getElementById('stateMetricsGrid');
  if (!container || !grid) return;
  grid.innerHTML = '';
  const metrics = [];
  data.forEach(metric => {
    if (metric[stateName] !== undefined) {
      metrics.push({
        title: metric.title,
        value: metric[stateName]
      });
    }
  });
  if (metrics.length === 0) {
    container.innerHTML = '<div class="info-message">No metrics available for this state.</div>';
    return;
  }
  metrics.forEach(metric => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    const value = typeof metric.value === 'number' ? metric.value.toFixed(1) : metric.value;
    card.innerHTML = `<h4>${metric.title}</h4><p>${value}</p>`;
    // Make the card clickable to open the county data modal
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      openCountyDataModal(metric.title);
    });
    grid.appendChild(card);
  });
  container.style.display = 'block';
}

function displayFrequencyDistributions(data) {
  const container = document.getElementById('frequencyDistributionsContainer');
  const chartsContainer = document.getElementById('chartsContainer');
  if (!container || !chartsContainer) return;
  chartsContainer.innerHTML = '';
  stateCharts.forEach(chart => chart.destroy());
  stateCharts = [];
  if (Object.keys(data).length === 0) {
    container.innerHTML = '<div class="info-message">No frequency distributions available for this state.</div>';
    return;
  }
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
    
    let barColor = '#4299E1';
    if (collectionName.includes('Transit')) barColor = '#3182CE';
    else if (collectionName.includes('Population')) barColor = '#38A169';
    else if (collectionName.includes('Economic')) barColor = '#805AD5';
    
    const ctx = canvas.getContext("2d");
    let gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, barColor);
    gradient.addColorStop(1, "#ffffff");
    
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.range),
        datasets: [{
          label: collectionName,
          data: chartData.map(d => d.count),
          backgroundColor: gradient,
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
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
              label: (context) => `Frequency: ${context.raw}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Frequency' } },
          x: { title: { display: true, text: 'Range' } }
        },
        animation: { duration: 1500 }
      }
    });
    
    stateCharts.push(chart);
  });
  container.style.display = 'block';
}

// Show and hide the database info modal
function showDatabaseInfo() {
  document.getElementById('databaseInfoModal').style.display = 'block';
}
function hideDatabaseInfo() {
  document.getElementById('databaseInfoModal').style.display = 'none';
}

// Handle window resize to re-render maps
window.addEventListener('resize', () => {
  if (activeView === 'state' && usMap) {
    createUSMap();
  } else if (activeView === 'county' && selectedState) {
    createCountyMap(selectedState);
  }
});
