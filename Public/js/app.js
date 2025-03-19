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
let allStateData = [];
let selectedMetric = null;
let distributionChart = null;
let topBottomChart = null;

function formatStateNameForDb(name) {
  return name.replace(/\s+/g, '_');
}

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

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
    displayCountryMetrics(allStateData); // Display country metrics on load
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

  const percentValues = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([, value]) => value);

  const minPercent = Math.min(...percentValues);
  const maxPercent = Math.max(...percentValues);
  const colorScale = d3.scaleLinear()
    .domain([minPercent, maxPercent])
    .range(['#a9dfbf', '#27ae60']);

  usMap.svg.selectAll('.state')
    .attr('fill', d => {
      const value = metricData[statesData[d.id]?.name];
      return value !== undefined ? colorScale(value) : '#bdc3c7';
    });

  createLegend(minPercent, maxPercent);
}

function createDistributionChart() {
  const canvas = document.getElementById('distributionChart');
  if (!canvas) return;
  if (distributionChart) distributionChart.destroy();

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
        y: { beginAtZero: true, title: { display: true, text: 'Frequency' } },
        x: { title: { display: true, text: 'Value Range' } }
      }
    }
  });
}

function createTopBottomChart() {
  const canvas = document.getElementById('topBottomChart');
  if (!canvas) return;
  if (topBottomChart) topBottomChart.destroy();

  const metricData = allStateData.find(d => d.title === selectedMetric);
  if (!metricData) return;

  const stateValues = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([state, value]) => ({ state, value }));

  stateValues.sort((a, b) => b.value - a.value);
  const top5 = stateValues.slice(0, 5);
  const bottom5 = stateValues.slice(-5).reverse();

  const labels = [...top5.map(d => d.state), ...bottom5.map(d => d.state)];
  const data = [...top5.map(d => d.value), ...bottom5.map(d => d.value)];
  const colors = [...top5.map(() => '#27ae60'), ...bottom5.map(() => '#e74c3c')];

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
        x: { beginAtZero: true, title: { display: true, text: 'Value' } },
        y: { title: { display: true, text: 'State' } }
      }
    }
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

  d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json')
    .then(us => {
      mapContainer.innerHTML = '';
      const projection = d3.geoAlbersUsa().fitSize([width, height], topojson.feature(us, us.objects.states));
      const path = d3.geoPath().projection(projection);
      const states = topojson.feature(us, us.objects.states).features;

      const metricData = allStateData.find(d => d.title === selectedMetric);
      if (!metricData) return;

      const percentValues = Object.entries(metricData)
        .filter(([key]) => key !== '_id' && key !== 'title')
        .map(([, value]) => value);

      const minPercent = Math.min(...percentValues);
      const maxPercent = Math.max(...percentValues);
      const colorScale = d3.scaleLinear()
        .domain([minPercent, maxPercent])
        .range(['#a9dfbf', '#27ae60']);

      const statesGroup = svg.append('g')
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
          d3.select(this).attr('cursor', 'pointer').attr('fill', '#f1c40f');
          const text = d3.select(`text[data-state-id="${d.id}"]`);
          text.text(statesData[d.id]?.name || '');
          text.attr('font-size', '12px');
        })
        .on('mouseout', function(event, d) {
          const value = metricData[statesData[d.id]?.name];
          d3.select(this).attr('fill', value !== undefined ? colorScale(value) : '#bdc3c7');
          const text = d3.select(`text[data-state-id="${d.id}"]`);
          text.text(statesData[d.id]?.abbr || '');
          text.attr('font-size', '10px');
        });

      const textGroup = svg.append('g')
        .selectAll('text')
        .data(states)
        .enter()
        .append('text')
        .attr('data-state-id', d => d.id)
        .attr('transform', d => `translate(${path.centroid(d)})`).
        attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#2c3e50')
        .text(d => statesData[d.id]?.abbr || '');

      mapContainer.appendChild(svg.node());
      usMap = { svg, path, projection, states, colorScale };
      createLegend(minPercent, maxPercent);
    })
    .catch(err => console.error('Error loading US map:', err));
}

function createLegend(minPercent, maxPercent) {
  const legend = document.getElementById('legend');
  const colorScale = usMap?.colorScale || d3.scaleLinear().domain([0, 100]).range(['#a9dfbf', '#27ae60']);
  legend.innerHTML = `
    <h3>${selectedMetric}</h3>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; background: ${colorScale(minPercent)};"></div> ${minPercent.toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale((minPercent + maxPercent) / 2)};"></div> ${((minPercent + maxPercent) / 2).toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale(maxPercent)};"></div> ${maxPercent.toFixed(1)}
    </div>
  `;
}

function handleStateClick(stateId) {
  const bus = document.getElementById('busAnimation');
  bus.classList.remove('active');
  void bus.offsetWidth; // Trigger reflow
  bus.classList.add('active');

  setTimeout(() => {
    selectedState = stateId;
    selectedCounty = null;
    activeView = 'county';
    createCountyMap(stateId);
    updateDataPanel();
    fetchStateData(stateId);
    updateCountyMetrics(); // Add this line to update county metrics
  }, 1000); // Wait for bus animation to complete
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
            d3.select(this).attr('cursor', 'pointer').transition().attr('fill', '#2980b9');
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
  document.getElementById('mapTitle').textContent = 'United States';
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
      <h2 class="section-title">United States</h2>
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
  } else {
    const template = document.getElementById('stateDataTemplate');
    const statePanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(statePanel);
    document.getElementById('backButton').addEventListener('click', handleBackToStates);
    document.getElementById('stateName').textContent = statesData[selectedState].name;
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
        plugins: {
          legend: { position: 'top', labels: { color: '#2c3e50' } },
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
              label: (context) => `Frequency: ${context.raw}`
            }
          }
        },
        scales: {
          y: { beginAtZero: true, title: { display: true, text: 'Frequency', color: '#2c3e50' }, ticks: { color: '#2c3e50' } },
          x: { title: { display: true, text: 'Range', color: '#2c3e50' }, ticks: { color: '#2c3e50' } }
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
          plugins: {
            legend: { position: 'top', labels: { color: '#2c3e50' } },
            tooltip: {
              callbacks: {
                title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
                label: (context) => `Frequency: ${context.raw}`
              }
            }
          },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Frequency', color: '#2c3e50' }, ticks: { color: '#2c3e50' } },
            x: { title: { display: true, text: 'Range', color: '#2c3e50' }, ticks: { color: '#2c3e50' } }
          },
          animation: { duration: 1000 }
        }
      });

      countyCharts.push(chart);
    });
  }
}

// Add event listener for window resize to handle responsive design
window.addEventListener('resize', () => {
  if (activeView === 'state' && usMap) {
    createUSMap();
  } else if (activeView === 'county' && selectedState) {
    createCountyMap(selectedState);
  }
});