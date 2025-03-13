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

let usMap = null;
let countyMap = null;
let selectedState = null;
let selectedCounty = null;
let activeView = 'state';
let stateCharts = [];
let countyCharts = [];
let stateMetrics = {};
let allStateData = null;
let radarChart, scatterMatrix, boxPlot;

function formatStateNameForDb(name) {
  return name.replace(/\s+/g, '_');
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
  setupFilters();
});

function initApp() {
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  document.getElementById('homeButton').addEventListener('click', handleBackToStates);
  fetchAllStateDataForCountryAverage().then(() => createUSMap());
  initializeCharts();
}

function setupFilters() {
  document.getElementById('metricFilter').addEventListener('change', updateMap);
  document.getElementById('yearFilter').addEventListener('change', updateMap);
  document.querySelectorAll('input[name="transitType"]').forEach(checkbox => {
    checkbox.addEventListener('change', updateMap);
  });
  document.getElementById('scoreRange').addEventListener('input', updateMap);
}

function initializeCharts() {
  radarChart = new Chart(document.getElementById('radarChart').getContext('2d'), {
    type: 'radar',
    data: { labels: [], datasets: [] },
    options: { scales: { r: { beginAtZero: true } } }
  });
  scatterMatrix = new Chart(document.getElementById('scatterMatrix').getContext('2d'), {
    type: 'scatter',
    data: { datasets: [] },
    options: { scales: { x: { title: { display: true, text: '' } }, y: { title: { display: true, text: '' } } } }
  });
  boxPlot = new Chart(document.getElementById('boxPlot').getContext('2d'), {
    type: 'boxplot',
    data: { labels: [], datasets: [] },
    options: { scales: { x: { title: { display: true, text: 'Range' } }, y: { title: { display: true, text: 'Frequency' } } } }
  });
}

