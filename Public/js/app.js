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
  mapContainer.innerHTML = '<div class="loading"><div class="train-wheel-animation"></div></div>';
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
        .attr('transform', d => `translate(${path.centroid(d)})`)
        .attr('text-anchor', 'middle')
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

async function createCountyMap(stateId) {
  const mapContainer = document.getElementById('mapView');
  mapContainer.classList.add('zoom-to-county');
  setTimeout(async () => {
    mapContainer.innerHTML = '<div class="loading"><div class="train-wheel-animation"></div></div>';
    const width = mapContainer.clientWidth;
    const height = mapContainer.clientHeight || 600;

    const svg = d3.create('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('style', 'width: 100%; height: 100%;');

    const us = await d3.json('https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json');
    const stateName = statesData[stateId].name;
    const countyMetricData = await fetchCountyMetricData(stateName, selectedMetric);

    const counties = topojson.feature(us, us.objects.counties).features.filter(c => c.id.toString().startsWith(stateId));
    const stateFeature = topojson.feature(us, us.objects.states).features.find(s => s.id === stateId);
    const projection = d3.geoAlbersUsa().fitSize([width, height], stateFeature);
    const path = d3.geoPath().projection(projection);

    const metricValues = Object.values(countyMetricData);
    const minValue = Math.min(...metricValues);
    const maxValue = Math.max(...metricValues);
    const colorScale = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range(['#a9dfbf', '#27ae60']);

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
      .attr('fill', d => {
        const countyName = d.properties.name;
        const value = countyMetricData[countyName];
        return value !== undefined ? colorScale(value) : '#bdc3c7';
      })
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .on('click', (event, d) => handleCountyClick(d.properties.name))
      .on('mouseover', function() {
        d3.select(this).attr('cursor', 'pointer').transition().attr('fill', '#e74c3c');
      })
      .on('mouseout', function(event, d) {
        const countyName = d.properties.name;
        const value = countyMetricData[countyName];
        d3.select(this).transition().attr('fill', value !== undefined ? colorScale(value) : '#bdc3c7');
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

    mapContainer.innerHTML = '';
    mapContainer.appendChild(svg.node());
    mapContainer.classList.remove('zoom-to-county');
    document.getElementById('mapTitle').textContent = `${stateName} Counties - ${selectedMetric} Overview`;
    countyMap = { svg, path, projection, counties, colorScale };
    createCountyLegend(minValue, maxValue);
  }, 800);
}

function createCountyLegend(minValue, maxValue) {
  const legend = document.getElementById('legend');
  const colorScale = countyMap.colorScale;
  legend.innerHTML = `
    <h3>${selectedMetric} (Counties)</h3>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="width: 20px; height: 20px; background: ${colorScale(minValue)};"></div> ${minValue.toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale((minValue + maxValue) / 2)};"></div> ${((minValue + maxValue) / 2).toFixed(1)}
      <div style="width: 20px; height: 20px; background: ${colorScale(maxValue)};"></div> ${maxValue.toFixed(1)}
    </div>
  `;
}

async function fetchCountyMetricData(stateName, metric) {
  try {
    const response = await fetch(`/api/countyMetricData/${encodeURIComponent(stateName)}/${encodeURIComponent(metric)}`);
    if (!response.ok) throw new Error('Network response was not ok');
    return await response.json();
  } catch (error) {
    console.error('Error fetching county metric data:', error);
    return {};
  }
}

function handleStateClick(stateId) {
  selectedState = stateId;
  activeView = 'county';
  createCountyMap(stateId);
}

function handleCountyClick(countyName) {
  selectedCounty = countyName;
  console.log(`Clicked county: ${countyName}`);
}

function handleBackToStates() {
  if (activeView === 'state') return;
  activeView = 'state';
  selectedState = null;
  selectedCounty = null;
  document.getElementById('mapTitle').textContent = 'United States';
  createUSMap();
}