function createUSMap() {
  const mapContainer = document.getElementById('mapView');
  mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const width = mapContainer.clientWidth;
  const height = mapContainer.clientHeight || 600;

  const svg = d3.create('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('style', 'width: 100%; height: 100%;');

  d3.json('https://unpkg.com/us-atlas@3.0.0/states-10m.json')
    .then(us => {
      mapContainer.innerHTML = '';
      const projection = d3.geoAlbersUsa().fitSize([width, height], topojson.feature(us, us.objects.states));
      const path = d3.geoPath().projection(projection);
      const states = topojson.feature(us, us.objects.states).features;

      updateMapColors(states, path, svg, projection);
      mapContainer.appendChild(svg.node());
      usMap = { svg, path, projection, states };
    })
    .catch(err => console.error('Error loading US map:', err));
}

function updateMapColors(states, path, svg, projection) {
  const metric = document.getElementById('metricFilter').value;
  const year = document.getElementById('yearFilter').value;
  const scoreRange = parseInt(document.getElementById('scoreRange').value);
  const transitTypes = Array.from(document.querySelectorAll('input[name="transitType"]:checked')).map(cb => cb.value);

  const metricData = Object.fromEntries(
    Object.entries(stateMetrics).filter(([state, data]) => {
      const matchesYear = data.year === year;
      const matchesTransit = transitTypes.includes(data.transitType || 'combined');
      const value = data[metric] || 0;
      return matchesYear && matchesTransit && value <= scoreRange;
    })
  );

  const percentValues = Object.values(metricData).filter(v => typeof v === 'number');
  const minPercent = percentValues.length ? Math.min(...percentValues) : 0;
  const maxPercent = percentValues.length ? Math.max(...percentValues) : 100;
  const colorScale = d3.scaleLinear()
    .domain([minPercent, maxPercent])
    .range(['#ef4444', '#eab308', '#22c55e']) // Red -> Yellow -> Green
    .interpolate(d3.interpolateRgb);

  const statesGroup = svg.selectAll('.state').data(states).join('path')
    .attr('d', path)
    .attr('class', 'state')
    .attr('fill', d => {
      const value = metricData[statesData[d.id]?.name] || 0;
      return colorScale(value);
    })
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      d3.select(this).style('opacity', 0.8);
    })
    .on('mouseout', function(event, d) {
      d3.select(this).style('opacity', 1);
    })
    .on('click', (event, d) => handleStateClick(d.id));

  const textGroup = svg.selectAll('.state-label').data(states).join('text')
    .attr('class', 'state-label')
    .attr('transform', d => `translate(${path.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .attr('font-size', '10px')
    .attr('fill', '#2c3e50')
    .text(d => statesData[d.id]?.abbr || '');

  createLegend(minPercent, maxPercent);
}

function createLegend(minPercent, maxPercent) {
  const legend = document.getElementById('legend');
  const colorScale = d3.scaleLinear()
    .domain([minPercent, maxPercent])
    .range(['#ef4444', '#eab308', '#22c55e']);
  legend.innerHTML = `
    <div class="text-sm font-medium mb-2">Legend</div>
    <div class="space-y-2">
      <div class="flex items-center">
        <div class="w-4 h-4 bg-[#22c55e] rounded mr-2"></div>
        <span class="text-sm">High (${maxPercent.toFixed(1)}%+)</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-[#eab308] rounded mr-2"></div>
        <span class="text-sm">Medium (${(minPercent + maxPercent) / 2}%-${maxPercent.toFixed(1)}%)</span>
      </div>
      <div class="flex items-center">
        <div class="w-4 h-4 bg-[#ef4444] rounded mr-2"></div>
        <span class="text-sm">Low (<${(minPercent + maxPercent) / 2}%)</span>
      </div>
    </div>
  `;
}

function handleStateClick(stateId) {
  selectedState = stateId;
  selectedCounty = null;
  activeView = 'county';
  createCountyMap(stateId);
  updateDataPanel();
  fetchStateData(stateId);
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

    d3.json('https://unpkg.com/us-atlas@3.0.0/counties-10m.json')
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
          .attr('fill', '#d5d8dc')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .on('click', (event, d) => handleCountyClick(d.properties.name))
          .on('mouseover', function() {
            d3.select(this).style('cursor', 'pointer').transition().attr('fill', '#2980b9');
          })
          .on('mouseout', function() {
            d3.select(this).transition().attr('fill', '#d5d8dc');
          });

        svg.append('g')
          .selectAll('text')
          .data(counties)
          .enter()
          .append('text')
          .attr('transform', d => `translate(${path.centroid(d)})`)
          .attr('text-anchor', 'middle')
          .attr('font-size', '8px')
          .attr('fill', '#2c3e50')
          .text(d => d.properties.name);

        mapContainer.appendChild(svg.node());
        mapContainer.classList.remove('zoom-to-county');
        document.getElementById('mapView').innerHTML = '';
        document.getElementById('mapView').appendChild(svg.node());
        document.getElementById('mapTitle').textContent = `${statesData[stateId].name} Counties`;
        countyMap = { svg, path, projection, counties };
      });
  }, 800);
}

function handleCountyClick(countyName) {
  selectedCounty = countyName;
  fetchCountyData(countyName);
}

function handleBackToStates() {
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  document.getElementById('mapView').innerHTML = '';
  createUSMap();
  updateDataPanel();
  stateCharts.forEach(chart => chart.destroy());
  stateCharts = [];
  countyCharts.forEach(chart => chart.destroy());
  countyCharts = [];
}

function handleBackToState() {
  selectedCounty = null;
  document.getElementById('mapTitle').textContent = `${statesData[selectedState].name} Counties`;
  updateDataPanel();
  fetchStateData(selectedState);
  countyCharts.forEach(chart => chart.destroy());
  countyCharts = [];
}

function updateDataPanel() {
  const dataPanelContent = document.getElementById('dataPanelContent');
  if (!dataPanelContent) return;
  if (!selectedState) {
    dataPanelContent.innerHTML = `
      <h2 class="text-xl font-semibold text-[#1A2B3C] mb-4">United States</h2>
      <div id="countryMetricsGrid" class="metric-grid"></div>
    `;
    if (allStateData) displayCountryMetrics(allStateData);
    return;
  }
  if (selectedCounty) {
    const template = document.getElementById('countyDataTemplate');
    const countyPanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(countyPanel);
    document.getElementById('backToStateButton').addEventListener('click', handleBackToState);
  } else {
    const template = document.getElementById('stateDataTemplate');
    const statePanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(statePanel);
    document.getElementById('backButton').addEventListener('click', handleBackToStates);
    document.getElementById('stateName').textContent = statesData[selectedState].name;
  }
}

async function fetchAllStateDataForCountryAverage() {
  try {
    const response = await fetch(`/api/averageValues`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    allStateData = data;
    stateMetrics = {};
    data.forEach(metric => {
      Object.keys(metric).forEach(key => {
        if (key !== '_id' && key !== 'title' && typeof metric[key] === 'number') {
          if (!stateMetrics[key]) stateMetrics[key] = { year: '2025', transitType: 'combined', percentAccess: 0, travelDuration: 0, waitTime: 0, transfers: 0 };
          stateMetrics[key][metric.title] = metric[key];
        }
      });
    });
    console.log('Fetched stateMetrics:', stateMetrics);
    if (activeView === 'state' && usMap) updateMap();
    if (activeView === 'state') displayCountryMetrics(data);
    updateVisualizations();
  } catch (error) {
    console.error('Error fetching country data:', error);
  }
}

function displayCountryMetrics(data) {
  const grid = document.getElementById('countryMetricsGrid');
  if (!grid) return;
  const metrics = {};
  data.forEach(metric => {
    const values = Object.entries(metric)
      .filter(([key]) => key !== '_id' && key !== 'title')
      .map(([, value]) => typeof value === 'number' ? value : 0);
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      metrics[metric.title] = avg.toFixed(1);
    }
  });
  grid.innerHTML = '';
  Object.entries(metrics).forEach(([title, value]) => {
    const card = document.createElement('div');
    card.className = 'metric-card';
    card.innerHTML = `
      <span class="metric-label">${title}</span>
      <span class="metric-value">${value}</span>
    `;
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
      card.innerHTML = `
        <span class="metric-label">${metric.title}</span>
        <span class="metric-value">${value}</span>
      `;
      grid.appendChild(card);
    }
  });
}

function displayFrequencyDistributions(data) {
  const container = document.getElementById('frequencyDistributionsContainer');
  const chartsContainer = document.getElementById('chartsContainer');
  if (!container || !chartsContainer) return;
  chartsContainer.innerHTML = '';
  stateCharts.forEach(chart => chart.destroy());
  stateCharts = [];
  if (Object.keys(data).length === 0) return;
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
    if (collectionName.includes('Transit')) barColor = '#f1c40f';
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
        plugins: { legend: { position: 'top', labels: { color: '#2c3e50' } } },
        scales: { y: { beginAtZero: true, title: { display: true, text: 'Frequency', color: '#2c3e50' } }, x: { title: { display: true, text: 'Range', color: '#2c3e50' } } },
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
      card.innerHTML = `
        <span class="metric-label">${key}</span>
        <span class="metric-value">${value}</span>
      `;
      grid.appendChild(card);
    });
  }

  chartsContainer.innerHTML = '';
  countyCharts.forEach(chart => chart.destroy());
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

      // public/js/app.js (continued)

      chartData.sort((a, b) => {
        const aNum = parseInt(a.range.match(/\d+/)?.[0] || '0', 10);
        const bNum = parseInt(b.range.match(/\d+/)?.[0] || '0', 10);
        return aNum - bNum;
      });

      let barColor = '#27ae60';
      if (collectionName.includes('Transit')) barColor = '#f1c40f';
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
          plugins: { legend: { position: 'top', labels: { color: '#2c3e50' } } },
          scales: { y: { beginAtZero: true, title: { display: true, text: 'Frequency', color: '#2c3e50' } }, x: { title: { display: true, text: 'Range', color: '#2c3e50' } } },
          animation: { duration: 1000 }
        }
      });

      countyCharts.push(chart);
    });
  }
}

function updateVisualizations() {
  const metric = document.getElementById('metricFilter').value;
  const year = document.getElementById('yearFilter').value;
  const transitTypes = Array.from(document.querySelectorAll('input[name="transitType"]:checked')).map(cb => cb.value);

  const filteredData = Object.entries(stateMetrics).filter(([_, data]) => {
    const matchesYear = data.year === year;
    const matchesTransit = transitTypes.includes(data.transitType || 'combined');
    return matchesYear && matchesTransit;
  }).reduce((acc, [state, data]) => ({ ...acc, [state]: data }), {});

  // Radar Chart
  const radarData = {
    labels: ['Percent Access', 'Average Travel Duration', 'Average Wait Time', 'Average Transfers'],
    datasets: [{
      label: 'National Average',
      data: [
        Object.values(filteredData).reduce((sum, d) => sum + (d.percentAccess || 0), 0) / Object.keys(filteredData).length,
        Object.values(filteredData).reduce((sum, d) => sum + (d.travelDuration || 0), 0) / Object.keys(filteredData).length,
        Object.values(filteredData).reduce((sum, d) => sum + (d.waitTime || 0), 0) / Object.keys(filteredData).length,
        Object.values(filteredData).reduce((sum, d) => sum + (d.transfers || 0), 0) / Object.keys(filteredData).length
      ],
      backgroundColor: 'rgba(255, 107, 26, 0.2)', // #FF6B1A with opacity
      borderColor: '#FF6B1A',
      borderWidth: 2
    }]
  };
  radarChart.data = radarData;
  radarChart.update();

  // Scatter Plot Matrix (Sample Size vs. Selected Metric)
  const scatterData = Object.values(filteredData).map(d => ({
    x: d.sampleSize || Math.random() * 1000, // Fallback if sampleSize isn’t in data
    y: d[metric] || 0
  }));
  scatterMatrix.data = {
    datasets: [{
      label: `${metric} vs. Sample Size`,
      data: scatterData,
      backgroundColor: '#1A2B3C',
      borderColor: '#1A2B3C',
      pointRadius: 5
    }]
  };
  scatterMatrix.options.scales.x.title.text = 'Sample Size';
  scatterMatrix.options.scales.y.title.text = metric;
  scatterMatrix.update();

  // Box Plot (Frequency Distribution for Selected Metric)
  const boxData = Object.values(filteredData).map(d => d[metric] || 0);
  boxPlot.data = {
    labels: [metric],
    datasets: [{
      label: 'Distribution',
      data: [boxData],
      backgroundColor: 'rgba(39, 174, 96, 0.5)', // #27ae60 with opacity
      borderColor: '#27ae60',
      borderWidth: 1
    }]
  };
  boxPlot.update();
}

function updateMap() {
  if (usMap) {
    updateMapColors(usMap.states, usMap.path, usMap.svg, usMap.projection);
    updateVisualizations();
  }
}

window.addEventListener('resize', () => {
  if (activeView === 'state' && usMap) {
    createUSMap();
  } else if (activeView === 'county' && selectedState) {
    createCountyMap(selectedState);
  }
  radarChart.resize();
  scatterMatrix.resize();
  boxPlot.resize();
});

// Toggle Sidebar
document.getElementById('toggleSidebar').addEventListener('click', () => {
  const sidebar = document.getElementById('dataSidebar');
  sidebar.classList.toggle('w-96');
  sidebar.classList.toggle('w-0');
  sidebar.classList.toggle('p-4');
  sidebar.classList.toggle('p-0');
  sidebar.classList.toggle('overflow-hidden');
});
        