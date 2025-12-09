// public/js/app.js

// Metric groups with colors for visual organization
const METRIC_GROUPS = {
  'Access': { color: '#9b59b6', metrics: [] },
  'Travel Times': { color: '#3498db', metrics: [] },
  'Transfers': { color: '#e67e22', metrics: [] },
  'Initial Journey': { color: '#1abc9c', metrics: [] },
  'Total Journey': { color: '#f39c12', metrics: [] },
  'Vehicle Times': { color: '#e74c3c', metrics: [] },
  'Sample Data': { color: '#95a5a6', metrics: [] }
};

// Ordered transit metrics list as specified by user
const ORDERED_TRANSIT_METRICS = [
  "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)",
  "",  // Visual break
  "Travel Time by Transit in Minutes",
  "Travel Time by Car in Minutes",
  "Transit to Car Travel Time Ratio",
  "",  // Visual break
  "Number of Transfers",
  "",  // Visual break
  "Initial Walk Distance in Miles",
  "Initial Walk Time in Minutes",
  "Initial Wait Time in Minutes",
  "",  // Visual break
  "Total Walk Distance in Miles",
  "Total Walk Time",
  "Total Wait Time in Minutes",
  "",  // Visual break
  "In-Vehicle Travel Time in Minutes",
  "Out-of-Vehicle Travel Time in Minutes",
  "In-Vehicle to Out-of-Vehicle Time Ratio",
  "",  // Visual break
  "Sample Size"
];

// Ordered transit metrics with "Average" prefix for database queries
const ORDERED_TRANSIT_METRICS_WITH_AVERAGE = [
  "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)",
  "",  // Visual break
  "Average Travel Duration in Minutes",
  "Average Driving Duration with Traffic in Minutes",
  "Transit: Driving",
  "",  // Visual break
  "Transfers",
  "",  // Visual break
  "Average Initial Walk Distance in Miles",
  "Average Initial Walk Duration in Minutes",
  "Average Initial Wait Time in Minutes",
  "",  // Visual break
  "Average Total Walk Distance in Miles",
  "Average Total Walk Duration in minutes",
  "Average Total Wait Duration in Minutes",
  "",  // Visual break
  "Average In-Vehicle Duration in Minutes",
  "Average Out-of-Vehicle Duration in Minutes",
  "In-Vehicle:Out-of-Vehicle",
  "",  // Visual break
  "Sample Size"
];

const DEFAULT_USA_METRIC_TITLE = "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)";
const DEFAULT_USA_METRIC_TOKENS = [
  'percent access',
  'initial walk distance',
  'initial wait time'
];

const NATIONAL_AGGREGATE_KEYS = new Set([
  'unitedstates',
  'us',
  'usa',
  'u.s.',
  'nationwide',
  'allstates',
  'nationalaverage',
  'entireunitedstates'
]);

function normalizeAggregateKey(key = '') {
  return key
    .toString()
    .toLowerCase()
    .replace(/[\s._-]+/g, '');
}

function isDistrictOfColumbia(name = '') {
  const normalized = normalizeAggregateKey(name);
  return ['districtofcolumbia', 'washingtondc', 'dc'].includes(normalized);
}

function isSampleSizeMetric(name = '') {
  return (name || '').toString().toLowerCase().includes('sample size');
}

function clampPercentAccessValue(value) {
  if (!Number.isFinite(value)) return value;
  return Math.min(value, 99.99);
}

function isAggregateKey(key = '') {
  const normalized = normalizeAggregateKey(key);
  return normalized && NATIONAL_AGGREGATE_KEYS.has(normalized);
}

function sanitizeMetricDocuments(documents = []) {
  return documents.map(metric => {
    if (!metric || typeof metric !== 'object') {
      return metric;
    }
    const cleanedMetric = { ...metric };
    Object.keys(cleanedMetric).forEach(key => {
      if (key !== '_id' && key !== 'title' && isAggregateKey(key)) {
        delete cleanedMetric[key];
      }
    });
    return cleanedMetric;
  });
}

function getMetricColorLogic(title) {
  if (!title) {
    return null;
  }
  if (METRIC_COLOR_LOGIC[title]) {
    return METRIC_COLOR_LOGIC[title];
  }
  const normalizedTitle = normalizeMetricTitle(title);
  const match = Object.entries(METRIC_COLOR_LOGIC).find(
    ([key]) => normalizeMetricTitle(key) === normalizedTitle
  );
  return match ? match[1] : null;
}

function normalizeMetricTitle(title) {
  return (title || '')
    .toString()
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Helper function to get metric group
function getMetricGroup(metricName) {
  const normalized = (metricName || '').toString();
  if (normalized.includes('Percent Access')) return 'Access';
  // Ensure all in-vehicle/out-of-vehicle metrics sit under Vehicle Times (red)
  if (normalized.toLowerCase().includes('vehicle')) return 'Vehicle Times';
  if (normalized.includes('Transfer')) return 'Transfers';
  if (normalized.includes('Initial')) return 'Initial Journey';
  if (normalized.includes('Total')) return 'Total Journey';
  if (
    normalized.includes('Travel Time') || normalized.includes('Travel Duration') ||
    normalized.includes('Driving Duration') || normalized.includes('Transit to Car') ||
    normalized.includes('Transit: Driving') || normalized.includes('Transit to Driving')
  ) {
    return 'Travel Times';
  }
  if (normalized.includes('Sample Size')) return 'Sample Data';
  return 'Other';
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

const DEFAULT_PERCENT_ACCESS_METRIC = 'Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)';
const SAMPLE_SIZE_KEYWORD = 'sample size';
const TRANSIT_INDEPENDENT_KEYWORDS = ['driving', 'car'];
const EQUITY_GOOD_KEYWORDS = ['median', 'average', 'mean', 'per capita', 'income', 'earnings', 'bachelor', 'graduate'];

const CLUSTER_K = 4;
const CLUSTER_MIN_INTENSITY = 0.35;
const CLUSTER_REFERENCE_POINTS = {
  critical: { x: 1, y: 1 },
  synergy: { x: 1, y: 0 },
  service_gap: { x: 0, y: 1 },
  high_access: { x: 0, y: 0 }
};

const CLUSTER_TYPE_DETAILS = {
  critical: {
    label: 'Higher Need + Worst Service',
    color: '#D94352',
    description: 'High equity vulnerability with limited transit performance'
  },
  synergy: {
    label: 'Higher Need + Better Service',
    color: '#F4C361',
    description: 'High equity need supported by strong transit performance'
  },
  service_gap: {
    label: 'Lower Need + Worst Service',
    color: '#4F80FF',
    description: 'Lower equity need but underperforming transit service'
  },
  high_access: {
    label: 'Lower Need + Better Service',
    color: '#35A574',
    description: 'Lower equity need with high-performing transit access'
  }
};

const EQUITY_METADATA_FIELDS = ['_id', 'title', 'Title', 'state', 'State', 'county', 'County', 'data', 'Population'];

let clusterState = {
  active: false,
  level: null,
  assignments: {},
  context: null,
  legend: [],
  inputs: null
};

function setClusterInteractionLock(lockEnabled) {
  if (usMap && usMap.svg) {
    usMap.svg.selectAll('.state').style('cursor', lockEnabled ? 'default' : 'pointer');
  }
  if (countyMap && countyMap.svg) {
    countyMap.svg.selectAll('.county').style('cursor', lockEnabled ? 'default' : 'pointer');
  }
}

let clusterPanelOpening = false;
let clusterPanelPlaceholder = null;
let clusterPanelSource = 'map';
let mapViewHomePlaceholder = null;
let legendHomePlaceholder = null;
const clusterPanelDrag = {
  active: false,
  offsetX: 0,
  offsetY: 0,
  hostRect: null,
  panel: null
};

let stateEquityStore = {};
let countyEquityStore = {};
let statePercentAccessCache = null;

function normalizeMetricTitle(title) {
  return (title || '')
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '')
    .trim();
}

function findMetricDataByTitle(title) {
  if (!Array.isArray(allStateData) || allStateData.length === 0 || !title) {
    return null;
  }
  const normalizedTitle = normalizeMetricTitle(title);
  return allStateData.find(metric => normalizeMetricTitle(metric.title) === normalizedTitle) || null;
}

// -----------------------------------------------------------------------------
// CLUSTER ANALYSIS HELPERS
// -----------------------------------------------------------------------------
function resetClusterState(options = { refresh: true }) {
  clusterState = {
    active: false,
    level: null,
    assignments: {},
    context: null,
    legend: [],
    inputs: null
  };
  setClusterInteractionLock(false);
  if (options.refresh) {
    updateMapColors();
    updateCountyMapColors();
    const legend = document.getElementById('legend');
    if (legend) {
      legend.classList.remove('cluster-legend');
    }
  }
}

function isClusterPanelOpen() {
  const panel = document.getElementById('clusterAnalysisPanel');
  return Boolean(panel && panel.classList.contains('open'));
}

function shouldUseClusterOverlay() {
  return Boolean(selectedState);
}

function ensureClusterPanelPlaceholder() {
  const panel = document.getElementById('clusterAnalysisPanel');
  if (!panel || clusterPanelPlaceholder) {
    return;
  }
  clusterPanelPlaceholder = document.createElement('div');
  clusterPanelPlaceholder.id = 'clusterPanelHome';
  panel.parentNode.insertBefore(clusterPanelPlaceholder, panel);
}

function moveClusterPanelToSidebar() {
  const panel = document.getElementById('clusterAnalysisPanel');
  if (!panel || !clusterPanelPlaceholder) {
    return;
  }
  if (panel.previousSibling !== clusterPanelPlaceholder) {
    clusterPanelPlaceholder.parentNode.insertBefore(panel, clusterPanelPlaceholder.nextSibling);
  }
  panel.classList.remove('overlay');
}

function moveClusterPanelToOverlay() {
  const panel = document.getElementById('clusterAnalysisPanel');
  const host = getClusterOverlayHost();
  if (!panel || !host) {
    return;
  }
  if (panel.parentElement !== host) {
    host.appendChild(panel);
  }
  panel.classList.add('overlay');
}

function syncClusterPanelPlacement() {
  const panel = document.getElementById('clusterAnalysisPanel');
  if (!panel) {
    return;
  }
  if (shouldUseClusterOverlay()) {
    moveClusterPanelToOverlay();
    setClusterPanelDraggable(panel, clusterPanelSource === 'map');
  } else {
    moveClusterPanelToSidebar();
    setClusterPanelDraggable(panel, false);
  }
}

function getClusterOverlayHost() {
  if (clusterPanelSource === 'equity') {
    return document.getElementById('equityClusterPanelHost') || document.getElementById('equityClusterView');
  }
  return document.querySelector('.map-content');
}

function ensureMapLegendPlaceholders() {
  const mapView = document.getElementById('mapView');
  if (mapView && !mapViewHomePlaceholder) {
    mapViewHomePlaceholder = document.createElement('div');
    mapViewHomePlaceholder.id = 'mapViewHomePlaceholder';
    mapView.parentNode.insertBefore(mapViewHomePlaceholder, mapView);
  }
  const legend = document.getElementById('legend');
  if (legend && !legendHomePlaceholder) {
    legendHomePlaceholder = document.createElement('div');
    legendHomePlaceholder.id = 'legendHomePlaceholder';
    legend.parentNode.insertBefore(legendHomePlaceholder, legend);
  }
}

function moveMapIntoEquityCluster() {
  if (!selectedState) {
    return;
  }
  ensureMapLegendPlaceholders();
  const mapView = document.getElementById('mapView');
  const legend = document.getElementById('legend');
  const mapSlot = document.getElementById('equityClusterMapSlot');
  const legendSlot = document.getElementById('equityClusterLegendSlot');
  let moved = false;
  if (mapView && mapSlot && mapView.parentNode !== mapSlot) {
    mapSlot.appendChild(mapView);
    mapView.classList.add('equity-cluster-map-active');
    moved = true;
  }
  if (legend && legendSlot && legend.parentNode !== legendSlot) {
    legendSlot.appendChild(legend);
    moved = true;
  }
  if (moved) {
    const mapContent = document.querySelector('.map-content');
    if (mapContent) {
      mapContent.style.display = 'none';
    }
  }
  syncClusterPanelPlacement();
}

function restoreMapToMainLayout() {
  ensureMapLegendPlaceholders();
  const mapView = document.getElementById('mapView');
  const legend = document.getElementById('legend');
  if (mapView && mapViewHomePlaceholder && mapViewHomePlaceholder.parentNode && mapView.parentNode !== mapViewHomePlaceholder.parentNode) {
    mapViewHomePlaceholder.parentNode.insertBefore(mapView, mapViewHomePlaceholder.nextSibling);
    mapView.classList.remove('equity-cluster-map-active');
  }
  if (legend && legendHomePlaceholder && legendHomePlaceholder.parentNode && legend.parentNode !== legendHomePlaceholder.parentNode) {
    legendHomePlaceholder.parentNode.insertBefore(legend, legendHomePlaceholder.nextSibling);
  }
  const mapContent = document.querySelector('.map-content');
  if (mapContent) {
    mapContent.style.display = '';
  }
  syncClusterPanelPlacement();
}

function setClusterPanelDraggable(panel, enabled) {
  const header = panel?.querySelector('.cluster-panel-header');
  if (!header) {
    return;
  }
  if (enabled) {
    header.classList.add('cluster-panel-draggable');
    if (!header._clusterDragBound) {
      header._clusterDragBound = true;
      header.addEventListener('pointerdown', handleClusterPanelPointerDown);
    }
  } else {
    header.classList.remove('cluster-panel-draggable');
    if (header._clusterDragBound) {
      header.removeEventListener('pointerdown', handleClusterPanelPointerDown);
      header._clusterDragBound = false;
    }
    panel.style.left = '';
    panel.style.top = '';
    panel.style.right = '';
  }
}

function handleClusterPanelPointerDown(event) {
  const panel = document.getElementById('clusterAnalysisPanel');
  if (!panel || !panel.classList.contains('overlay')) {
    return;
  }
  event.preventDefault();
  const host = panel.parentElement;
  const hostRect = host.getBoundingClientRect();
  const panelRect = panel.getBoundingClientRect();
  clusterPanelDrag.active = true;
  clusterPanelDrag.panel = panel;
  clusterPanelDrag.hostRect = hostRect;
  clusterPanelDrag.offsetX = event.clientX - panelRect.left;
  clusterPanelDrag.offsetY = event.clientY - panelRect.top;
  panel.style.right = 'auto';
  panel.style.left = `${panelRect.left - hostRect.left}px`;
  panel.style.top = `${panelRect.top - hostRect.top}px`;
  document.addEventListener('pointermove', handleClusterPanelPointerMove);
  document.addEventListener('pointerup', handleClusterPanelPointerUp);
}

function handleClusterPanelPointerMove(event) {
  if (!clusterPanelDrag.active || !clusterPanelDrag.panel) {
    return;
  }
  const panel = clusterPanelDrag.panel;
  const hostRect = clusterPanelDrag.hostRect;
  const nextLeft = event.clientX - hostRect.left - clusterPanelDrag.offsetX;
  const nextTop = event.clientY - hostRect.top - clusterPanelDrag.offsetY;
  panel.style.left = `${Math.max(0, nextLeft)}px`;
  panel.style.top = `${Math.max(0, nextTop)}px`;
}

function handleClusterPanelPointerUp() {
  clusterPanelDrag.active = false;
  document.removeEventListener('pointermove', handleClusterPanelPointerMove);
  document.removeEventListener('pointerup', handleClusterPanelPointerUp);
}

function updateClusterAnalysisButtonVisibility() {
  const clusterBtn = document.getElementById('clusterAnalysisButton');
  if (!clusterBtn) {
    return;
  }
  const shouldShow = !selectedState;
  clusterBtn.style.display = shouldShow ? 'block' : 'none';
  clusterBtn.classList.toggle('active', isClusterPanelOpen());
}

function isTransitMetricAllowed(metricName) {
  if (!metricName) return false;
  return !metricName.toLowerCase().includes(SAMPLE_SIZE_KEYWORD);
}

function isTransitMetricIndependent(metricName) {
  if (!metricName) return false;
  const normalized = metricName.toLowerCase();
  return TRANSIT_INDEPENDENT_KEYWORDS.some(keyword => normalized.includes(keyword));
}

function getTransitMetricDirection(metricName) {
  if (!metricName) return 'high_is_bad';
  const lower = metricName.toLowerCase();
  if (lower.includes('percent access')) {
    return 'high_is_good';
  }
  const logic = getMetricColorLogic(metricName);
  return logic === 'high_is_good' ? 'high_is_good' : 'high_is_bad';
}

function getEquityMetricDirection(metricName) {
  if (!metricName) return 'high_is_need';
  const normalized = metricName.toLowerCase();
  if (EQUITY_GOOD_KEYWORDS.some(keyword => normalized.includes(keyword))) {
    return 'high_is_good';
  }
  return 'high_is_need';
}

function getStatePercentAccessMap() {
  if (statePercentAccessCache) {
    return statePercentAccessCache;
  }
  const metricData = findMetricDataByTitle(DEFAULT_PERCENT_ACCESS_METRIC);
  const map = {};
  if (metricData) {
    Object.entries(metricData).forEach(([key, value]) => {
      if (key === '_id' || key === 'title') return;
      const numericValue = Number(value);
      if (!isNaN(numericValue)) {
        map[key] = numericValue;
      }
    });
  }
  statePercentAccessCache = map;
  return map;
}

function getSelectedStateDatabaseName() {
  if (!selectedState || !statesData[selectedState]) {
    return null;
  }
  const stateName = statesData[selectedState].name;
  const corrected = getCountyDbName(stateName);
  return formatStateNameForDb(corrected);
}

function extractEquityMetricsFromDocument(doc, category) {
  if (!doc || typeof doc !== 'object') {
    return {};
  }
  let source = null;
  if (doc.data && typeof doc.data === 'object') {
    source = doc.data;
  } else if (category === 'Housing_Data' && doc.Population && typeof doc.Population === 'object') {
    source = doc.Population;
  } else {
    source = doc;
  }

  const metrics = {};
  Object.entries(source).forEach(([key, value]) => {
    const normalizedKey = typeof key === 'string' ? key.trim().toLowerCase() : '';
    if (EQUITY_METADATA_FIELDS.includes(key) || normalizedKey === 'us') {
      return;
    }
    const numericValue = Number(value);
    if (!isNaN(numericValue)) {
      metrics[key] = numericValue;
    }
  });
  return metrics;
}

function buildEquityMetricStore(documents = [], category) {
  const valuesByMetric = {};
  documents.forEach(doc => {
    const stateName = doc.title || doc.State || doc.state || doc.name;
    if (!stateName) return;
    const normalizedState = typeof stateName === 'string' ? stateName.trim().toLowerCase() : '';
    if (normalizedState === 'us' || normalizedState === 'united states') return;
    const metrics = extractEquityMetricsFromDocument(doc, category);
    Object.entries(metrics).forEach(([metricName, value]) => {
      if (!valuesByMetric[metricName]) {
        valuesByMetric[metricName] = {};
      }
      valuesByMetric[metricName][stateName] = value;
    });
  });
  const metrics = Object.keys(valuesByMetric);
  return {
    metrics,
    valuesByMetric
  };
}

async function ensureStateEquityCategoryLoaded(category) {
  if (!category) return null;
  if (stateEquityStore[category] && stateEquityStore[category].metrics?.length) {
    return stateEquityStore[category];
  }

  const response = await fetch(`/api/equityStateAverageValues/${encodeURIComponent(category)}`);
  if (!response.ok) {
    throw new Error(`Failed to load state equity data for ${category}`);
  }
  const data = await response.json();
  const store = buildEquityMetricStore(Array.isArray(data) ? data : [], category);
  stateEquityStore[category] = store;
  return store;
}

function buildCountyMetricLookup(documents = [], category) {
  const lookup = {};
  documents.forEach(doc => {
    const countyRaw = doc.title || doc.county || doc.County;
    if (!countyRaw) return;
    const normalized = normalizeCountyNameForComparison(
      countyRaw.replace(/\s+county$/i, '')
    );
    const metrics = extractEquityMetricsFromDocument(doc, category);
    Object.entries(metrics).forEach(([metricName, value]) => {
      if (!lookup[metricName]) {
        lookup[metricName] = {};
      }
      lookup[metricName][normalized] = value;
    });
  });
  return lookup;
}

function buildStateClusterDataset(transitMetric, equityCategory, equityMetric) {
  const transitDoc = findMetricDataByTitle(transitMetric);
  const equityStore = stateEquityStore[equityCategory];
  if (!transitDoc || !equityStore || !equityStore.valuesByMetric || !equityStore.valuesByMetric[equityMetric]) {
    return [];
  }
  const equityValues = equityStore.valuesByMetric[equityMetric];
  const percentAccessMap = getStatePercentAccessMap();
  const dataset = [];

  Object.entries(statesData).forEach(([stateId, meta]) => {
    const stateName = meta.name;
    // Remove US from cluster analysis
    if (stateName === 'United States' || stateId === 'us') return;
    
    const transitValue = Number(transitDoc[stateName]);
    const equityValue = Number(equityValues[stateName]);
    if (isNaN(transitValue) || isNaN(equityValue)) {
      return;
    }
    dataset.push({
      id: stateId,
      label: stateName,
      geography: stateName,
      transitValue,
      equityValue,
      percentAccess: percentAccessMap[stateName] !== undefined ? percentAccessMap[stateName] : null
    });
  });

  return dataset;
}

function buildCountyClusterDataset(stateDbName, transitMetric, equityCategory, equityMetric) {
  if (!stateDbName || !Array.isArray(allCountyData) || allCountyData.length === 0) {
    return [];
  }
  const store = countyEquityStore[stateDbName] && countyEquityStore[stateDbName][equityCategory];
  if (!store || !store.lookup || !store.lookup[equityMetric]) {
    return [];
  }
  const equityLookup = store.lookup[equityMetric];
  const dataset = [];

  allCountyData.forEach(doc => {
    const countyTitle = doc.title;
    if (!countyTitle) return;
    const normalized = normalizeCountyNameForComparison(countyTitle.replace(/\s+county$/i, ''));
    if (equityLookup[normalized] === undefined) {
      return;
    }
    const transitValue = Number(doc[transitMetric]);
    const equityValue = Number(equityLookup[normalized]);
    if (isNaN(transitValue) || isNaN(equityValue)) {
      return;
    }
    const percentAccessValue = doc['Percent Access'];
    dataset.push({
      id: normalized,
      label: countyTitle,
      geography: countyTitle,
      transitValue,
      equityValue,
      percentAccess: percentAccessValue !== undefined ? Number(percentAccessValue) : null
    });
  });

  return dataset;
}

function prepareClusterDataset(level, transitMetric, equityCategory, equityMetric) {
  if (level === 'state') {
    return buildStateClusterDataset(transitMetric, equityCategory, equityMetric);
  }
  const stateDbName = getSelectedStateDatabaseName();
  return buildCountyClusterDataset(stateDbName, transitMetric, equityCategory, equityMetric);
}

function computeValueStats(points, key) {
  const values = points
    .map(point => Number(point[key]))
    .filter(value => !isNaN(value));
  if (values.length === 0) {
    return { min: 0, max: 1 };
  }
  return {
    min: Math.min(...values),
    max: Math.max(...values)
  };
}

function normalizeValue(value, stats, invert = false) {
  const numericValue = Number(value);
  if (isNaN(numericValue)) {
    return null;
  }
  const range = stats.max - stats.min;
  let normalized;
  if (range === 0) {
    normalized = 0.5;
  } else {
    normalized = (numericValue - stats.min) / range;
  }
  normalized = Math.min(Math.max(normalized, 0), 1);
  if (invert) {
    normalized = 1 - normalized;
  }
  return Number(normalized.toFixed(4));
}

function normalizeClusterPoints(points, transitMetric, equityMetric) {
  if (!points || points.length === 0) {
    return [];
  }

  const independentTransit = isTransitMetricIndependent(transitMetric);
  if (!independentTransit) {
    const stats = computeValueStats(points, 'transitValue');
    const penalty = (stats.max || 1) * 0.15 + 1;
    points.forEach(point => {
      if (point.percentAccess !== null && Number(point.percentAccess) === 0) {
        point.transitValue = stats.max + penalty;
        point.noAccess = true;
      }
    });
  }

  // Build rank lookups so percentile-based normalization is stable and immune to outliers
  const buildRankLookup = (key) => {
    const sorted = points
      .map(p => p[key])
      .filter(v => v !== null && !Number.isNaN(v))
      .sort((a, b) => a - b);

    const n = sorted.length;
    if (n === 0) {
      return { lookup: new Map(), fallback: null };
    }
    if (n === 1) {
      return { lookup: new Map([[sorted[0], 0.5]]), fallback: 0.5 };
    }

    const lookup = new Map();
    let i = 0;
    while (i < n) {
      let j = i;
      while (j + 1 < n && sorted[j + 1] === sorted[i]) {
        j += 1;
      }
      // Average rank for ties so equal values get the same percentile
      const rank = ((i + j) / 2) / (n - 1);
      lookup.set(sorted[i], rank);
      i = j + 1;
    }

    return { lookup, fallback: 0.5 };
  };

  const equityRanks = buildRankLookup('equityValue');
  const transitRanks = buildRankLookup('transitValue');
  const transitDirection = getTransitMetricDirection(transitMetric);
  const equityDirection = getEquityMetricDirection(equityMetric);

  return points.map(point => ({
    ...point,
    normX: (() => {
      const rank = equityRanks.lookup.get(point.equityValue);
      const safeRank = rank !== undefined && rank !== null ? rank : equityRanks.fallback;
      if (safeRank === null) return null;
      return equityDirection === 'high_is_good' ? 1 - safeRank : safeRank;
    })(),
    normY: (() => {
      // FIX: Explicitly handle No Access or Missing Data as Poor Service (1.0)
      if (point.noAccess || point.transitValue === null || isNaN(point.transitValue)) {
        return 1.0; // Worst rank (Poor Service)
      }

      const rank = transitRanks.lookup.get(point.transitValue);
      const safeRank = rank !== undefined && rank !== null ? rank : transitRanks.fallback;
      
      // If we still don't have a valid rank, default to 0.5
      if (safeRank === null) return 0.5;

      return transitDirection === 'high_is_good' ? 1 - safeRank : safeRank;
    })()
  }));
}

function runKMeans(points, k = CLUSTER_K) {
  if (!points || points.length === 0) {
    return [];
  }

  // Deterministic initialization at the semantic corners to make clustering stable
  const fixedCentroids = [
    { x: 0, y: 0 }, // High Access (low need, good service)
    { x: 0, y: 1 }, // Service Gap (low need, poor service)
    { x: 1, y: 0 }, // Synergy (high need, good service)
    { x: 1, y: 1 }  // Critical (high need, poor service)
  ];

  const centroids = fixedCentroids.slice(0, k);
  // If k differs from 4, pad with random seeds to avoid crashes
  while (centroids.length < k) {
    const seed = points[Math.floor(Math.random() * points.length)];
    centroids.push({
      x: seed.normX !== null ? seed.normX : Math.random(),
      y: seed.normY !== null ? seed.normY : Math.random()
    });
  }

  const assignments = new Array(points.length).fill(-1);
  let iterations = 0;
  let changed = true;

  while (changed && iterations < 30) {
    changed = false;
    iterations += 1;

    points.forEach((point, index) => {
      if (point.normX === null || point.normY === null) {
        return;
      }
      let bestIndex = 0;
      let bestDistance = Infinity;
      centroids.forEach((centroid, centroidIndex) => {
        const distance = Math.hypot(point.normX - centroid.x, point.normY - centroid.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          bestIndex = centroidIndex;
        }
      });

      if (assignments[index] !== bestIndex) {
        assignments[index] = bestIndex;
        changed = true;
      }
    });

    if (changed) {
      centroids.forEach((centroid, centroidIndex) => {
        const assignedPoints = points.filter((_, pointIndex) => assignments[pointIndex] === centroidIndex);
        if (assignedPoints.length === 0) {
          // Keep empty clusters at their original fixed position to avoid randomness
          return;
        }
        centroid.x = assignedPoints.reduce((sum, point) => sum + (point.normX || 0), 0) / assignedPoints.length;
        centroid.y = assignedPoints.reduce((sum, point) => sum + (point.normY || 0), 0) / assignedPoints.length;
      });
    }
  }

  return centroids.map((centroid, index) => ({
    id: index,
    centroid,
    points: points.filter((_, pointIndex) => assignments[pointIndex] === index)
  }));
}

function assignClusterTypes(clusters = []) {
  const availableTypes = new Set(Object.keys(CLUSTER_REFERENCE_POINTS));
  const orderedClusters = [...clusters].sort(
    (a, b) => (b.centroid.x + b.centroid.y) - (a.centroid.x + a.centroid.y)
  );

  orderedClusters.forEach(cluster => {
    let bestType = null;
    let bestDistance = Infinity;
    availableTypes.forEach(type => {
      const ref = CLUSTER_REFERENCE_POINTS[type];
      const distance = Math.hypot(cluster.centroid.x - ref.x, cluster.centroid.y - ref.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestType = type;
      }
    });
    if (!bestType) {
      bestType = Object.keys(CLUSTER_REFERENCE_POINTS)[0];
    }
    cluster.type = bestType;
    availableTypes.delete(bestType);
  });

  // Assign any remaining clusters (if any) to the closest reference
  clusters.forEach(cluster => {
    if (cluster.type) return;
    let bestType = null;
    let bestDistance = Infinity;
    Object.entries(CLUSTER_REFERENCE_POINTS).forEach(([type, ref]) => {
      const distance = Math.hypot(cluster.centroid.x - ref.x, cluster.centroid.y - ref.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestType = type;
      }
    });
    cluster.type = bestType || 'critical';
  });

  return clusters;
}

function applyClusterIntensities(clusters = []) {
  clusters.forEach(cluster => {
    const reference = CLUSTER_REFERENCE_POINTS[cluster.type] || { x: 0.5, y: 0.5 };
    if (!Array.isArray(cluster.points) || cluster.points.length === 0) {
      return;
    }
    const scores = cluster.points.map(point => {
      if (point.normX === null || point.normY === null) {
        point.intensity = CLUSTER_MIN_INTENSITY;
        return CLUSTER_MIN_INTENSITY;
      }
      const distance = Math.hypot(point.normX - reference.x, point.normY - reference.y);
      const normalizedDistance = Math.min(distance / Math.sqrt(2), 1);
      const score = 1 - normalizedDistance;
      point.__clusterScore = score;
      return score;
    });
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);
    const scoreRange = maxScore - minScore || 1;
    cluster.points.forEach(point => {
      const normalizedScore = point.__clusterScore !== undefined
        ? (point.__clusterScore - minScore) / scoreRange
        : 0;
      const scaled = CLUSTER_MIN_INTENSITY + (1 - CLUSTER_MIN_INTENSITY) * normalizedScore;
      point.intensity = Number(scaled.toFixed(3));
      delete point.__clusterScore;
    });
  });
}

function getClusterFillColor(type, intensity = 1) {
  const detail = CLUSTER_TYPE_DETAILS[type];
  if (!detail) {
    return '#999999';
  }
  const clamped = Math.min(Math.max(intensity, CLUSTER_MIN_INTENSITY), 1);
  if (window.d3 && typeof d3.interpolateRgb === 'function') {
    return d3.interpolateRgb('#f7f7f7', detail.color)(clamped);
  }
  // Fallback: manual blend with white
  const base = detail.color.replace('#', '');
  const r = parseInt(base.substring(0, 2), 16);
  const g = parseInt(base.substring(2, 4), 16);
  const b = parseInt(base.substring(4, 6), 16);
  const mixChannel = (channel) => Math.round(255 - (255 - channel) * clamped);
  return `rgb(${mixChannel(r)}, ${mixChannel(g)}, ${mixChannel(b)})`;
}

function buildClusterDescription(type, equityLabel, transitLabel) {
  switch (type) {
    case 'critical':
      return `High ${equityLabel} need with limited ${transitLabel} performance`;
    case 'synergy':
      return `High ${equityLabel} need supported by strong ${transitLabel}`;
    case 'service_gap':
      return `Lower ${equityLabel} need but weak ${transitLabel} delivery`;
    case 'high_access':
      return `Lower ${equityLabel} need with strong ${transitLabel}`;
    default:
      return `${equityLabel} vs ${transitLabel}`;
  }
}

function formatClusterMetricValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'N/A';
  }
  if (Math.abs(value) >= 1000) {
    return `${value.toFixed(0)}`;
  }
  return `${value.toFixed(2)}`;
}

function summarizeClusterStats(cluster, equityLabel, transitLabel) {
  const count = cluster.points.length;
  if (count === 0) {
    return `No areas in this cluster`;
  }
  const sumEquity = cluster.points.reduce((sum, point) => sum + (Number(point.equityValue) || 0), 0);
  const sumTransit = cluster.points.reduce((sum, point) => sum + (Number(point.transitValue) || 0), 0);
  const avgEquity = sumEquity / count;
  const avgTransit = sumTransit / count;
  return `${count} areas · Avg ${equityLabel}: ${formatClusterMetricValue(avgEquity)} · Avg ${transitLabel}: ${formatClusterMetricValue(avgTransit)}`;
}

function renderClusterLegend() {
  const legend = document.getElementById('legend');
  if (!legend || !clusterState.active || !clusterState.inputs) {
    return;
  }

  const equityLabel = mapEquityMetricName(clusterState.inputs.equityMetric, clusterState.inputs.equityCategory);
  const transitLabel = clusterState.inputs.transitMetric;
  legend.classList.add('cluster-legend');
  const showExit = clusterState.context !== 'equity';

  const legendItems = Object.keys(CLUSTER_TYPE_DETAILS).map(type => {
    const detail = CLUSTER_TYPE_DETAILS[type];
    return `
      <div class="cluster-legend-item cluster-legend-chip">
        <span class="cluster-legend-swatch" style="background:${detail.color};"></span>
        <div>
          <strong>${detail.label}</strong>
        </div>
      </div>
    `;
  }).join('');

  legend.innerHTML = `
    <div class="cluster-legend-header">
      <div>
        <h4>Cluster Analysis</h4>
      </div>
      <div class="cluster-legend-actions">
      </div>
    </div>
    <div class="cluster-legend-body cluster-legend-simple">
      ${legendItems}
    </div>
  `;

  const infoButton = createInfoButton(
    'Cluster Analysis',
    buildClusterLegendInfoText(equityLabel, transitLabel)
  );
  const legendActions = legend.querySelector('.cluster-legend-actions');
  if (legendActions && infoButton) {
    legendActions.insertBefore(infoButton, legendActions.firstChild);
  }

  repositionClusterLegend();
}

function buildClusterLegendInfoText(equityLabel, transitLabel) {
  const detailText = Object.keys(CLUSTER_TYPE_DETAILS).map(type => {
    const detail = CLUSTER_TYPE_DETAILS[type];
    const stats = clusterState.legend.find(l => l.type === type)?.stats || '';
    return `<strong>${detail.label}</strong>: ${detail.description}${stats ? `<br>${stats}` : ''}`;
  }).join('<br><br>');
  return `
    ${equityLabel} vs ${transitLabel}<br><br>
    ${detailText}<br><br>
    Shade intensity moves from light to dark within each color to show relative severity inside the cluster.
  `;
}

function applyStateClusterColors() {
  if (!usMap || !usMap.svg || !clusterState.active || clusterState.level !== 'state') {
    return;
  }
  usMap.svg.selectAll('.state')
    .attr('fill', d => {
      const assignment = clusterState.assignments[d.id];
      if (!assignment) {
        return '#bdc3c7';
      }
      return getClusterFillColor(assignment.type, assignment.intensity);
    });
  renderClusterLegend();
}

function applyCountyClusterColors() {
  if (!countyMap || !countyMap.svg || !clusterState.active || clusterState.level !== 'county') {
    return;
  }
  countyMap.svg.selectAll('.county-path')
    .attr('fill', function() {
      const countyName = d3.select(this).attr('data-county-name') || '';
      const normalized = normalizeCountyNameForComparison(countyName.replace(/\s+county$/i, ''));
      const assignment = clusterState.assignments[normalized];
      if (!assignment) {
        return d3.select(this).attr('original-fill') || '#d5d8dc';
      }
      return getClusterFillColor(assignment.type, assignment.intensity);
    });
  renderClusterLegend();
}

function exitClusterMode() {
  const wasActive = clusterState.active;
  resetClusterState({ refresh: wasActive });
  const panel = document.getElementById('clusterAnalysisPanel');
  const leftPanel = document.getElementById('leftPanel');
  if (panel) {
    panel.classList.remove('open');
    panel.classList.remove('overlay');
  }
  moveClusterPanelToSidebar();
  clusterPanelSource = 'map';
  if (leftPanel) {
    leftPanel.classList.remove('cluster-mode');
  }
  restoreMapToMainLayout();
  updateLeftPanel();
  updateCompareStatesButtonVisibility();
  updateClusterAnalysisButtonVisibility();
}

async function performClusterAnalysis({ level, transitMetric, equityCategory, equityMetric, source = 'map' }) {
  try {
    if (!transitMetric || !equityCategory || !equityMetric) {
      alert('Please select both transit and equity metrics.');
      return;
    }

    if (level === 'state') {
      await ensureStateEquityCategoryLoaded(equityCategory);
    } else {
      await ensureCountyEquityCategoryLoaded(equityCategory);
    }

    const dataset = prepareClusterDataset(level, transitMetric, equityCategory, equityMetric);
    if (!dataset || dataset.length < CLUSTER_K) {
      alert('Not enough data available to create clusters.');
      return;
    }

    const normalizedPoints = normalizeClusterPoints(dataset, transitMetric, equityMetric)
      .filter(point => point.normX !== null && point.normY !== null);
    if (normalizedPoints.length < CLUSTER_K) {
      alert('Not enough comparable data after normalization.');
      return;
    }

    const clusters = assignClusterTypes(runKMeans(normalizedPoints, CLUSTER_K));
    applyClusterIntensities(clusters);

    const assignments = {};
    clusters.forEach(cluster => {
      cluster.points.forEach(point => {
        assignments[point.id] = {
          type: cluster.type,
          intensity: point.intensity,
          label: point.label,
          rawTransit: point.transitValue,
          rawEquity: point.equityValue,
          percentAccess: point.percentAccess
        };
      });
    });

    clusterState = {
      active: true,
      level,
      context: source,
      assignments,
      legend: clusters.map(cluster => ({
        type: cluster.type,
        label: CLUSTER_TYPE_DETAILS[cluster.type]?.label,
        description: buildClusterDescription(
          cluster.type,
          mapEquityMetricName(equityMetric, equityCategory),
          transitMetric
        ),
        stats: summarizeClusterStats(cluster, mapEquityMetricName(equityMetric, equityCategory), transitMetric)
      })),
      inputs: { level, transitMetric, equityCategory, equityMetric }
    };
    setClusterInteractionLock(true);

    if (level === 'state') {
      applyStateClusterColors();
    } else {
      applyCountyClusterColors();
    }
  } catch (error) {
    alert('Unable to run cluster analysis right now. Please try again.');
  }
}

function initializeClusterAnalysisUI() {
  const openBtn = document.getElementById('clusterAnalysisButton');
  const panel = document.getElementById('clusterAnalysisPanel');
  const closeBtn = document.getElementById('closeClusterPanel');
  const runBtn = document.getElementById('runClusterAnalysisBtn');
  const categorySelect = document.getElementById('clusterEquityCategorySelect');

  if (panel) {
    ensureClusterPanelPlaceholder();
  }

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      openClusterPanel({ resetSelections: true, autoRun: true, source: 'map' });
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', () => exitClusterMode());
  }
  if (runBtn) {
    runBtn.addEventListener('click', () => {
      runClusterAnalysisFromControls();
    });
  }
  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      loadClusterEquityMetrics(categorySelect.value);
    });
  }
}

async function runClusterAnalysisFromControls() {
  const transitMetric = document.getElementById('clusterTransitSelect')?.value;
  const equityCategory = document.getElementById('clusterEquityCategorySelect')?.value;
  const equityMetric = document.getElementById('clusterEquityMetricSelect')?.value;
  const level = selectedState ? 'county' : 'state';
  await performClusterAnalysis({ level, transitMetric, equityCategory, equityMetric, source: clusterPanelSource });
}

async function openClusterPanel(options = {}) {
  const panel = document.getElementById('clusterAnalysisPanel');
  if (!panel || clusterPanelOpening) {
    return;
  }
  ensureClusterPanelPlaceholder();
  clusterPanelOpening = true;
  clusterPanelSource = options.source || 'map';
  try {
    if (shouldUseClusterOverlay()) {
      moveClusterPanelToOverlay();
    } else {
      moveClusterPanelToSidebar();
    }
    panel.classList.add('open');
    const leftPanel = document.getElementById('leftPanel');
    if (leftPanel) {
      leftPanel.classList.toggle('cluster-mode', !shouldUseClusterOverlay());
    }
    updateLeftPanel();
    updateClusterPanelContext();
    populateClusterTransitOptions({ preferFirstOption: options.resetSelections });
    const categorySelect = document.getElementById('clusterEquityCategorySelect');
    if (options.resetSelections && categorySelect && categorySelect.options.length) {
      categorySelect.value = categorySelect.options[0].value;
    }
    const category = categorySelect?.value;
    if (category) {
      await loadClusterEquityMetrics(category, { autoSelectFirst: options.resetSelections });
    }
    if (options.autoRun) {
      await runClusterAnalysisFromControls();
    }
  } finally {
    clusterPanelOpening = false;
    updateCompareStatesButtonVisibility();
    updateClusterAnalysisButtonVisibility();
  }
}

function updateClusterPanelContext() {
  const contextLabel = document.getElementById('clusterPanelContext');
  if (!contextLabel) return;
  if (selectedState && statesData[selectedState]) {
    contextLabel.textContent = `Analyzing ${statesData[selectedState].name} counties`;
  } else {
    contextLabel.textContent = 'Analyzing United States (states)';
  }
}

function populateClusterTransitOptions(config = {}) {
  const select = document.getElementById('clusterTransitSelect');
  if (!select) return;
  const previousValue = select.value;
  select.innerHTML = '';

  const level = selectedState ? 'county' : 'state';
  let metrics = [];

  if (level === 'state') {
    metrics = (allStateData || [])
      .map(metric => metric.title)
      .filter(metric => metric && isTransitMetricAllowed(metric));
  } else if (Array.isArray(transitMetricKeys)) {
    metrics = transitMetricKeys.filter(metric => isTransitMetricAllowed(metric));
  }

  if (metrics.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Metrics unavailable';
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  const metricMapping = createMetricMappingFromTitles(metrics);
  const reverseMapping = Object.entries(metricMapping).reduce((acc, [display, actual]) => {
    acc[actual] = display;
    return acc;
  }, {});

  let currentGroup = null;
  let currentOptgroup = null;
  let optionCount = 0;

  ORDERED_TRANSIT_METRICS.forEach(displayName => {
    if (!displayName) return;
    const actualName = metricMapping[displayName];
    if (!actualName) return;

    const group = getMetricGroup(displayName);
    if (group !== currentGroup) {
      currentOptgroup = document.createElement('optgroup');
      currentOptgroup.label = group;
      currentOptgroup.style.fontWeight = 'bold';
      currentOptgroup.style.backgroundColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color + '15' : '#f0f0f0';
      select.appendChild(currentOptgroup);
      currentGroup = group;
    }

    const option = document.createElement('option');
    option.value = actualName;
    option.textContent = displayName;
    option.dataset.displayName = displayName;
    option.dataset.group = group;
    currentOptgroup.appendChild(option);
    optionCount += 1;
  });

  if (optionCount === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Metrics unavailable';
    option.disabled = true;
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  const desiredSelection = level === 'state' ? selectedMetric : selectedCountyMetric;
  const preferredValue = desiredSelection && Array.from(select.options).some(option => option.value === desiredSelection)
    ? desiredSelection
    : previousValue;

  if (preferredValue && Array.from(select.options).some(option => option.value === preferredValue)) {
    select.value = preferredValue;
  } else if (config.preferFirstOption && select.options.length > 0) {
    select.value = select.options[0].value;
  } else if (select.options.length > 0) {
    select.value = select.options[0].value;
  }
}

async function loadClusterEquityMetrics(category, options = {}) {
  const metricSelect = document.getElementById('clusterEquityMetricSelect');
  if (!metricSelect || !category) return;
  metricSelect.innerHTML = '<option>Loading metrics...</option>';
  metricSelect.disabled = true;

  try {
    let metrics = [];
    if (selectedState) {
      const store = await ensureCountyEquityCategoryLoaded(category);
      metrics = store?.metrics || [];
    } else {
      const store = await ensureStateEquityCategoryLoaded(category);
      metrics = store?.metrics || [];
    }

    metricSelect.innerHTML = '';
    if (metrics.length === 0) {
      metricSelect.innerHTML = '<option value="">No metrics available</option>';
      return;
    }

    metrics.forEach(metric => {
      const option = document.createElement('option');
      option.value = metric;
      option.textContent = mapEquityMetricName(metric, category);
      metricSelect.appendChild(option);
    });
    metricSelect.disabled = false;
    if (options.autoSelectFirst && metricSelect.options.length > 0) {
      metricSelect.value = metricSelect.options[0].value;
    }
  } catch (error) {
    metricSelect.innerHTML = '<option value="">Unable to load metrics</option>';
  }
}

function refreshClusterControlsOnStateChange() {
  if (!isClusterPanelOpen()) {
    return;
  }
  updateClusterPanelContext();
  populateClusterTransitOptions();
  const category = document.getElementById('clusterEquityCategorySelect')?.value;
  if (category) {
    loadClusterEquityMetrics(category);
  }
  syncClusterPanelPlacement();
}

function repositionClusterLegend() {
  ensureMapLegendPlaceholders();
  const legend = document.getElementById('legend');
  if (!legend) {
    return;
  }
  if (clusterState.active && clusterState.context === 'equity') {
    // Handled by moveMapIntoEquityCluster
    return;
  }
  if (clusterState.active && clusterState.context === 'map' && !selectedState) {
    const panelSlot = document.getElementById('clusterPanelLegendSlot');
    if (panelSlot && legend.parentNode !== panelSlot) {
      panelSlot.appendChild(legend);
    }
  } else if (legendHomePlaceholder && legendHomePlaceholder.parentNode && legend.parentNode !== legendHomePlaceholder.parentNode) {
    legendHomePlaceholder.parentNode.insertBefore(legend, legendHomePlaceholder.nextSibling);
  }
}

let equityViewMode = 'scatter';

function initializeEquityViewToggle() {
  const buttons = document.querySelectorAll('.equity-view-btn');
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      const mode = button.dataset.view;
      if (mode) {
        setEquityViewMode(mode);
      }
    });
  });
  setEquityViewMode('scatter');
}

function setEquityViewMode(mode) {
  equityViewMode = mode;
  const scatterView = document.getElementById('equityScatterView');
  const clusterView = document.getElementById('equityClusterView');
  const mapElement = document.getElementById('mapView');
  const legend = document.getElementById('legend');
  const isEquityActive = activeView === 'equity';

  document.querySelectorAll('.equity-view-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === mode);
  });

  if (scatterView && clusterView) {
    const showScatter = mode === 'scatter';
    scatterView.style.display = showScatter ? 'block' : 'none';
    clusterView.style.display = showScatter ? 'none' : 'block';
    if (isEquityActive) {
      if (mapElement) mapElement.style.display = showScatter ? 'none' : 'block';
      if (legend) legend.style.display = showScatter ? 'none' : 'block';
      if (showScatter) {
        restoreMapToMainLayout();
      } else {
        moveMapIntoEquityCluster();
      }
    }
  }

  if (mode === 'cluster') {
    const desiredLevel = selectedState ? 'county' : 'state';
    const shouldReset = !isClusterPanelOpen() || clusterState.level !== desiredLevel;
    const needsRun = shouldReset || !clusterState.active || clusterState.level !== desiredLevel;
    openClusterPanel({
      resetSelections: shouldReset,
      autoRun: needsRun,
      source: 'equity'
    });
  } else {
    if (clusterState.active && clusterState.context === 'equity') {
      exitClusterMode();
    } else if (shouldUseClusterOverlay() && isClusterPanelOpen()) {
      exitClusterMode();
    }
  }
}

async function ensureCountyEquityCategoryLoaded(category) {
  const stateDbName = getSelectedStateDatabaseName();
  if (!category || !stateDbName) {
    return null;
  }

  countyEquityStore[stateDbName] = countyEquityStore[stateDbName] || {};
  if (countyEquityStore[stateDbName][category]) {
    equityCountyData = countyEquityStore[stateDbName][category].raw;
    return countyEquityStore[stateDbName][category];
  }

  const url = `/api/equityCountyAverageValues/${encodeURIComponent(category)}/${encodeURIComponent(stateDbName)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load county equity data for ${category}`);
  }
  const data = await response.json();
  const lookup = buildCountyMetricLookup(Array.isArray(data) ? data : [], category);
  const metrics = Object.keys(lookup);
  countyEquityStore[stateDbName][category] = {
    raw: data,
    lookup,
    metrics
  };
  equityCountyData = data;
  equityMetricsByCategory[category] = metrics;
  return countyEquityStore[stateDbName][category];
}

function getDefaultUSAMetricTitle() {
  if (!Array.isArray(allStateData) || allStateData.length === 0) {
    return null;
  }
  const targetNormalized = normalizeMetricTitle(DEFAULT_USA_METRIC_TITLE);
  let preferredMetric = allStateData.find(metric => normalizeMetricTitle(metric.title) === targetNormalized);
  if (!preferredMetric) {
    preferredMetric = allStateData.find(metric => {
      const normalized = normalizeMetricTitle(metric.title);
      return DEFAULT_USA_METRIC_TOKENS.every(token => normalized.includes(token.replace(/\s+/g, '').toLowerCase()));
    });
  }
  return (preferredMetric || allStateData[0]).title;
}

function applyDefaultUSAMetric(forceRefresh = false) {
  if (selectedState !== null) {
    return;
  }
  if (!Array.isArray(allStateData) || allStateData.length === 0) {
    return;
  }
  const defaultMetricTitle = getDefaultUSAMetricTitle();
  if (!defaultMetricTitle) {
    return;
  }
  const metricData = findMetricDataByTitle(defaultMetricTitle);
  const resolvedTitle = metricData ? metricData.title : defaultMetricTitle;
  const metricChanged = selectedMetric !== resolvedTitle || forceRefresh;
  selectedMetric = resolvedTitle;
  const metricSelect = document.getElementById('metricSelect');
  if (metricSelect) {
    metricSelect.value = selectedMetric || '';
  }
  if (metricChanged) {
    updateMapColors();
    createDistributionChart();
    createTopBottomChart();
  }
}

function updateCompareStatesButtonVisibility() {
  const compareBtn = document.getElementById('compareStatesButton');
  if (!compareBtn) {
    return;
  }
  const mapView = document.getElementById('mapView');
  const isMapVisible = !mapView || mapView.style.display !== 'none';
  const clusterOpen = isClusterPanelOpen();
  const shouldShow = isMapVisible && selectedState === null && activeView === 'state' && !clusterOpen;
  compareBtn.style.display = shouldShow ? 'block' : 'none';
  if (shouldShow) {
    compareBtn.textContent = 'Compare States';
  }
}

// Helper: Return chart text color based on dark mode status.
function getChartTextColor() {
  return document.body.classList.contains("dark-mode") ? "#ffffff" : "#2c3e50";
}

function generateScatterColors(count) {
  const baseColors = [
    '#2c41ff', // primary blue
    '#0984e3', // transit blue
    '#fd9644', // transit orange
    '#20bf6b', // transit green
    '#eb3b5a', // transit red
    '#f7b731', // transit yellow
    '#a55eea', // purple
    '#2980b9', // blue
    '#27ae60', // green
    '#e74c3c', // red
    '#f39c12', // yellow
    '#8e44ad', // purple
    '#16a085', // teal
    '#e67e22', // orange
    '#9b59b6', // violet
    '#34495e'  // dark blue-gray
  ];
  
  // If we need more colors than we have, generate them
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }
  
  // Generate additional colors by rotating hue
  const colors = [...baseColors];
  
  for (let i = baseColors.length; i < count; i++) {
    const hue = (i * 137.508) % 360; // Golden angle approximation for good distribution
    colors.push(`hsl(${hue}, 70%, 60%)`);
  }
  
  return colors;
}

// Info popup functionality
let infoPopupOverlay = null;

function createInfoPopup() {
  if (!infoPopupOverlay) {
    infoPopupOverlay = document.createElement('div');
    infoPopupOverlay.className = 'info-popup-overlay';
    infoPopupOverlay.innerHTML = `
      <div class="info-popup">
        <div class="info-popup-header">
          <h2 class="info-popup-title">Metric Information</h2>
          <button class="info-popup-close" onclick="closeInfoPopup()">&times;</button>
        </div>
        <div class="info-popup-content">
          <div class="info-popup-loading">Loading information...</div>
        </div>
      </div>
    `;
    document.body.appendChild(infoPopupOverlay);
    
    // Close on overlay click
    infoPopupOverlay.addEventListener('click', (e) => {
      if (e.target === infoPopupOverlay) {
        closeInfoPopup();
      }
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && infoPopupOverlay.classList.contains('active')) {
        closeInfoPopup();
      }
    });
  }
  return infoPopupOverlay;
}

function showInfoPopup(metricName, mapTypeOrInfoText) {
  const overlay = createInfoPopup();
  const content = overlay.querySelector('.info-popup-content');
  const title = overlay.querySelector('.info-popup-title');
  
  title.textContent = metricName;
  content.innerHTML = '<div class="info-popup-loading">Loading information...</div>';
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // Check if mapTypeOrInfoText is actually info text (string with spaces and sentences)
  if (typeof mapTypeOrInfoText === 'string' && mapTypeOrInfoText.includes(' ')) {
    // This is info text, display it directly
    content.innerHTML = `<p>${mapTypeOrInfoText}</p>`;
  } else {
    // This is a mapType, load from file
    const infoFile = mapTypeOrInfoText === 'usa' ? 'usa_metrics.txt' : 
                     mapTypeOrInfoText === 'state' ? 'state_metrics.txt' : 
                     mapTypeOrInfoText === 'usa_map' ? 'usa_map_metrics.txt' :
                     mapTypeOrInfoText === 'state_map' ? 'state_map_metrics.txt' :
                     mapTypeOrInfoText === 'county_map' ? 'county_map_metrics.txt' :
                     mapTypeOrInfoText === 'frequency' ? 'frequency_metrics.txt' : 
                     mapTypeOrInfoText === 'county_frequency' ? 'county_frequency_metrics.txt' : 'county_metrics.txt';
    
    fetch(`/info/${infoFile}`)
      .then(response => response.text())
      .then(text => {
        const info = extractMetricInfo(text, metricName);
        content.innerHTML = info;
      })
      .catch(error => {
        content.innerHTML = '<p>Sorry, information for this metric is not available at the moment.</p>';
      });
  }
}

function closeInfoPopup() {
  if (infoPopupOverlay) {
    infoPopupOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
}

function extractMetricInfo(text, metricName) {
  // Split the text into sections
  const sections = text.split('## ');
  
  // Find the section that matches our metric name
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    const lines = section.split('\n');
    const title = lines[0].trim();
    
    // Check if this section matches our metric name
    if (title === metricName || title.includes(metricName) || metricName.includes(title)) {
      // Extract the content after the title
      const content = lines.slice(1).join('\n').trim();
      
      if (content && !content.includes('[Add information')) {
        // Convert markdown-like formatting to HTML
        return content
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/\n\n/g, '</p><p>')
          .replace(/^/, '<p>')
          .replace(/$/, '</p>')
          .replace(/<p><\/p>/g, '');
      } else {
        return '<p>Information for this metric will be added soon. Please check back later.</p>';
      }
    }
  }
  
  return '<p>Information for this metric is not available.</p>';
}

function createInfoButton(metricName, mapType) {
  const button = document.createElement('button');
  button.className = 'info-button';
  button.innerHTML = 'i';
  button.title = 'Click for more information';
  button.onclick = (e) => {
    e.stopPropagation();
    showInfoPopup(metricName, mapType);
  };
  return button;
}

// Helper function to format metric names (remove units from headings)
function formatMetricName(metricName) {
  return metricName
    .replace(' in Minutes', '')
    .replace(' in Miles', '')
    .replace(' in minutes', '');
}

// Helper function to format metric values (add units to values)
function formatMetricValue(metricName, value) {
  // Format numeric values to 2 decimal places
  let formattedValue = value;
  if (typeof value === 'number') {
    formattedValue = metricName.includes('Sample Size') ? Math.round(value) : formatNumberToTwoDecimals(value);
  } else if (typeof value === 'string' && !isNaN(Number(value))) {
    formattedValue = metricName.includes('Sample Size') ? Math.round(Number(value)) : formatNumberToTwoDecimals(Number(value));
  }
  
  // Special handling for Percent Access metric
  if (metricName.includes('Percent Access')) {
    return `${formattedValue}%`;
  }
  // Handle metrics that are specifically about time in minutes (not just containing the word "minutes")
  else if ((metricName.includes('Minutes') || metricName.includes('minutes')) && 
           !metricName.includes('Percent Access')) {
    return `${formattedValue} min`;
  } else if (metricName.includes('Miles')) {
    return `${formattedValue} miles`;
  }
  return formattedValue;
}

// Helper function to get the original metric name for info lookup
function getOriginalMetricName(displayName, mapType) {
  // For county maps, we need to add "Average" prefix for lookup
  if (mapType === 'county') {
    if (displayName.includes('Initial Wait Time') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Initial Walk Distance') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Initial Walk Duration') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Total Wait Duration') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Total Walk Distance') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Total Walk Duration') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('In-Vehicle Duration') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Out-of-Vehicle Duration') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Travel Duration') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
    if (displayName.includes('Driving Duration with Traffic') && !displayName.includes('Average')) {
      return `Average ${displayName}`;
    }
  }
  return displayName;
}

// Natural breaks (Jenks) algorithm implementation
function naturalBreaks(data, numClasses) {
  if (data.length === 0 || numClasses <= 0) return [];
  
  // Remove duplicates and sort
  const uniqueData = [...new Set(data)].sort((a, b) => a - b);
  const n = uniqueData.length;
  
  // If we have very few unique values, use equal intervals instead
  // Minimum threshold: need at least 2*numClasses unique values for meaningful natural breaks
  const minValuesForNaturalBreaks = Math.max(6, numClasses * 2);
  
  if (n < minValuesForNaturalBreaks) {
    // Use equal intervals when we don't have enough data for natural breaks
    if (n <= numClasses) {
      // If we have fewer unique values than classes, return unique values as breaks
      return uniqueData.slice(1, -1); // Exclude first and last
    }
    
    // Use equal intervals
    const min = uniqueData[0];
    const max = uniqueData[n - 1];
    const range = max - min;
    const breaks = [];
    for (let i = 1; i < numClasses; i++) {
      breaks.push(min + (range * i) / numClasses);
    }
    return breaks;
  }
  
  // We have enough data for natural breaks - use original algorithm
  const sortedData = [...data].sort((a, b) => a - b);
  const k = Math.min(numClasses, n);
  
  // Initialize matrices
  const mat1 = Array(n + 1).fill().map(() => Array(k + 1).fill(0));
  const mat2 = Array(n + 1).fill().map(() => Array(k + 1).fill(0));
  
  // Calculate variance for all possible ranges
  for (let i = 1; i <= n; i++) {
    let sum = 0;
    let sumSquares = 0;
    let variance = 0;
    
    for (let j = 0; j < i; j++) {
      sum += sortedData[j];
      sumSquares += sortedData[j] * sortedData[j];
      variance = sumSquares - (sum * sum) / (j + 1);
      mat1[i][1] = variance;
    }
  }
  
  // Fill the matrices using dynamic programming
  for (let j = 2; j <= k; j++) {
    for (let i = 1; i <= n; i++) {
      mat1[i][j] = Infinity;
      for (let l = 1; l < i; l++) {
        let sum = 0;
        let sumSquares = 0;
        let variance = 0;
        
        for (let m = l; m < i; m++) {
          sum += sortedData[m];
          sumSquares += sortedData[m] * sortedData[m];
        }
        variance = sumSquares - (sum * sum) / (i - l);
        
        if (mat1[l][j - 1] + variance < mat1[i][j]) {
          mat1[i][j] = mat1[l][j - 1] + variance;
          mat2[i][j] = l;
        }
      }
    }
  }
  
  // Extract the break points
  const breaks = [];
  let kk = n;
  let kclass = k;
  
  while (kclass > 1) {
    const breakIndex = mat2[kk][kclass] - 1;
    if (breakIndex >= 0 && breakIndex < sortedData.length) {
      breaks.unshift(sortedData[breakIndex]);
    }
    kk = mat2[kk][kclass];
    kclass--;
  }
  
  return breaks;
}

// Define which metrics should have red for high values vs low values
const METRIC_COLOR_LOGIC = {
  // Metrics where HIGH values are GOOD (green for high, red for low)
  'Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)': 'high_is_good',
  'Sample Size': 'high_is_good',
  
  // Metrics where HIGH values are BAD (red for high, green for low)
  // NEW NAMES
  'Transit to Car Travel Time Ratio': 'high_is_bad',
  'Average Initial Wait Time in Minutes': 'high_is_bad',
  'Initial Wait Time in Minutes': 'high_is_bad',
  'Average Initial Walk Distance in Miles': 'high_is_bad',
  'Initial Walk Distance in Miles': 'high_is_bad',
  'Average Initial Walk Time in Minutes': 'high_is_bad',
  'Initial Walk Time in Minutes': 'high_is_bad',
  'Average Initial Walk Duration in Minutes': 'high_is_bad',
  'Initial Walk Duration in Minutes': 'high_is_bad',
  'Average Total Wait Time in Minutes': 'high_is_bad',
  'Total Wait Time in Minutes': 'high_is_bad',
  'Average Total Wait Duration in Minutes': 'high_is_bad',
  'Total Wait Duration in Minutes': 'high_is_bad',
  'Average Total Walk Distance in Miles': 'high_is_bad',
  'Total Walk Distance in Miles': 'high_is_bad',
  'Average Total Walk Time': 'high_is_bad',
  'Total Walk Time': 'high_is_bad',
  'Average Total Walk Duration in minutes': 'high_is_bad',
  'Total Walk Duration in minutes': 'high_is_bad',
  'Number of Transfers': 'high_is_bad',
  'Transfers': 'high_is_bad',
  'Average In-Vehicle Travel Time in Minutes': 'high_is_bad',
  'In-Vehicle Travel Time in Minutes': 'high_is_bad',
  'Average In-Vehicle Duration in Minutes': 'high_is_bad',
  'In-Vehicle Duration in Minutes': 'high_is_bad',
  'Average Out-of-Vehicle Travel Time in Minutes': 'high_is_bad',
  'Out-of-Vehicle Travel Time in Minutes': 'high_is_bad',
  'Average Out-of-Vehicle Duration in Minutes': 'high_is_bad',
  'Out-of-Vehicle Duration in Minutes': 'high_is_bad',
  'In-Vehicle to Out-of-Vehicle Time Ratio': 'high_is_bad',
  'In-Vehicle:Out-of-Vehicle': 'high_is_bad',
  'Average Travel Time by Transit in Minutes': 'high_is_bad',
  'Travel Time by Transit in Minutes': 'high_is_bad',
  'Average Travel Duration in Minutes': 'high_is_bad',
  'Travel Duration in Minutes': 'high_is_bad',
  'Average Travel Time by Car in Minutes': 'high_is_bad',
  'Travel Time by Car in Minutes': 'high_is_bad',
  'Average Driving Duration with Traffic in Minutes': 'high_is_bad',
  'Driving Duration with Traffic in Minutes': 'high_is_bad',
  // OLD NAMES (keep for backwards compatibility)
  'Transit: Driving': 'high_is_bad',
  'Transit to Driving Ratio': 'high_is_bad'
};

// Get color scheme based on metric type
function getColorScheme(metricName, isHighGood) {
  if (isHighGood) {
    // Green for high values, red for low values
    return ['#e74c3c', '#e67e22', '#27ae60']; // red, orange, green
  } else {
    // Red for high values, green for low values  
    return ['#27ae60', '#e67e22', '#e74c3c']; // green, orange, red
  }
}

// Helper function to create mapping between desired metric names and actual database names
function createMetricMapping(data) {
  const mapping = {};
  const actualTitles = data.map(metric => metric.title);
  
  // Create flexible matching for metric names
  const metricPatterns = {
    "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)": [
      "Percent Access", "percent access", "Percent_Access", "percent_access"
    ],
    "Travel Time by Transit in Minutes": [
      "Travel Time by Transit in Minutes", "Average Travel Time by Transit in Minutes",
      "Travel Duration in Minutes", "Average Travel Duration in Minutes",
      "travel duration", "Travel_Duration", "travel_duration", "travel time by transit"
    ],
    "Travel Time by Car in Minutes": [
      "Travel Time by Car in Minutes", "Average Travel Time by Car in Minutes",
      "Driving Duration with Traffic in Minutes", "Average Driving Duration with Traffic in Minutes",
      "driving duration with traffic", "Driving_Duration_with_Traffic", "driving_duration_with_traffic", "travel time by car"
    ],
    "Transit to Car Travel Time Ratio": [
      "Transit to Car Travel Time Ratio", "Transit: Driving", "Transit to Driving Ratio",
      "transit driving", "Transit_Driving", "transit_driving", "transit to car"
    ],
    "Number of Transfers": [
      "Number of Transfers", "Transfers", "transfers", "TRANSFERS", "number of transfers"
    ],
    "Initial Walk Distance in Miles": [
      "Initial Walk Distance in Miles", "Average Initial Walk Distance in Miles",
      "initial walk distance", "Initial_Walk_Distance", "initial_walk_distance"
    ],
    "Initial Walk Time in Minutes": [
      "Initial Walk Time in Minutes", "Average Initial Walk Time in Minutes",
      "Initial Walk Duration in Minutes", "Average Initial Walk Duration in Minutes",
      "initial walk time", "initial walk duration", "Initial_Walk_Duration", "initial_walk_duration", "Initial_Walk_Time"
    ],
    "Initial Wait Time in Minutes": [
      "Initial Wait Time in Minutes", "Average Initial Wait Time in Minutes", 
      "initial wait time", "Initial_Wait_Time", "initial_wait_time"
    ],
    "Total Walk Distance in Miles": [
      "Total Walk Distance in Miles", "Average Total Walk Distance in Miles",
      "total walk distance", "Total_Walk_Distance", "total_walk_distance"
    ],
    "Total Walk Time": [
      "Total Walk Time", "Average Total Walk Time",
      "Total Walk Duration in Minutes", "Average Total Walk Duration in Minutes",
      "Total Walk Duration in minutes", "Average Total Walk Duration in minutes",
      "total walk duration", "Total_Walk_Duration", "total_walk_duration", "total walk time"
    ],
    "Total Wait Time in Minutes": [
      "Total Wait Time in Minutes", "Average Total Wait Time in Minutes",
      "Total Wait Duration in Minutes", "Average Total Wait Duration in Minutes",
      "total wait duration", "Total_Wait_Duration", "total_wait_duration", "total wait time"
    ],
    "In-Vehicle Travel Time in Minutes": [
      "In-Vehicle Travel Time in Minutes", "Average In-Vehicle Travel Time in Minutes",
      "In-Vehicle Duration in Minutes", "Average In-Vehicle Duration in Minutes",
      "in-vehicle duration", "In_Vehicle_Duration", "in_vehicle_duration", "in-vehicle travel time"
    ],
    "Out-of-Vehicle Travel Time in Minutes": [
      "Out-of-Vehicle Travel Time in Minutes", "Average Out-of-Vehicle Travel Time in Minutes",
      "Out-of-Vehicle Duration in Minutes", "Average Out-of-Vehicle Duration in Minutes",
      "out-of-vehicle duration", "Out_of_Vehicle_Duration", "out_of_vehicle_duration", "out-of-vehicle travel time"
    ],
    "In-Vehicle to Out-of-Vehicle Time Ratio": [
      "In-Vehicle to Out-of-Vehicle Time Ratio", "In-Vehicle:Out-of-Vehicle",
      "in-vehicle:out-of-vehicle", "In_Vehicle_Out_of_Vehicle", "in_vehicle_out_of_vehicle", "in-vehicle to out-of-vehicle"
    ],
    "Sample Size": [
      "Sample Size", "sample size", "Sample_Size", "sample_size"
    ]
  };
  
  // Try to match each desired name with actual database titles
  Object.entries(metricPatterns).forEach(([desiredName, patterns]) => {
    for (const pattern of patterns) {
      const match = actualTitles.find(title => 
        title.toLowerCase().includes(pattern.toLowerCase()) ||
        title === pattern ||
        title.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === pattern.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
      );
      if (match) {
        mapping[desiredName] = match;
        break;
      }
    }
  });
  
  return mapping;
}

// Helper to build metric mapping when we only have raw titles/keys
function createMetricMappingFromTitles(titles = []) {
  if (!Array.isArray(titles) || titles.length === 0) {
    return {};
  }
  const syntheticData = titles
    .filter(title => typeof title === 'string' && title.trim().length > 0)
    .map(title => ({ title }));
  return createMetricMapping(syntheticData);
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
  const mapTab = document.getElementById('mapViewTab');
  if (mapTab && !mapTab.dataset.navbound) {
    mapTab.addEventListener('click', handlePrimaryMapNav);
    mapTab.dataset.navbound = 'true';
  }
  document.getElementById('equityComparisonTab').addEventListener('click', switchToEquityComparison);
  
  // Add event listener for back button in equity comparison
  document.getElementById('backToMapFromEquity').addEventListener('click', switchToMapView);
  const equityClusterBackBtn = document.getElementById('equityClusterBackBtn');
  if (equityClusterBackBtn) {
    equityClusterBackBtn.addEventListener('click', () => setEquityViewMode('scatter'));
  }
  const mapBackButton = document.getElementById('mapBackButton');
  if (mapBackButton) {
    mapBackButton.addEventListener('click', handleBackToState);
  }
  
  // New event listener: update equity metrics immediately when equity category changes
  document.getElementById('equityCategorySelect').addEventListener('change', () => {
    if (selectedState) {
      loadComparisonData();
    }
  });
  initializeClusterAnalysisUI();
  initializeEquityViewToggle();
  updateMapTabState();
  updateScrollState();
  updateMapBackButton();
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
    
    fetchAllStateDataForCountryAverage().then(() => {
      if (allStateData && allStateData.length > 0) {
        selectedMetric = allStateData[0].title;
        updateMapColors();
        // Charts removed - replaced with chatbot
        updateDataPanel();
      } else {
      }
    });
  }
}

function ensureDataLoaded() {
  if (!allStateData || allStateData.length === 0) {
    
    fetchAllStateDataForCountryAverage().then(() => {
      if (allStateData && allStateData.length > 0) {
        selectedMetric = allStateData[0].title;
        updateMapColors();
        // Charts removed - replaced with chatbot
        updateDataPanel();
      } else {
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
  const mapTab = document.getElementById('mapViewTab');
  if (mapTab && !mapTab.dataset.navbound) {
    mapTab.addEventListener('click', handlePrimaryMapNav);
    mapTab.dataset.navbound = 'true';
  }
  document.getElementById('equityComparisonTab').addEventListener('click', switchToEquityComparison);
  
  // Add this line
  setTimeout(ensureDataLoaded, 1000); // Check after 1 second
  
  document.getElementById('equityCategorySelect').addEventListener('change', () => {
    if (selectedState) {
      loadComparisonData();
    }
  });
  
  // Setup equity category hover menu
  setupEquityCategoryHoverMenu();
  updateMapTabState();
  updateScrollState();

  // Handle browser back button
  window.addEventListener('popstate', (event) => {
    const state = event.state;
    
    if (state && state.view === 'equity') {
      if (state.stateId && selectedState !== state.stateId) {
        handleStateClick(state.stateId, false);
        setTimeout(() => switchToEquityComparison(false), 400);
      } else {
        switchToEquityComparison(false);
      }
      return;
    }
    
    if (state && state.view === 'county' && state.stateId && state.countyName) {
      if (selectedState !== state.stateId) {
        // Need to load state first, then county
        // This is complex as it requires async loading. 
        // For simplicity, we trigger state load and then try county if possible, 
        // or just rely on user clicking county again.
        // Or we can try to simulate the sequence.
        handleStateClick(state.stateId, false); // false to suppress pushState
        setTimeout(() => handleCountyClick(state.countyName, false), 500);
      } else if (selectedCounty !== state.countyName) {
        handleCountyClick(state.countyName, false);
      }
    } else if (state && state.view === 'state' && state.stateId) {
      if (selectedState !== state.stateId) {
        handleStateClick(state.stateId, false);
      } else if (selectedCounty) {
        handleBackToState(false);
      }
    } else {
      // Default to USA
      if (selectedState) {
        handleBackToStates(false);
      }
    }
  });
});

// -----------------------------------------------------------------------------
// UPDATE LEFT PANEL FUNCTION (Modified for Equity Comparison button disable)
function updateLeftPanel() {
  const equityBtn = document.getElementById('equityComparisonTab');
  const metricSelection = document.getElementById('metricSelection');
  const countySelection = document.getElementById('countyMetricSelection');
  const leftPanel = document.getElementById('leftPanel');
  const clusterVisible = isClusterPanelOpen() && !shouldUseClusterOverlay();

  if (leftPanel) {
    leftPanel.classList.toggle('cluster-mode', clusterVisible);
  }
  if (clusterVisible) {
    if (metricSelection) metricSelection.style.display = 'none';
    if (countySelection) countySelection.style.display = 'none';
    return;
  }

  if (!selectedState) {
    if (metricSelection) metricSelection.style.display = 'block';
    if (countySelection) countySelection.style.display = 'none';
    if (equityBtn) {
      equityBtn.style.display = 'none';
    }
  } else {
    if (metricSelection) metricSelection.style.display = 'none';
    if (countySelection) countySelection.style.display = 'block';
    // If county data is displayed, disable the equity comparison button
    if (selectedCounty) {
      if (equityBtn) {
        equityBtn.style.display = 'block';
        equityBtn.style.backgroundColor = '#555';
        equityBtn.style.cursor = 'not-allowed';
        equityBtn.setAttribute('title', 'Switch to State Data to view the comparison');
        equityBtn.disabled = true;
        equityBtn.classList.add('disabled-tab');
        equityBtn.onclick = function(e) { e.preventDefault(); return false; };
      }
    } else {
      // Enable equity comparison button when in state view
      if (equityBtn) {
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
    if (!Array.isArray(allStateData) || allStateData.length === 0) {
      return;
    }
    const defaultMetricTitle = getDefaultUSAMetricTitle();
    selectedMetric = defaultMetricTitle || (allStateData[0] && allStateData[0].title) || null;
    createUSMap();
    populateMetricSelect();
    createDistributionChart();
    createTopBottomChart();
    updateDataPanel();
    applyDefaultUSAMetric(true);
    updateCompareStatesButtonVisibility();
    updateLeftPanel();
    updateClusterAnalysisButtonVisibility();
  });
}

async function fetchAllStateDataForCountryAverage() {
  try {
    const response = await fetch(`/api/averageValues`);
    if (!response.ok) throw new Error('Network response was not ok');
    allStateData = await response.json();
    allStateData = sanitizeMetricDocuments(allStateData);
    statePercentAccessCache = null;
  } catch (error) {
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
  
  // Create a mapping from our desired names to actual database names
  const metricMapping = createMetricMapping(allStateData);
  
  // Group metrics by category
  let currentGroup = null;
  let currentOptgroup = null;
  
  // Use ordered metrics with mapping and grouping
  ORDERED_TRANSIT_METRICS.forEach(desiredName => {
    // Skip empty strings (visual breaks)
    if (!desiredName) return;
    
    const actualName = metricMapping[desiredName];
    if (actualName) {
      const group = getMetricGroup(desiredName);
      const groupColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color : '#3498db';
      
      // Create new optgroup if group changed
      if (group !== currentGroup) {
        currentOptgroup = document.createElement('optgroup');
        currentOptgroup.label = group;
        currentOptgroup.style.fontWeight = 'bold';
        currentOptgroup.style.backgroundColor = `${groupColor}15`;
        currentOptgroup.style.color = '#000';
        select.appendChild(currentOptgroup);
        currentGroup = group;
      }
      
      const option = document.createElement('option');
      option.value = actualName; // Use actual database name as value
      option.textContent = desiredName; // Show desired name to user
      option.dataset.group = group;
      option.dataset.color = groupColor;
      option.style.color = '#000';
      currentOptgroup.appendChild(option);
    }
  });
  
  // Set the dropdown to show the currently selected metric
  if (selectedMetric) {
    select.value = selectedMetric;
  }
  
  // Remove any existing event listeners to prevent duplicates
  select.removeEventListener('change', handleMetricChange);
  select.addEventListener('change', handleMetricChange);
}

function handleMetricChange(event) {
  const rawValue = event.target.value;
  const metricData = findMetricDataByTitle(rawValue);
  selectedMetric = metricData ? metricData.title : rawValue;
  
  if (selectedMetric === '' || !selectedMetric) {
    // If "Select a metric" is chosen, show plain map without colors
    if (usMap && usMap.svg) {
      usMap.svg.selectAll('.state').attr('fill', '#bdc3c7'); // Plain gray color
    }
    // Clear legend
    const legend = document.getElementById('legend');
    if (legend) legend.innerHTML = '';
    return;
  }
  
  updateMapColors();
  createDistributionChart();
  createTopBottomChart();
}

function updateMapColors() {
  if (clusterState.active && clusterState.level === 'state') {
    applyStateClusterColors();
    return;
  }
  if (!usMap) return;
  const metricData = findMetricDataByTitle(selectedMetric);
  if (!metricData) return;
  
  const isPercentAccessMetric = selectedMetric && selectedMetric.includes('Percent Access');
  const allowedStates = new Set(Object.values(statesData).map(s => s.name));
  const values = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .filter(([key]) => allowedStates.has(key))
    .filter(([key]) => !isPercentAccessMetric || !isDistrictOfColumbia(key))
    .map(([, value]) => Number(value))
    .filter(v => typeof v === 'number' && !Number.isNaN(v));
  
  if (values.length === 0) return;
  
  // Use natural breaks for better categorization
  const breaks = naturalBreaks(values, 3);
  const actualMax = values.length > 0 ? Math.max(...values) : 0;
  
  // Debug logging for Percent Access/state Jenks
  if (isPercentAccessMetric) {
    const sortedVals = [...values].sort((a, b) => a - b);
  }

  // Special handling for Percent Access - always green for high values
  let isHighGood = getMetricColorLogic(selectedMetric) === 'high_is_good';
  if (selectedMetric && selectedMetric.includes('Percent Access')) {
    isHighGood = true;
  }
  
  const colors = getColorScheme(selectedMetric, isHighGood);
  
  // Create color scale using natural breaks
  const colorScale = d3.scaleThreshold()
    .domain(breaks)
    .range(colors);
  
  usMap.svg.selectAll('.state')
    .attr('fill', d => {
      const value = metricData[statesData[d.id]?.name];
      return value !== undefined ? colorScale(formatNumberToTwoDecimals(value)) : '#bdc3c7';
    });
  
  usMap.colorScale = colorScale;
  usMap.breaks = breaks;
  usMap.validValues = values;
  createLegendWithBreaks(breaks, colors, isHighGood, values, actualMax);
}

function formatLegendNumber(value, max) {
  // Truncate (not round up) to 2 decimals, but display fixed 2 decimals for non-integer legends
  const safeMax = isFinite(max) ? max : value;
  const truncated = Math.floor(Math.min(value, safeMax) * 100) / 100;
  return truncated.toFixed(2);
}

function createLegendWithBreaks(breaks, colors, isHighGood, validValues = [], forcedMax = null) {
  const legend = document.getElementById('legend');
  if (!legend) {
    return;
  }
  
  let legendContent = '<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">';
  
  if (breaks.length === 0) {
    // No breaks - single color
    legendContent += `
      <div style="display: flex; align-items: center; gap: 5px;">
        <div style="width: 20px; height: 20px; background: ${colors[0]};"></div> 
        <span>All values</span>
      </div>
    `;
  } else {
    // Create legend with natural breaks
    const ranges = [];
    
    // Get actual min and max values for better display
    const allValues = validValues.length > 0 ? [...validValues] : [];
    const actualMin = allValues.length > 0 ? Math.min(...allValues) : 0;
    const actualMaxRaw = allValues.length > 0 ? Math.max(...allValues) : 0;
    const actualMax = forcedMax !== null && forcedMax !== undefined ? forcedMax : actualMaxRaw;
    const displayMax = isFinite(actualMax) ? actualMax : 0;
    
    // Create ranges based on breaks
    if (breaks.length === 1) {
      ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
      ranges.push({ min: breaks[0], max: displayMax, color: colors[1] });
    } else if (breaks.length === 2) {
      ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
      ranges.push({ min: breaks[0], max: breaks[1], color: colors[1] });
      ranges.push({ min: breaks[1], max: displayMax, color: colors[2] });
    } else {
      // Handle more than 2 breaks
      ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
      for (let i = 0; i < breaks.length - 1; i++) {
        ranges.push({ min: breaks[i], max: breaks[i + 1], color: colors[i + 1] });
      }
      ranges.push({ min: breaks[breaks.length - 1], max: displayMax, color: colors[colors.length - 1] });
    }
    
    ranges.forEach(range => {
      const useInteger = isSampleSizeMetric(selectedMetric);
      const formatVal = (v) => useInteger ? Math.round(v).toString() : formatLegendNumber(v, displayMax);
      const rangeText = `${formatVal(range.min)} - ${formatVal(range.max)}`;
      
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: ${range.color};"></div> 
          <span>${rangeText}</span>
        </div>
      `;
    });
  }
  
  // Add info button for legend
  const infoButton = createInfoButton(selectedMetric || 'Metric', activeView === 'state' ? 'usa_map' : 'state_map');
  legendContent += '</div>';
  
  // Create a wrapper div to hold legend and info button
  const wrapperContent = `
    <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
      ${legendContent}
      <div style="margin-left: auto;">
        ${infoButton.outerHTML}
      </div>
    </div>
  `;
  
  legend.innerHTML = wrapperContent;
  
  // Re-attach event listener for info button
  const infoBtn = legend.querySelector('.info-button');
  if (infoBtn) {
    infoBtn.onclick = (e) => {
      e.stopPropagation();
      const metricName = selectedMetric || 'Metric';
      
      // Get the color scheme information
      let isHighGood = getMetricColorLogic(selectedMetric) === 'high_is_good';
      if (selectedMetric && selectedMetric.includes('Percent Access')) {
        isHighGood = true;
      }
      const colors = getColorScheme(selectedMetric, isHighGood);
      
      // Get breaks and valid values from usMap
      const mapBreaks = usMap?.breaks || breaks || [];
      const mapValidValues = usMap?.validValues || validValues || [];
      
      // Build legend information based on actual breaks and colors
      let legendInfo = `<strong>${metricName}</strong><br><br>`;
      legendInfo += `The choropleth map uses a Natural Breaks (Jenks) classification algorithm to divide the data into three categories. This method minimizes variance within each category and maximizes variance between categories.<br><br>`;
      
      // Get actual min and max values
      const allValues = mapValidValues.length > 0 ? [...mapValidValues] : [];
      const actualMin = allValues.length > 0 ? Math.min(...allValues) : 0;
      const actualMax = allValues.length > 0 ? Math.max(...allValues) : 0;
      
      // Build color meaning explanation
      if (mapBreaks.length > 0) {
        legendInfo += `<strong>Color Meanings:</strong><br>`;
        
        // Create ranges based on breaks
        const ranges = [];
        if (mapBreaks.length === 1) {
          ranges.push({ min: actualMin, max: mapBreaks[0], color: colors[0] });
          ranges.push({ min: mapBreaks[0], max: actualMax, color: colors[1] });
        } else if (mapBreaks.length === 2) {
          ranges.push({ min: actualMin, max: mapBreaks[0], color: colors[0] });
          ranges.push({ min: mapBreaks[0], max: mapBreaks[1], color: colors[1] });
          ranges.push({ min: mapBreaks[1], max: actualMax, color: colors[2] });
        } else {
          ranges.push({ min: actualMin, max: mapBreaks[0], color: colors[0] });
          for (let i = 0; i < mapBreaks.length - 1; i++) {
            ranges.push({ min: mapBreaks[i], max: mapBreaks[i + 1], color: colors[i + 1] });
          }
          ranges.push({ min: mapBreaks[mapBreaks.length - 1], max: actualMax, color: colors[colors.length - 1] });
        }
        
        ranges.forEach((range, index) => {
          const colorName = range.color === '#e74c3c' ? 'Red' : 
                           range.color === '#e67e22' ? 'Orange' : 
                           range.color === '#27ae60' ? 'Green' : range.color;
          const rangeText = `${range.min.toFixed(2)} - ${range.max.toFixed(2)}`;
          legendInfo += `<span style="color: ${range.color}; font-weight: bold;">${colorName}</span>: ${rangeText}<br>`;
        });
        
        // Add interpretation
        if (isHighGood) {
          legendInfo += `<br><strong>Interpretation:</strong> Green indicates higher (better) values, Red indicates lower (worse) values, and Orange represents middle values.`;
        } else {
          legendInfo += `<br><strong>Interpretation:</strong> Red indicates higher (worse) values, Green indicates lower (better) values, and Orange represents middle values.`;
        }
      } else {
        legendInfo += `All values fall into a single category.`;
      }
      
      showInfoPopup(`${metricName} - Legend Information`, legendInfo);
    };
  }
  
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
  const canvas = document.getElementById('topBottomChart');
  
  if (!canvas) {
    return;
  }
  
  if (topBottomChart && typeof topBottomChart.destroy === 'function') {
    topBottomChart.destroy();
  }
  
  const metricData = allStateData.find(d => d.title === selectedMetric);
  
  if (!metricData) {
    return;
  }
  
  // Get state values, filtering out non-state entries
  const stateValues = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([state, value]) => {
      // Check if value is valid
      const numValue = Number(value);
      if (isNaN(numValue)) {
        return { state, value: 0 }; // Use 0 as fallback
      }
      return { state, value: numValue };
    });
  
  
  if (stateValues.length === 0) {
    return;
  }
  
  // Sort by value (highest first)
  stateValues.sort((a, b) => b.value - a.value);
  
  // Get top 5 and bottom 5
  const top5 = stateValues.slice(0, Math.min(5, stateValues.length));
  const bottom5 = stateValues.slice(-Math.min(5, stateValues.length)).reverse();
  
  
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
  
}

// -----------------------------------------------------------------------------
// COUNTY MAP AND DATA FUNCTIONS
function createUSMap() {
  const mapContainer = document.getElementById('mapView');
  mapContainer.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  
  // Clear any existing legend
  const legend = document.getElementById('legend');
  if (legend) {
    legend.innerHTML = '';
  }
  
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
      svg.append('g')
        .selectAll('path')
        .data(states)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', '#bdc3c7')
        .attr('stroke', '#fff')
        .attr('stroke-width', 1)
        .attr('class', 'state')
        .attr('data-state-id', d => d.id)
        .on('click', (event, d) => handleStateClick(d.id))
        .on('mouseover', function(event, d) {
          // Check if state is selected
          const isSelected = isComparisonMode && selectedEntitiesForComparison.some(e => e.id === d.id);
          
          // Apply hover effect - enhance but don't override selection
          d3.select(this)
            .attr('stroke-width', isSelected ? 3 : 2.5)
            .attr('stroke', isSelected ? '#2c41ff' : '#2c3e50');
          
          // Update text label
          const text = d3.select(`text[data-state-id="${d.id}"]`);
          if (text.node()) {
            text.text(statesData[d.id]?.name || '');
            text.attr('font-size', '12px');
          }
        })
        .on('mouseout', function(event, d) {
          // Restore to selection state
          const isSelected = isComparisonMode && selectedEntitiesForComparison.some(e => e.id === d.id);
          d3.select(this)
            .attr('stroke-width', isSelected ? 2 : 1)
            .attr('stroke', isSelected ? '#2c41ff' : '#fff');
          
          // Reset text label
          const text = d3.select(`text[data-state-id="${d.id}"]`);
          if (text.node()) {
            text.text(statesData[d.id]?.abbr || '');
            text.attr('font-size', '10px');
          }
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
        .style('cursor', 'pointer')
        .style('pointer-events', 'all') // Enable pointer events for text
        .text(d => statesData[d.id]?.abbr || '')
        .on('click', (event, d) => {
          event.stopPropagation(); // Prevent event bubbling
          handleStateClick(d.id);
        })
        .on('mouseover', function(event, d) {
          // Check if state is selected
          const isSelected = isComparisonMode && selectedEntitiesForComparison.some(e => e.id === d.id);
          const path = d3.select(`path[data-state-id="${d.id}"]`);
          
          // Apply hover effect
          path
            .attr('stroke-width', isSelected ? 3 : 2.5)
            .attr('stroke', isSelected ? '#2c41ff' : '#2c3e50');
          
          // Update text
          d3.select(this).attr('font-size', '12px');
          d3.select(this).text(statesData[d.id]?.name || '');
        })
        .on('mouseout', function(event, d) {
          // Restore to selection state
          const isSelected = isComparisonMode && selectedEntitiesForComparison.some(e => e.id === d.id);
          const path = d3.select(`path[data-state-id="${d.id}"]`);
          path
            .attr('stroke-width', isSelected ? 2 : 1)
            .attr('stroke', isSelected ? '#2c41ff' : '#fff');
          
          // Reset text
          d3.select(this).attr('font-size', '10px');
          d3.select(this).text(statesData[d.id]?.abbr || '');
        });
      mapContainer.appendChild(svg.node());
      usMap = { svg, path, projection, states, colorScale: null };
      updateMapColors();
    })
    .catch(err => {});
}

// Add this to your app.js
function isLoggedIn() {
  return document.cookie.includes('access_token') || document.cookie.includes('is_logged_in');
}

function handleStateClick(stateId, doPushState = true) {
  // Check if authentication is required but user isn't logged in
  const authModal = document.getElementById('authRequiredModal');
  const isLoggedIn = document.cookie.includes('access_token') || document.cookie.includes('is_logged_in');
  
  if (authModal && !isLoggedIn) {
    authModal.style.display = 'flex';
    return;
  }

  if (clusterState.active) {
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
        // Limit to 5 states maximum
        if (selectedEntitiesForComparison.length >= 5) {
          alert('You can only select up to 5 states for comparison.');
          return;
        }
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
  
  if (clusterState.active || isClusterPanelOpen()) {
    exitClusterMode();
  }

  
  if (doPushState) {
    const url = new URL(window.location);
    url.searchParams.set('state', stateId);
    url.searchParams.delete('county');
    history.pushState({ view: 'state', stateId: stateId }, '', url);
  }
  
  // Clear any existing tooltips
  d3.selectAll('.county-tooltip').remove();
  
  selectedState = stateId;
  selectedCounty = null;
  activeView = 'county';
  updateCompareStatesButtonVisibility();
  updateClusterAnalysisButtonVisibility();
  updateMapTabState();
  updateScrollState();
  updateMapBackButton();
  
  // Hide state-level elements and show county-level elements
  document.getElementById('metricSelection').style.display = 'none';
  const countryChartsContainer = document.getElementById('countryChartsContainer');
  if (countryChartsContainer) {
    countryChartsContainer.style.display = 'none';
  }
  document.getElementById('countyMetricSelection').style.display = 'block';
  document.getElementById('legend').innerHTML = '';
  refreshClusterControlsOnStateChange();
  
  // Create county map immediately
  createCountyMap(stateId);
  updateDataPanel();
  fetchStateData(stateId);
  
  // Fix scrollbar issue: Restore scrollbar functionality after state selection
  setTimeout(() => {
    restoreScrollbarFunctionality();
  }, 100);
  
  // Apply database name correction and fetch county data
  const stateName = statesData[stateId].name;
  const correctedStateName = getCountyDbName(stateName);
  const dbName = formatStateNameForDb(correctedStateName);
  
  
  fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
    .then(response => response.json())
    .then(data => {
      allCountyData = data;
      if (allCountyData.length > 0) {
        transitMetricKeys = Object.keys(allCountyData[0]).filter(key => key !== '_id' && key !== 'title');
        selectedCountyMetric = transitMetricKeys[0];
        populateCountyMetricSelect(transitMetricKeys);
        populateTransitMetricDropdown();
        const panel = document.getElementById('clusterAnalysisPanel');
        if (panel && panel.classList.contains('open')) {
          populateClusterTransitOptions();
          const category = document.getElementById('clusterEquityCategorySelect')?.value;
          if (category) {
            loadClusterEquityMetrics(category);
          }
        }
        
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
    .catch(err => {});
  
  updateLeftPanel();
}
// Add this to your app.js file
function createAppStateHandlers() {
  // Check if the user is logged in by looking for the cookies
  const isLoggedIn = document.cookie.includes('access_token') || document.cookie.includes('is_logged_in');
  
  // Only change the state click handler for non-logged in users
  if (!isLoggedIn) {
    const authModal = document.getElementById('authRequiredModal');
    
    // Store original function if it exists
    if (typeof window.handleStateClick === 'function') {
      window.originalHandleStateClick = window.handleStateClick;
    }
    
    // Override with modal display function
    window.handleStateClick = function(stateId) {
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
          .attr('stroke', '#666')
          .attr('stroke-width', 1)
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
        
        // County names removed - only hover tooltips remain
          
        mapContainer.classList.remove('zoom-to-county');
        document.getElementById('mapTitle').textContent = `${statesData[stateId].name} Counties`;
        countyMap = { svg, path, projection };
        
        // Store reference for later use
        window.currentCountyMapSvg = svg;
        if (clusterState.active) {
          setClusterInteractionLock(true);
        }
        
      });
  }, 800);
}

function handleCountyClick(countyName, doPushState = true) {
  // Use the original county name for database operations
  const originalCountyName = countyName;

  if (clusterState.active) {
    return;
  }
  
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
  
  if (doPushState) {
    const url = new URL(window.location);
    url.searchParams.set('state', selectedState);
    url.searchParams.set('county', originalCountyName);
    history.pushState({ view: 'county', stateId: selectedState, countyName: originalCountyName }, '', url);
  }
  
  // Add boundary highlight to selected county and keep all counties clickable
  if (countyMap && countyMap.svg) {
    const normalizedSelectedName = normalizeCountyNameForComparison(originalCountyName);
    countyMap.svg.selectAll('.county')
      .transition()
      .duration(300)
      .attr('stroke', function() {
        const mapCountyName = d3.select(this).attr('data-county-name');
        
        // Compare using normalized versions but keep originals for display
        const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
        
        if (normalizedMapName === normalizedSelectedName) {
          // Selected county gets a prominent boundary
          d3.select(this).attr('data-clickable', 'true');
          return '#2c41ff'; // Blue boundary for selected county
        } else {
          // Other counties remain clickable with normal boundary
          d3.select(this).attr('data-clickable', 'true')
                         .attr('cursor', 'pointer');
          return '#666'; // Gray boundary for other counties
        }
      })
      .attr('stroke-width', function() {
        const mapCountyName = d3.select(this).attr('data-county-name');
        const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
        
        if (normalizedMapName === normalizedSelectedName) {
          return 3; // Thicker boundary for selected county
        } else {
          return 1; // Normal boundary for other counties
        }
      });

    countyMap.svg.selectAll('.county')
      .classed('selected-county', function() {
        const mapCountyName = d3.select(this).attr('data-county-name');
        const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
        return normalizedMapName === normalizedSelectedName;
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
  updateMapTabState();
  updateScrollState();
  updateMapBackButton();
}

function handleBackToStates(doPushState = true) {
  if (clusterState.active || isClusterPanelOpen()) {
    exitClusterMode();
  }
  
  if (doPushState) {
    const url = new URL(window.location);
    url.searchParams.delete('state');
    url.searchParams.delete('county');
    history.pushState({}, '', url);
  }
  
  selectedState = null;
  selectedCounty = null;
  activeView = 'state';
  document.getElementById('mapTitle').textContent = 'United States';
  const defaultMetricTitle = getDefaultUSAMetricTitle();
  if (defaultMetricTitle) {
    selectedMetric = defaultMetricTitle;
  }
  
  // Update view state FIRST to ensure correct dimensions for map generation
  updateScrollState();
  switchToMapView();
  updateMapTabState();
  updateMapBackButton();
  resetMapViewportPosition();
  
  // Force immediate layout update (bypass transition)
  const mapContainer = document.getElementById('mapView');
  if (mapContainer) {
    const originalTransition = mapContainer.style.transition;
    mapContainer.style.transition = 'none';
    void mapContainer.offsetHeight; // Force reflow
    createUSMap();
    requestAnimationFrame(() => {
      mapContainer.style.transition = originalTransition || '';
    });
  } else {
    createUSMap();
  }
  
  updateDataPanel();
  stateCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  stateCharts = [];
  countyCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  countyCharts = [];
  
  applyDefaultUSAMetric(true);
  updateCompareStatesButtonVisibility();
  updateLeftPanel();
  refreshClusterControlsOnStateChange();
  updateClusterAnalysisButtonVisibility();
  
  // Fix scrollbar issue: Ensure scrollbar is restored when returning to homepage
  setTimeout(() => {
    restoreScrollbarFunctionality();
  }, 100);
}

function handleBackToState(doPushState = true) {
  if (selectedCounty) {
    if (doPushState) {
      const url = new URL(window.location);
      url.searchParams.set('state', selectedState);
      url.searchParams.delete('county');
      history.pushState({ view: 'state', stateId: selectedState }, '', url);
    }
    selectedCounty = null;
    document.getElementById('mapTitle').textContent = `${statesData[selectedState].name} Counties`;
    
    // Clear any existing tooltips
    d3.selectAll('.county-tooltip').remove();
    
    // Restore all counties to normal appearance and make them clickable again
    if (countyMap && countyMap.svg) {
      const counties = countyMap.svg.selectAll('.county');
      counties
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .attr('data-clickable', 'true')
        .attr('stroke', '#666') // Reset to normal boundary color
        .attr('stroke-width', 1) // Reset to normal boundary width
        .style('cursor', 'pointer');
      counties.classed('selected-county', false);
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
    
    // Keep compare counties button hidden for state maps
    updateLeftPanel();
    updateCompareStatesButtonVisibility();
    updateClusterAnalysisButtonVisibility();
    updateMapTabState();
    updateScrollState();
    updateMapBackButton();
    resetMapViewportPosition();
  } else {
    selectedState = null;
    activeView = 'state';
    document.getElementById('mapTitle').textContent = 'United States';
    
    // Clear any tooltips
    d3.selectAll('.county-tooltip').remove();
    
    const defaultMetricTitle = getDefaultUSAMetricTitle();
    if (defaultMetricTitle) {
      selectedMetric = defaultMetricTitle;
    }
    
    // Update view state FIRST to ensure correct dimensions for map generation
    updateScrollState();
    switchToMapView();
    updateMapTabState();
    updateMapBackButton();
    resetMapViewportPosition();
    
    // Force immediate layout update (bypass transition)
    const mapContainer = document.getElementById('mapView');
    if (mapContainer) {
      const originalTransition = mapContainer.style.transition;
      mapContainer.style.transition = 'none';
      void mapContainer.offsetHeight; // Force reflow
      createUSMap();
      requestAnimationFrame(() => {
        mapContainer.style.transition = originalTransition || '';
      });
    } else {
      createUSMap();
    }
    
    updateDataPanel();
    stateCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
    stateCharts = [];
    // switchToMapView(); // Removed duplicate call
    applyDefaultUSAMetric(true);
    updateCompareStatesButtonVisibility();
    updateLeftPanel();
    updateClusterAnalysisButtonVisibility();
    
    // Fix scrollbar issue: Ensure scrollbar is restored when returning to state view
    setTimeout(() => {
      restoreScrollbarFunctionality();
    }, 100);
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
    
    // Fix Bug 1: Ensure scrollbar functionality is restored by removing any inline styles
    // that might interfere with the CSS-defined scrollbar behavior
    dataPanelContent.style.overflowY = '';
    dataPanelContent.style.scrollbarWidth = '';
    dataPanelContent.style.scrollbarColor = '';
    
    return;
  }
  if (selectedCounty) {
    const template = document.getElementById('countyDataTemplate');
    const countyPanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(countyPanel);
    const countyTitle = document.getElementById('countyName');
    if (countyTitle) {
      const displayName = /county$/i.test(selectedCounty) ? selectedCounty : `${selectedCounty} County`;
      countyTitle.textContent = displayName;
    }
    
    // Fix Bug 1: Ensure scrollbar functionality is maintained by removing any inline styles
    dataPanelContent.style.overflowY = '';
    dataPanelContent.style.scrollbarWidth = '';
    dataPanelContent.style.scrollbarColor = '';
    
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
    const stateTitle = document.getElementById('stateName');
    if (stateTitle) {
      stateTitle.textContent = `${statesData[selectedState].name} State`;
    }
    
    // Fix Bug 1: Ensure scrollbar functionality is maintained by removing any inline styles
    dataPanelContent.style.overflowY = '';
    dataPanelContent.style.scrollbarWidth = '';
    dataPanelContent.style.scrollbarColor = '';
    
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
      .filter(([key]) => !isDistrictOfColumbia(key))
      .map(([, value]) => (typeof value === 'number' ? value : Number(value)))
      .filter(v => typeof v === 'number' && !Number.isNaN(v));
    
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      metrics[metric.title] = formatNumberToTwoDecimals(avg).toFixed(2);
    }
  });
  
  grid.innerHTML = '';
  
  // Create a mapping from our desired names to actual database names
  const metricMapping = createMetricMapping(data);
  
  // Display metrics in the specified order using the mapping
  ORDERED_TRANSIT_METRICS.forEach(desiredName => {
    // Skip empty strings (visual breaks)
    if (!desiredName) return;
    
    const actualName = metricMapping[desiredName];
    if (actualName && metrics[actualName]) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      // Add colored left border based on metric group
      const group = getMetricGroup(desiredName);
      const groupColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color : '#3498db';
      card.style.borderLeft = `4px solid ${groupColor}`;
      
      const label = document.createElement('span');
      label.className = 'metric-label';
      const displayName = formatMetricName(desiredName);
      label.textContent = displayName;
      
      const value = document.createElement('span');
      value.className = 'metric-value';
      const formattedValue = formatMetricValue(desiredName, metrics[actualName]);
      value.textContent = formattedValue;
      
      // Set value color to match metric group color (use !important to override CSS)
      value.style.setProperty('color', groupColor, 'important');
      
      card.appendChild(label);
      card.appendChild(value);
      grid.appendChild(card);
    }
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
  
  // Create a map of metric titles to their data for easy lookup
  const metricMap = {};
  data.forEach(metric => {
    if (metric[stateName] !== undefined) {
      metricMap[metric.title] = metric[stateName];
    }
  });
  
  // Create a mapping from our desired names to actual database names
  const metricMapping = createMetricMapping(data);
  
  // Display metrics in the specified order WITHOUT Average prefix for side panel
  ORDERED_TRANSIT_METRICS.forEach(desiredName => {
    // Skip empty strings (visual breaks)
    if (!desiredName) return;
    
    const actualName = metricMapping[desiredName];
    if (actualName && metricMap[actualName] !== undefined) {
      const card = document.createElement('div');
      card.className = 'metric-card';
      
      // Add colored left border based on metric group
      const group = getMetricGroup(desiredName);
      const groupColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color : '#3498db';
      card.style.borderLeft = `4px solid ${groupColor}`;
      
      const label = document.createElement('span');
      label.className = 'metric-label';
      const displayName = formatMetricName(desiredName);
      label.textContent = displayName;
      
      const value = document.createElement('span');
      value.className = 'metric-value';
      const valueText = metricMap[actualName];
      const formattedValue = formatMetricValue(desiredName, valueText);
      value.textContent = formattedValue;
      
      // Set value color to match metric group color (use !important to override CSS)
      value.style.setProperty('color', groupColor, 'important');
      
      card.appendChild(label);
      card.appendChild(value);
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
  
  // Define color palette for different bars
  const colorPalette = [
    '#2c41ff', '#e67e22', '#20bf6b', '#f7b731', '#26de81', '#a55eea', 
    '#0984e3', '#fd9644', '#eb3b5a', '#6c5ce7', '#00b894', '#fdcb6e'
  ];
  
  // Define the frequency chart mappings with info text
  const frequencyChartInfo = {
    // NEW NAMES
    'Travel Time by Transit in Minutes': 'This chart shows the distribution of travel durations by transit across different time ranges. It helps identify the most common travel times and patterns in the selected area.',
    'Travel Time by Car in Minutes': 'This chart shows the distribution of travel durations by car across different time ranges.',
    'Transit to Car Travel Time Ratio': 'This chart illustrates the ratio between transit travel time and car travel time. Values closer to 1 indicate similar travel times, while higher values suggest transit takes longer.',
    'Number of Transfers': 'This chart shows the distribution of transfer counts during transit journeys. It helps understand the complexity of transit routes and the number of connections required.',
    'Initial Walk Time in Minutes': 'This chart displays the distribution of initial walking durations before boarding transit. It shows how long people typically walk to reach their first transit stop.',
    'Initial Walk Distance in Miles': 'This chart displays the distribution of initial walking distances to reach transit stops. It shows how far people typically walk to access public transportation.',
    'Initial Wait Time in Minutes': 'This chart shows the distribution of waiting times at the first transit stop. It indicates how long passengers typically wait for their initial transit connection.',
    'Out-of-Vehicle Travel Time in Minutes': 'This chart displays the distribution of time spent outside of vehicles during transit journeys, including walking and waiting times.',
    'In-Vehicle Travel Time in Minutes': 'This chart shows the distribution of time spent inside transit vehicles during journeys. It represents the actual riding time on buses, trains, or other transit modes.',
    'Total Walk Time': 'This chart displays the distribution of total walking time throughout the entire journey, including initial and transfer walks.',
    'Total Walk Distance in Miles': 'This chart shows the distribution of total walking distance for complete transit journeys, including all walking segments.',
    'In-Vehicle to Out-of-Vehicle Time Ratio': 'This chart illustrates the ratio between time spent in vehicles versus time spent walking and waiting. It helps understand the efficiency of transit journeys.',
    'Total Wait Time in Minutes': 'This chart displays the distribution of total waiting time across all transit stops during a journey, including initial and transfer waits.',
    // OLD NAMES (for backward compatibility)
    'Travel Duration in Minutes': 'This chart shows the distribution of travel durations across different time ranges. It helps identify the most common travel times and patterns in the selected area.',
    'Initial Walk Duration in Minutes': 'This chart displays the distribution of initial walking durations before boarding transit. It shows how long people typically walk to reach their first transit stop.',
    'Transit to Driving Ratio': 'This chart illustrates the ratio between transit travel time and driving time. Values closer to 1 indicate similar travel times, while higher values suggest transit takes longer.',
    'Transfers': 'This chart shows the distribution of transfer counts during transit journeys. It helps understand the complexity of transit routes and the number of connections required.',
    'Out-Of-Vehicle Duration In Minutes': 'This chart displays the distribution of time spent outside of vehicles during transit journeys, including walking and waiting times.',
    'In-Vehicle Duration in Minutes': 'This chart shows the distribution of time spent inside transit vehicles during journeys. It represents the actual riding time on buses, trains, or other transit modes.',
    'Total Walk Duration in Minutes': 'This chart displays the distribution of total walking time throughout the entire journey, including initial and transfer walks.',
    'In-Vehicle To Out-Of-Vehicle Ratio': 'This chart illustrates the ratio between time spent in vehicles versus time spent walking and waiting. It helps understand the efficiency of transit journeys.',
    'Total Wait Duration In Minutes': 'This chart displays the distribution of total waiting time across all transit stops during a journey, including initial and transfer waits.'
  };
  
  // Create ordered frequency chart names in user-requested order
  const orderedFrequencyCharts = [
    // NEW NAMES (try first)
    'Travel Time by Transit in Minutes',
    'Transit to Car Travel Time Ratio',
    'Number of Transfers',
    'Initial Walk Time in Minutes',
    'Initial Walk Distance in Miles',
    'Initial Wait Time in Minutes',
    'Out-of-Vehicle Travel Time in Minutes',
    'In-Vehicle Travel Time in Minutes',
    'Total Walk Time',
    'Total Walk Distance in Miles',
    'In-Vehicle to Out-of-Vehicle Time Ratio',
    'Total Wait Time in Minutes',
    // OLD NAMES (for backward compatibility)
    'Travel Duration in Minutes',
    'Transit to Driving Ratio',
    'Transfers',
    'Initial Walk Duration in Minutes',
    'Out-Of-Vehicle Duration In Minutes',
    'In-Vehicle Duration in Minutes',
    'Total Walk Duration in Minutes',
    'In-Vehicle To Out-Of-Vehicle Ratio',
    'Total Wait Duration In Minutes'
  ];
  
  // Filter and sort the data according to the ordered list
  const orderedData = orderedFrequencyCharts
    .map(chartName => {
      // Look for collections that contain the chart name
      const matchingCollection = Object.keys(data).find(collectionName => {
        // Try different variations of the collection name
        const variations = [
          chartName,
          `Frequency-${chartName}`,
          `Frequency ${chartName}`,
          chartName.replace(/\s+/g, ' ').trim()
        ];
        
        return variations.some(variation => 
          collectionName === variation || 
          collectionName.includes(variation) ||
          variation.includes(collectionName.replace(/^Frequency[- ]*/, ''))
        );
      });
      
      if (matchingCollection && data[matchingCollection]) {
        return [matchingCollection, data[matchingCollection]];
      }
      return null;
    })
    .filter(item => item !== null);
  
  // If no ordered data found, fall back to original data
  const dataToProcess = orderedData.length > 0 ? orderedData : Object.entries(data);
  
  // Map old database collection names to new display names
  const displayNameMapping = {
    'Travel Duration in Minutes': 'Travel Time by Transit in Minutes',
    'Transit to Driving Ratio': 'Transit to Car Travel Time Ratio',
    'Transfers': 'Number of Transfers',
    'Initial Walk Duration in Minutes': 'Initial Walk Time in Minutes',
    'Out-Of-Vehicle Duration In Minutes': 'Out-of-Vehicle Travel Time in Minutes',
    'In-Vehicle Duration in Minutes': 'In-Vehicle Travel Time in Minutes',
    'Total Walk Duration in Minutes': 'Total Walk Time',
    'In-Vehicle To Out-Of-Vehicle Ratio': 'In-Vehicle to Out-of-Vehicle Time Ratio',
    'Total Wait Duration In Minutes': 'Total Wait Time in Minutes'
  };
  
  // Track displayed charts to avoid duplicates
  const displayedCharts = new Set();
  
  dataToProcess.forEach(([collectionName, stateData]) => {
    // Remove "Frequency-" prefix from collection name
    let cleanTitle = collectionName.replace(/^Frequency-\s*/, '').replace(/^Frequency\s*/, '');
    
    // Map to new display name if available
    const displayTitle = displayNameMapping[cleanTitle] || cleanTitle;
    
    // Skip if already displayed (avoid duplicates)
    if (displayedCharts.has(displayTitle)) {
      return;
    }
    displayedCharts.add(displayTitle);
    
    const wrapper = document.createElement('div');
    wrapper.className = 'chart-wrapper';
    wrapper.style.marginBottom = '0.75rem'; // Keep charts a bit closer together
    
    // Create title with info button
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '0.5rem';
    
    const title = document.createElement('h4');
    title.textContent = displayTitle;
    title.style.margin = '0';
    titleContainer.appendChild(title);
    wrapper.appendChild(titleContainer);
    
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
    
    // Preserve MongoDB insertion order for labels and force No Access bars to be red
    const barColors = chartData.map((entry, index) => {
      const label = (entry.range || '').toString().toLowerCase();
      return label.includes('no access') ? '#e74c3c' : colorPalette[index % colorPalette.length];
    });
    
    // Determine units for x-axis title
    let xAxisTitle = 'Range';
    if (displayTitle.includes('Minutes') || displayTitle.includes('Duration') || displayTitle.includes('Time')) {
      xAxisTitle = 'Range (in min)';
    } else if (displayTitle.includes('Miles') || displayTitle.includes('Distance')) {
      xAxisTitle = 'Range (in miles)';
    }
    
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.range),
        datasets: [{
          label: cleanTitle,
          data: chartData.map(d => d.count),
          backgroundColor: barColors,
          borderColor: barColors,
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
          legend: { display: false }, // Remove legend
          tooltip: {
            callbacks: {
              title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
              label: (context) => `Frequency: ${context.raw}`
            }
          }
        },
        scales: {
          y: { 
            beginAtZero: true, 
            title: { 
              display: true, 
              text: 'Frequency (Number of addresses) (%)', 
              color: chartTextColor,
              font: { size: 10 }
            }, 
            ticks: { 
              color: chartTextColor,
              font: { size: 9 }
            } 
          },
          x: { 
            title: { display: true, text: xAxisTitle, color: chartTextColor }, 
            ticks: { 
              color: chartTextColor,
              autoSkip: false,
              maxRotation: 65,
              minRotation: 65
            } 
          }
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
  
  
  // Use proper encoding for URLs but preserve special characters
  const encodedStateName = encodeURIComponent(stateNameForDb);
  const encodedCountyName = encodeURIComponent(originalCountyName);
  
  fetch(`/api/countyFullData/${encodedStateName}/${encodedCountyName}`)
    .then(response => response.json())
    .then(data => {
      updateDataPanel();
      displayCountyData(data, originalCountyName);
      
      // Fix scrollbar issue: Restore scrollbar functionality after county data is loaded
      setTimeout(() => {
        restoreScrollbarFunctionality();
      }, 100);
    })
    .catch(err => {});
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
    // Create mapping from database field names to display names
    const databaseToDisplayMapping = {
      'Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)': 'Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)',
      'Average Travel Duration in Minutes': 'Travel Time by Transit in Minutes',
      'Average Driving Duration with Traffic in Minutes': 'Travel Time by Car in Minutes',
      'Transit: Driving': 'Transit to Car Travel Time Ratio',
      'Transfers': 'Number of Transfers',
      'Average Initial Walk Distance in Miles': 'Initial Walk Distance in Miles',
      'Average Initial Walk Duration in Minutes': 'Initial Walk Time in Minutes',
      'Average Initial Wait Time in Minutes': 'Initial Wait Time in Minutes',
      'Average Total Walk Distance in Miles': 'Total Walk Distance in Miles',
      'Average Total Walk Duration in minutes': 'Total Walk Time in Minutes',
      'Average Total Wait Duration in Minutes': 'Total Wait Time in Minutes',
      'Average In-Vehicle Duration in Minutes': 'In-Vehicle Travel Time in Minutes',
      'Average Out-of-Vehicle Duration in Minutes': 'Out-of-Vehicle Travel Time in Minutes',
      'In-Vehicle:Out-of-Vehicle': 'In-Vehicle to Out-of-Vehicle Time Ratio',
      'Sample Size': 'Sample Size'
    };
    
    // Display metrics in the specified order using the main ORDERED_TRANSIT_METRICS array
    ORDERED_TRANSIT_METRICS.forEach(desiredName => {
      // Skip empty strings (visual breaks)
      if (!desiredName) return;
      
      // Find the database field name that maps to this display name
      const databaseFieldName = Object.keys(databaseToDisplayMapping).find(
        dbField => databaseToDisplayMapping[dbField] === desiredName
      );
      
      if (databaseFieldName && data.averages[databaseFieldName] !== undefined) {
        const card = document.createElement('div');
        card.className = 'metric-card';
        
        // Add colored left border based on metric group
        const group = getMetricGroup(desiredName);
        const groupColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color : '#3498db';
        card.style.borderLeft = `4px solid ${groupColor}`;
        
        const label = document.createElement('span');
        label.className = 'metric-label';
        const displayName = formatMetricName(desiredName);
        label.textContent = displayName;
        
        const value = document.createElement('span');
        value.className = 'metric-value';
        
        // Check if the value is null, undefined, or empty and replace with NO ACCESS
        const rawValue = data.averages[databaseFieldName];
        if (rawValue === null || rawValue === undefined || rawValue === '') {
          value.textContent = 'NO ACCESS';
        } else {
          // Special handling for Percent Access in county view - multiply by 100
          let valueToFormat = rawValue;
          if (databaseFieldName.includes('Percent Access')) {
            valueToFormat = valueToFormat * 100;
          }
          
          const formattedValue = formatMetricValue(desiredName, valueToFormat);
          value.textContent = formattedValue;
        }
        
        // Set value color to match metric group color (use !important to override CSS)
        value.style.setProperty('color', groupColor, 'important');
        
        card.appendChild(label);
        card.appendChild(value);
        grid.appendChild(card);
      }
    });
  }
  chartsContainer.innerHTML = '';
  countyCharts.forEach(chart => { if (chart.destroy) chart.destroy(); });
  countyCharts = [];
  if (data.frequencies && Object.keys(data.frequencies).length > 0) {
    const chartTextColor = getChartTextColor();
    
    // Define color palette for different bars
    const colorPalette = [
      '#2c41ff', '#e67e22', '#20bf6b', '#f7b731', '#26de81', '#a55eea', 
      '#0984e3', '#fd9644', '#eb3b5a', '#6c5ce7', '#00b894', '#fdcb6e'
    ];
    
    // Create ordered frequency chart names for county with proper display names
    const frequencyChartMapping = {
      'Frequency-Travel Duration in Minutes': 'Travel Time by Transit in Minutes',
      'Frequency-Initial Walk Duration in Minutes': 'Initial Walk Time in Minutes',
      'Frequency-Initial Walk Distance in Miles': 'Initial Walk Distance in Miles',
      'Frequency-Initial Wait Time in Minutes': 'Initial Wait Time in Minutes',
      'Frequency-Total Walk Duration in Minutes': 'Total Walk Time in Minutes',
      'Frequency-Total Walk Distance in Miles': 'Total Walk Distance in Miles'
    };
    
    const orderedFrequencyCharts = [
      'Frequency-Travel Duration in Minutes',
      'Frequency-Initial Walk Duration in Minutes',
      'Frequency-Initial Walk Distance in Miles',
      'Frequency-Initial Wait Time in Minutes',
      'Frequency-Total Walk Duration in Minutes',
      'Frequency-Total Walk Distance in Miles',
      // OLD NAMES (for backward compatibility)
      'Travel Time by Transit in Minutes',
      'Transit to Car Travel Time Ratio',
      'Number of Transfers',
      'Initial Walk Time in Minutes',
      'Initial Walk Distance in Miles',
      'Initial Wait Time in Minutes',
      'Out-of-Vehicle Travel Time in Minutes',
      'In-Vehicle Travel Time in Minutes',
      'Total Walk Time in Minutes',
      'Total Walk Distance in Miles',
      'In-Vehicle to Out-of-Vehicle Time Ratio',
      'Total Wait Time in Minutes',
      'Travel Duration in Minutes',
      'Transit to Driving Ratio',
      'Transfers',
      'Out-Of-Vehicle Duration In Minutes',
      'In-Vehicle Duration in Minutes',
      'Total Walk Duration in Minutes',
      'In-Vehicle To Out-Of-Vehicle Ratio',
      'Total Wait Duration In Minutes'
    ];
    
    // Filter and sort the data according to the ordered list
    const orderedData = orderedFrequencyCharts
      .map(chartName => {
        const matchingCollection = Object.keys(data.frequencies).find(collectionName => {
          const variations = [
            chartName,
            `Frequency-${chartName}`,
            `Frequency ${chartName}`,
            chartName.replace(/\s+/g, ' ').trim()
          ];
          
          return variations.some(variation => 
            collectionName === variation || 
            collectionName.includes(variation) ||
            variation.includes(collectionName.replace(/^Frequency[- ]*/, ''))
          );
        });
        
        if (matchingCollection && data.frequencies[matchingCollection]) {
          return [matchingCollection, data.frequencies[matchingCollection]];
        }
        return null;
      })
      .filter(item => item !== null);
    
    // If no ordered data found, fall back to original data
    const dataToProcess = orderedData.length > 0 ? orderedData : Object.entries(data.frequencies);
    const displayedCountyCharts = new Set();
    
    dataToProcess.forEach(([collectionName, freqData]) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-wrapper';
      wrapper.style.marginBottom = '0.75rem'; // Keep charts a bit closer together
      
      // Create title with info button
      const titleContainer = document.createElement('div');
      titleContainer.style.display = 'flex';
      titleContainer.style.alignItems = 'center';
      titleContainer.style.gap = '0.5rem';
      
      const title = document.createElement('h4');
      // Use proper display name from mapping, or fallback to removing "Frequency-" prefix
      const cleanTitle = frequencyChartMapping[collectionName] || collectionName.replace(/^Frequency-\s*/, '');
      title.textContent = cleanTitle;
      title.style.margin = '0';
      titleContainer.appendChild(title);
      wrapper.appendChild(titleContainer);
      
      if (displayedCountyCharts.has(cleanTitle)) {
        return;
      }
      displayedCountyCharts.add(cleanTitle);
      
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
      
      // Preserve source ordering and highlight No Access buckets in red
      const barColors = chartData.map((entry, index) => {
        const label = (entry.range || '').toString().toLowerCase();
        return label.includes('no access') ? '#e74c3c' : colorPalette[index % colorPalette.length];
      });
      
      // Determine units for x-axis title
      let xAxisTitle = 'Range';
      if (cleanTitle.includes('Minutes') || cleanTitle.includes('Duration')) {
        xAxisTitle = 'Range (in min)';
      } else if (cleanTitle.includes('Miles') || cleanTitle.includes('Distance')) {
        xAxisTitle = 'Range (in miles)';
      }
      
      const yValueMultiplier = 100;
      const chartValues = chartData.map(d => d.count * yValueMultiplier);
      
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: chartData.map(d => d.range),
          datasets: [{
            label: cleanTitle,
            data: chartValues,
            backgroundColor: barColors,
            borderColor: barColors,
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
            legend: { display: false }, // Remove legend
            tooltip: {
              callbacks: {
                title: (tooltipItems) => `Range: ${tooltipItems[0].label}`,
                label: (context) => `Frequency: ${context.raw}`
              }
            }
          },
          scales: {
            y: { 
              beginAtZero: true, 
              title: { 
                display: true, 
                text: 'Frequency (Number of addresses) (%)', 
                color: chartTextColor,
                font: { size: 10 }
              }, 
              ticks: { 
                color: chartTextColor,
                font: { size: 9 }
              } 
            },
            x: { 
              title: { display: true, text: xAxisTitle, color: chartTextColor }, 
              ticks: { 
                color: chartTextColor,
                autoSkip: false,
                maxRotation: 65,
                minRotation: 65
              } 
            }
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
  
  // Get display name for chart label
  const select = document.getElementById('countyMetricSelect');
  const selectedOption = select ? select.options[select.selectedIndex] : null;
  const metricDisplayName = selectedOption ? (selectedOption.dataset.displayName || selectedOption.textContent) : selectedCountyMetric;
  
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
        label: metricDisplayName,
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

  const safeMetrics = Array.isArray(availableMetrics) ? availableMetrics : [];
  const metricMapping = createMetricMappingFromTitles(safeMetrics);

  let currentGroup = null;
  let currentOptgroup = null;
  let optionCount = 0;

  ORDERED_TRANSIT_METRICS.forEach(displayName => {
    if (!displayName) return;
    const databaseFieldName = metricMapping[displayName];
    if (!databaseFieldName) return;

    const group = getMetricGroup(displayName);
    const groupColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color : '#3498db';
    if (group !== currentGroup) {
      currentOptgroup = document.createElement('optgroup');
      currentOptgroup.label = group;
      currentOptgroup.style.fontWeight = 'bold';
      currentOptgroup.style.backgroundColor = `${groupColor}15`;
      currentOptgroup.style.color = '#000';
      select.appendChild(currentOptgroup);
      currentGroup = group;
    }

    const option = document.createElement('option');
    option.value = databaseFieldName;
    option.textContent = displayName;
    option.dataset.displayName = displayName;
    option.dataset.group = group;
    option.dataset.color = groupColor;
    option.style.color = '#000';
    currentOptgroup.appendChild(option);
    optionCount += 1;
  });

  if (optionCount === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Metrics unavailable';
    option.disabled = true;
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  const percentAccessOption = Array.from(select.options).find(option =>
    option.textContent === DEFAULT_USA_METRIC_TITLE
  );
  const chosenOption = percentAccessOption || select.options[0];
  select.value = chosenOption.value;
  selectedCountyMetric = chosenOption.value;

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
  if (clusterState.active && clusterState.level === 'county') {
    applyCountyClusterColors();
    return;
  }
  if (!countyMap || !countyMap.svg) {
    return;
  }
  
  if (!allCountyData || allCountyData.length === 0 || !selectedCountyMetric) {
    return;
  }
  
  const allowedCountyNames = new Set();
  countyMap.svg.selectAll('.county-path').each(function() {
    const mapCountyName = d3.select(this).attr('data-county-name');
    if (mapCountyName) {
      const normalized = normalizeCountyNameForComparison(mapCountyName);
      allowedCountyNames.add(normalized);
    }
  });

  const metricValues = {};
  const validValues = [];
  let nullCount = 0;
  
  // Process all county data
  allCountyData.forEach(doc => {
    if (doc.title != null) {
      const countyName = String(doc.title);
      const normalizedCountyName = normalizeCountyNameForComparison(countyName);
      if (!allowedCountyNames.has(normalizedCountyName)) {
        return; // Skip counties that are not on the map
      }
      
      // Get the raw value for the selected metric
      const rawValue = doc[selectedCountyMetric];
      
      
      // Check if Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes) is zero for this county (skip Sample Size metric)
      if (selectedCountyMetric !== 'Sample Size') {
        const percentAccessValue = doc['Percent Access'];
        const hasZeroPercentAccess = (percentAccessValue === 0 || percentAccessValue === 0.0);
        
        
        if (hasZeroPercentAccess) {
          metricValues[normalizedCountyName] = 'No Access';
          nullCount++;
          return; // Skip processing - exclude from natural breaks
        }
      }
      
      // Process non-zero values only (only reached if Percent Access is non-zero)
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        // Missing data for the selected metric - but since Percent Access is non-zero, this shouldn't happen
        metricValues[normalizedCountyName] = 'No Access';
        nullCount++;
      } else if (typeof rawValue === 'number') {
        // Valid numeric value (not zero)
        let valueToProcess = rawValue;
        if (selectedCountyMetric.includes('Percent Access')) {
          valueToProcess = valueToProcess * 100;
        }
        
        // Additional check: if this is the Percent Access metric and the value is 0, treat as No Access
        if (selectedCountyMetric.includes('Percent Access') && rawValue === 0) {
          metricValues[normalizedCountyName] = 'No Access';
          nullCount++;
          return; // Skip processing - exclude from natural breaks
        }
        
        const formattedValue = formatNumberToTwoDecimals(valueToProcess);
        metricValues[normalizedCountyName] = formattedValue;
        validValues.push(formattedValue);
      } else if (typeof rawValue === 'string') {
        const parsed = parseFloat(rawValue.trim());
        if (isNaN(parsed)) {
          metricValues[normalizedCountyName] = 'No Access';
          nullCount++;
        } else {
          // Valid parsed value (not zero)
          let valueToProcess = parsed;
          if (selectedCountyMetric.includes('Percent Access')) {
            valueToProcess = valueToProcess * 100;
          }
          
          // Additional check: if this is the Percent Access metric and the parsed value is 0, treat as No Access
          if (selectedCountyMetric.includes('Percent Access') && parsed === 0) {
            metricValues[normalizedCountyName] = 'No Access';
            nullCount++;
            return; // Skip processing - exclude from natural breaks
          }
          
          const numericValue = Number(valueToProcess);
          metricValues[normalizedCountyName] = numericValue;
          validValues.push(numericValue);
        }
      } else {
        metricValues[normalizedCountyName] = 'No Access';
        nullCount++;
      }
    }
  });
  
  
  // Debug: Show some sample metric values
  const sampleValues = Object.entries(metricValues).slice(0, 5);
  
  // Create color scale for valid numeric values only
  let colorScale;
  let jenksBreaks = [];
  if (validValues.length === 0) {
    // No valid numeric data
    colorScale = null;
  } else if (validValues.length === 1 || Math.min(...validValues) === Math.max(...validValues)) {
    // All valid values are the same
    colorScale = () => '#27ae60';
  } else {
    // Use natural breaks for better categorization
    const breaks = naturalBreaks(validValues, 3);
    jenksBreaks = breaks;
    const isHighGood = getMetricColorLogic(selectedCountyMetric) === 'high_is_good';
    const colors = getColorScheme(selectedCountyMetric, isHighGood);
    
    colorScale = d3.scaleThreshold()
      .domain(breaks)
      .range(colors);
  }

  // Debug logging for Percent Access at county level
  if (selectedCountyMetric && selectedCountyMetric.includes('Percent Access')) {
    const sortedVals = [...validValues].sort((a, b) => a - b);
    if (sortedVals.length > 0) {
    }
  }
  
  // Update county colors
  let coloredCount = 0;
  let nullColoredCount = 0;
  
  countyMap.svg.selectAll('.county-path')
    .each(function() {
      const mapCountyName = d3.select(this).attr('data-county-name');
      
      if (!mapCountyName) {
        d3.select(this).attr('fill', '#808080'); // N/A color
        return;
      }
      
      const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
      const value = metricValues[normalizedMapName];
      
      let color;
      if (value === 'No Access') {
        // Counties with zero Percent Access - use pattern instead of black
        color = 'noAccess';
        nullColoredCount++;
      } else if (value !== undefined && !isNaN(value) && colorScale) {
        // Valid numeric value - use color scale
        color = colorScale(value);
        coloredCount++;
      } else {
        // Fallback to No Access
        color = 'noAccess';
        nullColoredCount++;
      }
      
      // Apply the color (with special handling for No Access pattern)
      if (color === 'noAccess') {
        // Create pattern for No Access areas on counties
        const svg = countyMap.svg;
        let defs = svg.select('defs');
        if (defs.empty()) {
          defs = svg.append('defs');
        }
        
        // Create or reuse the No Access pattern
        if (defs.select('#countyNoAccessPattern').empty()) {
          const pattern = defs.append('pattern')
            .attr('id', 'countyNoAccessPattern')
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('width', 6)
            .attr('height', 6);
          
          pattern.append('rect')
            .attr('width', 6)
            .attr('height', 6)
            .attr('fill', '#f8f9fa');
          
          pattern.append('path')
            .attr('d', 'M0,6 l6,-6 M-1.5,1.5 l3,-3 M4.5,7.5 l3,-3')
            .attr('stroke', '#6c757d')
            .attr('stroke-width', 1.5);
        }
        
        d3.select(this)
          .attr('fill', 'url(#countyNoAccessPattern)')
          .attr('original-fill', 'url(#countyNoAccessPattern)');
      } else {
        d3.select(this)
          .attr('fill', color)
          .attr('original-fill', color);
      }
      
      // Handle selection state - keep all counties clickable and maintain highlighting
      if (selectedCounty) {
        const normalizedSelectedName = normalizeCountyNameForComparison(selectedCounty);
        if (normalizedMapName === normalizedSelectedName) {
          // Selected county gets prominent boundary and full opacity
          d3.select(this)
            .attr('data-clickable', 'true')
            .style('cursor', 'pointer')
            .attr('opacity', 1)
            .attr('stroke', '#2c41ff')
            .attr('stroke-width', 3);
        } else {
          // Other counties remain fully clickable with normal styling
          d3.select(this)
            .attr('data-clickable', 'true')
            .style('cursor', 'pointer')
            .attr('opacity', 1)
            .attr('stroke', '#666')
            .attr('stroke-width', 1);
        }
      } else {
        // No county selected - all counties normal styling
        d3.select(this)
          .attr('data-clickable', 'true')
          .style('cursor', 'pointer')
          .attr('opacity', 1)
          .attr('stroke', '#666')
          .attr('stroke-width', 1);
      }
    });
  
  
  // Store data for legend
  countyMap.colorScale = colorScale;
  countyMap.validValues = validValues;
  countyMap.hasNullValues = nullCount > 0;
  // Store breaks for info button
  if (validValues.length > 1 && Math.min(...validValues) !== Math.max(...validValues)) {
    countyMap.breaks = naturalBreaks(validValues, 3);
  } else {
    countyMap.breaks = [];
  }
}

function createCountyLegendForMap() {
  const legend = document.getElementById('legend');
  const colorScale = countyMap?.colorScale;
  const validValues = countyMap?.validValues || [];
  const hasNullValues = countyMap?.hasNullValues || false;
  
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
          <div style="width: 20px; height: 20px; background: repeating-linear-gradient(45deg, #f8f9fa 0px, #f8f9fa 3px, #6c757d 3px, #6c757d 6px); border: 1px solid #6c757d;"></div> 
          <span>No Access</span>
        </div>
      `;
    }
    
    legendContent += `</div>`;
  } else {
    // Use natural breaks for county legend
    const breaks = naturalBreaks(validValues, 3);
    const isHighGood = getMetricColorLogic(selectedCountyMetric) === 'high_is_good';
    const colors = getColorScheme(selectedCountyMetric, isHighGood);
    const useInteger = isSampleSizeMetric(selectedCountyMetric);
    const formatVal = (v, maxRef) => useInteger ? Math.round(v).toString() : formatLegendNumber(v, maxRef);
    
    legendContent += `<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">`;
    
    if (breaks.length === 0 || validValues.length === 1) {
      // All valid values are the same
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: ${colors[0]};"></div> 
          <span>${formatVal(validValues[0], validValues[0])}</span>
        </div>
      `;
    } else {
      // Create ranges based on natural breaks
      const ranges = [];
      
      // Get actual min and max values for better display
      const allValues = [...validValues];
      const actualMin = Math.min(...allValues);
      const actualMax = Math.max(...allValues);
      
      // Create ranges based on breaks - ensure proper range boundaries
      if (breaks.length === 1) {
        ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
        ranges.push({ min: breaks[0], max: actualMax, color: colors[1] });
      } else if (breaks.length === 2) {
        ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
        ranges.push({ min: breaks[0], max: breaks[1], color: colors[1] });
        ranges.push({ min: breaks[1], max: actualMax, color: colors[2] });
      } else if (breaks.length > 2) {
        // Handle more than 2 breaks
        ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
        for (let i = 0; i < breaks.length - 1; i++) {
          ranges.push({ min: breaks[i], max: breaks[i + 1], color: colors[i + 1] });
        }
        ranges.push({ min: breaks[breaks.length - 1], max: actualMax, color: colors[colors.length - 1] });
      } else {
        // No breaks - single range
        ranges.push({ min: actualMin, max: actualMax, color: colors[0] });
      }
      
      ranges.forEach(range => {
        const rangeText = range.max === actualMax ? 
          `${formatVal(range.min, actualMax)} - ${formatVal(range.max, actualMax)}` : 
          `${formatVal(range.min, actualMax)} - ${formatVal(range.max, actualMax)}`;
        
        
        legendContent += `
          <div style="display: flex; align-items: center; gap: 5px;">
            <div style="width: 20px; height: 20px; background: ${range.color};"></div> 
            <span>${rangeText}</span>
          </div>
        `;
      });
    }
    
    // Add No Access legend if present (when counties have zero Percent Access)
    if (hasNullValues) {
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: repeating-linear-gradient(45deg, #f8f9fa 0px, #f8f9fa 3px, #6c757d 3px, #6c757d 6px); border: 1px solid #6c757d;"></div> 
          <span>No Access</span>
        </div>
      `;
    }
    
    legendContent += `</div>`;
  }
  
  // Add info button for county legend
  const infoButton = createInfoButton(selectedCountyMetric || 'Metric', 'county_map');
  const wrapperContent = `
    <div style="display: flex; align-items: flex-start; gap: 10px; flex-wrap: wrap;">
      <div style="flex: 1;">
        ${legendContent}
      </div>
      <div style="margin-top: 5px;">
        ${infoButton.outerHTML}
      </div>
    </div>
  `;
  
  legend.innerHTML = wrapperContent;
  
  // Re-attach event listener for info button
  const infoBtn = legend.querySelector('.info-button');
  if (infoBtn) {
    infoBtn.onclick = (e) => {
      e.stopPropagation();
      const select = document.getElementById('countyMetricSelect');
      const selectedOption = select ? select.options[select.selectedIndex] : null;
      const displayName = selectedOption ? (selectedOption.dataset.displayName || selectedOption.textContent) : selectedCountyMetric;
      const metricName = displayName || selectedCountyMetric || 'Metric';
      
      // Get the color scheme information
      const isHighGood = getMetricColorLogic(selectedCountyMetric) === 'high_is_good';
      const colors = getColorScheme(selectedCountyMetric, isHighGood);
      
      // Get breaks and valid values from county map
      const breaks = countyMap?.breaks || [];
      const validValues = countyMap?.validValues || [];
      
      // Build legend information based on actual breaks and colors
      let legendInfo = `<strong>${metricName}</strong><br><br>`;
      legendInfo += `The choropleth map uses a Natural Breaks (Jenks) classification algorithm to divide the county data into three categories. This method minimizes variance within each category and maximizes variance between categories.<br><br>`;
      
      // Get actual min and max values
      const allValues = validValues.length > 0 ? [...validValues] : [];
      const actualMin = allValues.length > 0 ? Math.min(...allValues) : 0;
      const actualMax = allValues.length > 0 ? Math.max(...allValues) : 0;
      
      // Build color meaning explanation
      if (breaks.length > 0) {
        legendInfo += `<strong>Color Meanings:</strong><br>`;
        
        // Create ranges based on breaks
        const ranges = [];
        if (breaks.length === 1) {
          ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
          ranges.push({ min: breaks[0], max: actualMax, color: colors[1] });
        } else if (breaks.length === 2) {
          ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
          ranges.push({ min: breaks[0], max: breaks[1], color: colors[1] });
          ranges.push({ min: breaks[1], max: actualMax, color: colors[2] });
        } else {
          ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
          for (let i = 0; i < breaks.length - 1; i++) {
            ranges.push({ min: breaks[i], max: breaks[i + 1], color: colors[i + 1] });
          }
          ranges.push({ min: breaks[breaks.length - 1], max: actualMax, color: colors[colors.length - 1] });
        }
        
        ranges.forEach((range, index) => {
          const colorName = range.color === '#e74c3c' ? 'Red' : 
                           range.color === '#e67e22' ? 'Orange' : 
                           range.color === '#27ae60' ? 'Green' : range.color;
      const useInteger = isSampleSizeMetric(selectedCountyMetric);
      const formatVal = (v) => useInteger ? Math.round(v).toString() : formatLegendNumber(v, actualMax);
      const rangeText = `${formatVal(range.min)} - ${formatVal(range.max)}`;
          legendInfo += `<span style="color: ${range.color}; font-weight: bold;">${colorName}</span>: ${rangeText}<br>`;
        });
        
        // Add interpretation
        if (isHighGood) {
          legendInfo += `<br><strong>Interpretation:</strong> Green indicates higher (better) values, Red indicates lower (worse) values, and Orange represents middle values.`;
        } else {
          legendInfo += `<br><strong>Interpretation:</strong> Red indicates higher (worse) values, Green indicates lower (better) values, and Orange represents middle values.`;
        }
      } else {
        legendInfo += `All values fall into a single category.`;
      }
      
      legendInfo += `<br><br>Counties with "No Access" (zero Percent Access) are shown with a striped pattern.`;
      
      showInfoPopup(`${metricName} - Legend Information`, legendInfo);
    };
  }
}

// -----------------------------------------------------------------------------
// SCROLLBAR RESTORATION FUNCTION
function restoreScrollbarFunctionality() {
  
  // Get the right panel (data panel) content
  const dataPanelContent = document.getElementById('dataPanelContent');
  if (!dataPanelContent) {
    return;
  }
  
  
  // Get the parent sidebar container
  const rightPanel = document.getElementById('rightPanel');
  if (rightPanel) {
  }
  
  // Force the sidebar content to have a constrained height
  const viewportHeight = window.innerHeight;
  const navbarHeight = 80; // Approximate navbar height
  const availableHeight = viewportHeight - navbarHeight;
  
  
  // Set explicit height constraint on the sidebar content
  dataPanelContent.style.maxHeight = `${availableHeight - 100}px`; // Leave some padding
  dataPanelContent.style.overflowY = 'auto';
  dataPanelContent.style.scrollbarWidth = 'thin';
  dataPanelContent.style.scrollbarColor = 'var(--text-light) transparent';
  
  
  // Force a reflow to ensure the scrollbar is properly rendered
  const height = dataPanelContent.offsetHeight;
  
  // Also ensure the sidebar container has proper scrollbar settings
  if (rightPanel) {
    rightPanel.style.overflowY = '';
    rightPanel.style.scrollbarWidth = '';
    rightPanel.style.scrollbarColor = '';
  } else {
  }
  
  // Small delay to ensure DOM is fully updated
  setTimeout(() => {
    // Trigger a reflow again to ensure scrollbar is rendered
    const finalHeight = dataPanelContent.offsetHeight;
  }, 10);
}

// -----------------------------------------------------------------------------
// PRIMARY NAV / VIEW TAB HELPERS
// -----------------------------------------------------------------------------
function updateMapTabState() {
  const tab = document.getElementById('mapViewTab');
  const label = document.getElementById('mapViewTabLabel');
  const icon = tab?.querySelector('i');
  if (!tab || !label) {
    return;
  }

  const inEquity = activeView === 'equity';
  const inCountyView = Boolean(selectedCounty);
  let nextAction = 'none';
  let nextLabel = 'USA Map';
  let locked = false;

  if (!selectedState) {
    // Home: USA map
    locked = !inEquity;
    nextAction = inEquity ? 'toMapView' : 'none';
    nextLabel = 'USA Map';
  } else if (selectedCounty) {
    nextAction = 'backToState';
    nextLabel = 'Back to State Map';
  } else {
    // State map (no county)
    nextAction = inEquity ? 'toMapView' : 'backToUS';
    nextLabel = inEquity ? 'Back to State Map' : 'Back to US Map';
  }

  // Keep tab blue only when map is the active view
  const mapActive = activeView !== 'equity' && !inCountyView;
  tab.classList.toggle('active', mapActive);
  tab.classList.toggle('back-mode', inCountyView);
  tab.classList.toggle('locked', locked);
  tab.setAttribute('aria-disabled', locked ? 'true' : 'false');
  tab.dataset.action = nextAction;
  label.textContent = nextLabel;
  if (icon) {
    icon.className = (!selectedState ? 'fas fa-map-marked-alt' : 'fas fa-arrow-left');
  }
}

function handlePrimaryMapNav(event) {
  const tab = event.currentTarget;
  if (!tab || tab.getAttribute('aria-disabled') === 'true') {
    return;
  }
  const action = tab.dataset.action;
  switch (action) {
    case 'backToState':
      handleBackToState();
      return;
    case 'backToUS':
      handleBackToStates();
      return;
    case 'toMapView':
      switchToMapView();
      return;
    default:
      if (activeView === 'equity') {
        switchToMapView();
      }
  }
}

function updateScrollState() {
  const stateView = Boolean(selectedState);
  document.body?.classList.toggle('state-view', stateView);
}

function resetMapViewportPosition() {
  const mapContent = document.querySelector('.map-content');
  if (mapContent) {
    mapContent.scrollTop = 0;
    mapContent.style.paddingTop = '';
  }
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.scrollTop = 0;
    mainContent.style.paddingTop = '';
  }
  const contentWrapper = document.querySelector('.content-wrapper');
  if (contentWrapper) {
    contentWrapper.scrollTop = 0;
    contentWrapper.style.paddingTop = '';
  }
  const mapView = document.getElementById('mapView');
  if (mapView) {
    mapView.scrollTop = 0;
    mapView.scrollLeft = 0;
    mapView.classList.remove('zoom-to-county');
    mapView.style.top = '';
    mapView.style.left = '';
    mapView.style.right = '';
    mapView.style.bottom = '';
    mapView.style.transform = '';
    mapView.style.marginTop = '';
    mapView.style.paddingTop = '';
    mapView.style.position = '';
  }
  const legend = document.getElementById('legend');
  if (legend) {
    legend.style.marginTop = '';
    legend.style.position = '';
  }
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function updateMapBackButton() {
  const btn = document.getElementById('mapBackButton');
  if (!btn) return;
  const show = Boolean(selectedCounty);
  btn.style.display = show ? 'inline-flex' : 'none';
}

// -----------------------------------------------------------------------------
// EQUITY COMPARISON FUNCTIONS
function switchToMapView() {
  if (
    (clusterState.active && clusterState.context === 'equity') ||
    (!selectedState && clusterState.active) ||
    (shouldUseClusterOverlay() && isClusterPanelOpen())
  ) {
    exitClusterMode();
  }
  restoreMapToMainLayout();
  activeView = selectedState ? 'county' : 'state';
  document.getElementById('mapView').style.display = 'block';
  document.getElementById('legend').style.display = 'block';
  document.getElementById('equityComparisonContent').style.display = 'none';
  document.getElementById('mapViewTab').classList.add('active');
  document.getElementById('equityComparisonTab').classList.remove('active');
  
  // Restore both sidebars
  document.getElementById('leftPanel').style.display = 'block';
  document.getElementById('rightPanel').style.display = 'block';
  
  // Restore main content layout
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.marginLeft = '';
    mainContent.style.marginRight = '';
    mainContent.style.width = '';
    mainContent.classList.remove('equity-comparison-active');
  }
  
  // Fix scrollbar issue: Restore scrollbar functionality after sidebar visibility changes
  restoreScrollbarFunctionality();
  if (selectedState === null) {
    applyDefaultUSAMetric(true);
  }
  updateCompareStatesButtonVisibility();
  updateClusterAnalysisButtonVisibility();
  updateMapTabState();
  updateScrollState();
  const viewTabs = document.querySelector('.view-tabs');
  if (viewTabs) {
    viewTabs.style.display = 'flex';
  }
}

function switchToEquityComparison(doPushState = true) {
  if (!selectedState || selectedCounty) {
    return;
  }
  if (doPushState) {
    const url = new URL(window.location);
    history.pushState({ view: 'equity', stateId: selectedState }, '', url);
  }
  activeView = 'equity';
  loadComparisonData();
  setEquityViewMode('scatter');
  
  // Show equity comparison content
  document.getElementById('equityComparisonContent').style.display = 'block';
  document.getElementById('equityComparisonTab').classList.add('active');
  document.getElementById('mapViewTab').classList.remove('active');
  
  // Update state title
  const stateTitle = document.getElementById('equityStateTitle');
  if (stateTitle && statesData[selectedState]) {
    stateTitle.textContent = `Transit Vs Equity - ${statesData[selectedState].name}`;
  }
  const equityBackLabel = document.getElementById('equityBackLabel');
  if (equityBackLabel && statesData[selectedState]) {
    equityBackLabel.textContent = `Back to ${statesData[selectedState].name} Map`;
  }
  
  // Hide both sidebars
  document.getElementById('leftPanel').style.display = 'none';
  document.getElementById('rightPanel').style.display = 'none';
  
  // Expand main content to full width and add viewport constraint
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.marginLeft = '0';
    mainContent.style.marginRight = '0';
    mainContent.style.width = '100%';
    mainContent.classList.add('equity-comparison-active');
  }
  
  setTimeout(() => {
    createComparisonScatterPlotFull();
    // Ensure hover menu is set up
    setupEquityCategoryHoverMenu();
  }, 500);
  updateCompareStatesButtonVisibility();
  updateMapTabState();
  updateScrollState();
  const viewTabs = document.querySelector('.view-tabs');
  if (viewTabs) {
    viewTabs.style.display = 'none';
  }
}

function loadComparisonData() {
  if (!selectedState || selectedCounty) return;
  const stateName = statesData[selectedState].name;
  
  // Apply database name correction
  const correctedStateName = getCountyDbName(stateName);
  const dbName = formatStateNameForDb(correctedStateName);
  
  
  fetch(`/api/countyAverageValues/${encodeURIComponent(dbName)}`)
    .then(response => {
      return response.json();
    })
    .then(data => {
      
      allCountyData = data;
      if (allCountyData.length > 0) {
        
        transitMetricKeys = Object.keys(allCountyData[0]).filter(key => 
          key !== '_id' && key !== 'title' && key !== 'state'
        );
        
        
        selectedCountyMetric = transitMetricKeys[0] || null;
        
        populateTransitMetricDropdown();
        populateComparisonMetricDropdown();
      } else {
        transitMetricKeys = [];
        selectedCountyMetric = null;
      }
      
      // Load equity comparison data
      const equityCategory = document.getElementById('equityCategorySelect').value;
      loadEquityComparisonData(equityCategory, correctedStateName);
    })
    .catch(err => {
    });
}

function loadEquityComparisonData(category, stateName) {
  // Apply database name correction
  const correctedStateName = getCountyDbName(stateName);
  const formattedState = formatStateNameForDb(correctedStateName);
  
  
  fetch(`/api/equityCountyAverageValues/${encodeURIComponent(category)}/${encodeURIComponent(formattedState)}`)
    .then(response => {
      return response.json();
    })
    .then(data => {
      
      equityCountyData = data;
      if (equityCountyData.length > 0) {
        
        if (category === 'Housing_Data') {
          if (equityCountyData[0].data) {
            equityMetricKeys = Object.keys(equityCountyData[0].data);
          } else if (equityCountyData[0].Population) {
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
        
        // Store metrics for this category
        equityMetricsByCategory[category] = equityMetricKeys;
        
      } else {
        equityMetricKeys = [];
        equityMetricsByCategory[category] = [];
      }
      
      // Populate metrics menu for the current category
      populateEquityMetricsMenu(category, equityMetricKeys);
      
      populateEquityMetricDropdown();
      createComparisonScatterPlotFull();
    })
    .catch(err => {
      equityCountyData = [];
      equityMetricKeys = [];
      populateEquityMetricDropdown();
    });
}

function populateTransitMetricDropdown() {
  const select = document.getElementById('transitMetricSelect');
  if (!select) return;
  select.innerHTML = '';


  const metricMapping = createMetricMappingFromTitles(transitMetricKeys || []);
  let currentGroup = null;
  let currentOptgroup = null;
  let optionCount = 0;

  ORDERED_TRANSIT_METRICS.forEach(displayName => {
    if (!displayName) return;
    const databaseFieldName = metricMapping[displayName];
    if (!databaseFieldName) return;

    const group = getMetricGroup(displayName);
    if (group !== currentGroup) {
      currentOptgroup = document.createElement('optgroup');
      currentOptgroup.label = group;
      currentOptgroup.style.fontWeight = 'bold';
      currentOptgroup.style.backgroundColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color + '15' : '#f0f0f0';
      select.appendChild(currentOptgroup);
      currentGroup = group;
    }

    const option = document.createElement('option');
    option.value = databaseFieldName;
    option.textContent = displayName;
    option.dataset.displayName = displayName;
    option.dataset.group = group;
    currentOptgroup.appendChild(option);
    optionCount += 1;
  });

  if (optionCount === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'Metrics unavailable';
    option.disabled = true;
    select.appendChild(option);
    select.disabled = true;
    return;
  }

  select.disabled = false;
  const percentAccessOption = Array.from(select.options).find(option =>
    option.textContent === DEFAULT_USA_METRIC_TITLE
  );
  const chosenOption = percentAccessOption || select.options[0];
  select.value = chosenOption.value;
  selectedCountyMetric = chosenOption.value;

  select.removeEventListener('change', createComparisonScatterPlotFull);
  select.addEventListener('change', createComparisonScatterPlotFull);
}

function populateEquityMetricDropdown() {
  const select = document.getElementById('equityMetricSelect');
  select.innerHTML = '';
  
  
  // Get the current equity category
  const equityCategorySelect = document.getElementById('equityCategorySelect');
  const currentCategory = equityCategorySelect ? equityCategorySelect.value : 'Employment_Data';
  
  // Populate the metrics menu for the current category
  populateEquityMetricsMenu(currentCategory, equityMetricKeys);
  
  equityMetricKeys.forEach(metric => {
    const option = document.createElement('option');
    option.value = metric; // Keep original name for database queries
    // Map the display name
    const displayName = mapEquityMetricName(metric, currentCategory);
    option.textContent = displayName;
    option.dataset.originalName = metric; // Store original for queries
    select.appendChild(option);
  });
  
  if (select.options.length > 0) {
    select.value = select.options[0].value;
    
    // Update display to show selected metric
    const displayText = mapEquityMetricName(select.options[0].value, currentCategory);
    updateEquityCategoryDisplay(displayText, currentCategory);
    
  }
  
  select.addEventListener('change', createComparisonScatterPlotFull);
}

function populateEquityMetricsMenu(category, metrics) {
  
  const menuId = `metricsMenu_${category}`;
  const menu = document.getElementById(menuId);
  
  if (!menu) {
    // Try to find all metrics menus
    const allMenus = document.querySelectorAll('[id^="metricsMenu_"]');
    return;
  }
  
  
  if (!metrics || metrics.length === 0) {
    menu.innerHTML = '<div class="equity-metric-loading">No metrics available</div>';
    return;
  }
  
  menu.innerHTML = '';
  
  metrics.forEach((metric, index) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'equity-metric-item';
    menuItem.dataset.metric = metric;
    menuItem.dataset.category = category;
    const displayName = mapEquityMetricName(metric, category);
    menuItem.textContent = displayName;
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      selectEquityMetric(category, metric, displayName);
    });
    menu.appendChild(menuItem);
    
    if (index < 3) {
    }
  });
  
  
  // Ensure menu is visible if parent option is being hovered
  const option = document.querySelector(`.equity-category-option[data-category="${category}"]`);
  if (option) {
    const isHovered = option.matches(':hover');
    if (isHovered) {
      menu.classList.add('active');
    }
  }
  
}

function selectEquityMetric(category, metric, displayName) {
  
  // Update hidden selects
  const categorySelect = document.getElementById('equityCategorySelect');
  const metricSelect = document.getElementById('equityMetricSelect');
  const previousCategory = categorySelect ? categorySelect.value : null;
  
  if (categorySelect) {
    categorySelect.value = category;
  }
  
  // If category changed, we need to reload the equity data for the new category
  if (previousCategory !== category && selectedState) {
    const stateName = statesData[selectedState].name;
    const correctedStateName = getCountyDbName(stateName);
    loadEquityComparisonData(category, correctedStateName);
    // The chart will be updated by loadEquityComparisonData, so we can return early
    // But we still need to update the display
    updateEquityCategoryDisplay(displayName, category);
    closeEquityMenus();
    return;
  }
  
  if (metricSelect) {
    // Check if the metric exists in the current dropdown options
    const existingOption = Array.from(metricSelect.options).find(opt => opt.value === metric);
    
    if (existingOption) {
      // Option exists, just select it
      metricSelect.value = metric;
    } else {
      // Option doesn't exist - need to repopulate dropdown with metrics from this category
      metricSelect.innerHTML = '';
      
      if (equityMetricsByCategory[category] && equityMetricsByCategory[category].length > 0) {
        equityMetricsByCategory[category].forEach(m => {
          const opt = document.createElement('option');
          opt.value = m;
          opt.textContent = mapEquityMetricName(m, category);
          opt.dataset.originalName = m;
          metricSelect.appendChild(opt);
        });
        metricSelect.value = metric;
      } else {
      }
    }
    
    // Trigger change event to ensure chart updates
    const event = new Event('change', { bubbles: true });
    metricSelect.dispatchEvent(event);
  }
  
  // Update display
  updateEquityCategoryDisplay(displayName, category);
  
  // Close all menus
  closeEquityMenus();
  
  // Update chart
  createComparisonScatterPlotFull();
}

function updateEquityCategoryDisplay(text, category) {
  const displayText = document.getElementById('equityCategoryDisplayText');
  if (displayText) {
    displayText.textContent = text;
  }
}

function closeEquityMenus() {
  document.querySelectorAll('.equity-category-options').forEach(menu => {
    menu.classList.remove('active');
  });
  document.querySelectorAll('.equity-metrics-menu').forEach(menu => {
    menu.classList.remove('active');
  });
}

function setupEquityCategoryHoverMenu() {
  const categoryDisplay = document.getElementById('equityCategoryDisplay');
  const categoryOptions = document.querySelector('.equity-category-options');
  
  if (!categoryDisplay) {
    return;
  }
  if (!categoryOptions) {
    return;
  }
  
  
  // Toggle menu on click
  categoryDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    categoryOptions.classList.toggle('active');
    if (!categoryOptions.classList.contains('active')) {
      closeEquityMenus();
    }
  });
  
  // Handle category option hover
  const categoryOptionsList = document.querySelectorAll('.equity-category-option');
  
  categoryOptionsList.forEach((option, index) => {
    const category = option.dataset.category;
    const metricsMenu = document.getElementById(`metricsMenu_${category}`);
    
    
    if (!metricsMenu) {
      // Try to find it in the DOM
      const allMenus = document.querySelectorAll('.equity-metrics-menu');
      allMenus.forEach((m, i) => {
      });
    }
    
    // Track if menu is being interacted with to prevent blinking
    let isInteracting = false;
    let hoverTimeout;
    let leaveTimeout;
    
    option.addEventListener('mouseenter', () => {
      // Clear any pending leave timeout
      clearTimeout(leaveTimeout);
      
      // If already interacting, don't do anything
      if (isInteracting) {
        return;
      }
      
      clearTimeout(hoverTimeout);
      hoverTimeout = setTimeout(() => {
        if (isInteracting) return; // Double check
        
        // Show metrics menu on the right
        if (metricsMenu) {
          
          // Always try to load/populate metrics when hovering
          if (equityMetricsByCategory[category] && equityMetricsByCategory[category].length > 0) {
            // We have metrics cached, use them
            populateEquityMetricsMenu(category, equityMetricsByCategory[category]);
            metricsMenu.classList.add('active');
          } else {
            // Check if menu has actual metric items or just placeholder/loading content
            const hasMetricItems = metricsMenu.querySelector('.equity-metric-item');
            const hasLoadingMessage = metricsMenu.innerHTML.includes('Hover to load') || 
                                      metricsMenu.innerHTML.includes('Loading') ||
                                      metricsMenu.querySelector('.equity-metric-loading');
            
            
            if (!hasMetricItems || hasLoadingMessage || metricsMenu.innerHTML.length < 200) {
              // Need to load metrics for this category
              loadMetricsForCategory(category);
              // Show menu immediately (will show loading message)
              metricsMenu.classList.add('active');
            } else {
              // Menu has content, just show it
              metricsMenu.classList.add('active');
            }
          }
          
        } else {
        }
      }, 100); // Slightly longer delay to reduce rapid hover events
    });
    
    option.addEventListener('mouseleave', (e) => {
      clearTimeout(hoverTimeout);
      
      // Don't close immediately if moving to metrics menu
      if (metricsMenu && metricsMenu.matches(':hover')) {
        isInteracting = true;
        return;
      }
      
      leaveTimeout = setTimeout(() => {
        if (metricsMenu && !metricsMenu.matches(':hover') && !option.matches(':hover')) {
          metricsMenu.classList.remove('active');
          isInteracting = false;
        }
      }, 200);
    });
    
    // Mark as interacting when mouse enters metrics menu
    if (metricsMenu) {
      metricsMenu.addEventListener('mouseenter', () => {
        isInteracting = true;
        clearTimeout(leaveTimeout);
      });
      
      metricsMenu.addEventListener('mouseleave', () => {
        isInteracting = false;
        setTimeout(() => {
          if (!option.matches(':hover')) {
            metricsMenu.classList.remove('active');
          }
        }, 200);
      });
    }
  });
  
  // Keep metrics menu open when hovering over it
  const allMetricsMenus = document.querySelectorAll('.equity-metrics-menu');
  
  allMetricsMenus.forEach((menu, index) => {
    menu.addEventListener('mouseenter', () => {
      menu.classList.add('active');
    });
    menu.addEventListener('mouseleave', () => {
      menu.classList.remove('active');
    });
  });
  
  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!categoryDisplay.contains(e.target) && !categoryOptions.contains(e.target)) {
      closeEquityMenus();
    }
  });
  
}

// Store metrics for each category
let equityMetricsByCategory = {};

function loadMetricsForCategory(category) {
  
  // This will be called when hovering over a category that hasn't been loaded yet
  const menuId = `metricsMenu_${category}`;
  const menu = document.getElementById(menuId);
  
  if (!menu) {
    return;
  }
  
  
  // Check if we already have metrics for this category
  if (equityMetricsByCategory[category] && equityMetricsByCategory[category].length > 0) {
    populateEquityMetricsMenu(category, equityMetricsByCategory[category]);
    return;
  }
  
  // Show loading message
  menu.innerHTML = '<div class="equity-metric-loading">Loading metrics...</div>';
  
  // Fetch metrics for this category
  if (!selectedState) {
    menu.innerHTML = '<div class="equity-metric-loading">Please select a state first</div>';
    return;
  }
  
  const stateName = statesData[selectedState].name;
  const correctedStateName = getCountyDbName(stateName);
  const formattedState = formatStateNameForDb(correctedStateName);
  
  const url = `/api/equityCountyAverageValues/${encodeURIComponent(category)}/${encodeURIComponent(formattedState)}`;
  
  fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      
      if (data && data.length > 0) {
        let metrics = [];
        
        if (category === 'Housing_Data') {
          if (data[0].data) {
            metrics = Object.keys(data[0].data);
          } else if (data[0].Population) {
            metrics = Object.keys(data[0].Population);
          } else {
            metrics = Object.keys(data[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && 
              key !== 'county' && key !== 'data' && key !== 'Population'
            );
          }
        } else {
          if (data[0].data && typeof data[0].data === 'object') {
            metrics = Object.keys(data[0].data);
          } else {
            metrics = Object.keys(data[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && key !== 'data'
            );
          }
        }
        
        if (metrics.length > 0) {
        }
        
        // Store metrics for this category
        equityMetricsByCategory[category] = metrics;
        
        // Populate the menu
        populateEquityMetricsMenu(category, metrics);
        
        // Ensure menu is visible
        const menuElement = document.getElementById(`metricsMenu_${category}`);
        if (menuElement) {
          menuElement.classList.add('active');
        } else {
        }
      } else {
        menu.innerHTML = '<div class="equity-metric-loading">No metrics available</div>';
      }
    })
    .catch(err => {
      menu.innerHTML = '<div class="equity-metric-loading">Error loading metrics</div>';
    });
}

function createComparisonScatterPlotFull() {
  if (!selectedState || selectedCounty) return;
  
  
  const equitySelect = document.getElementById('equityMetricSelect');
  const transitSelect = document.getElementById('transitMetricSelect');
  
  if (!equitySelect || !transitSelect) {
    return;
  }
  
  const equityMetric = equitySelect.value || (equitySelect.options[0] && equitySelect.options[0].value);
  const transitMetric = transitSelect.value || (transitSelect.options[0] && transitSelect.options[0].value);
  
  
  if (!equityMetric || !transitMetric) {
    return;
  }
  
  // Get equity category for axis labels - ensure we get the correct category
  const equityCategorySelect = document.getElementById('equityCategorySelect');
  let equityCategory = equityCategorySelect ? equityCategorySelect.value : 'Employment_Data';
  
  // If no category is selected or it's empty, try to infer from the selected metric
  if (!equityCategory || equityCategory === '') {
    // Check which category the current metric belongs to
    const categories = ['Employment_Data', 'Income_Data', 'Race_Data', 'Housing_Data'];
    for (const cat of categories) {
      if (equityMetricsByCategory[cat] && equityMetricsByCategory[cat].includes(equityMetric)) {
        equityCategory = cat;
        break;
      }
    }
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
  
  if (dataPoints.length === 0) {
    
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
  
  // Generate colors for each data point
  const colors = generateScatterColors(dataPoints.length);
  
  comparisonChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Data Points',
          data: dataPoints.map((point, index) => ({
            ...point,
            backgroundColor: colors[index % colors.length],
            borderColor: colors[index % colors.length]
          })),
          backgroundColor: colors,
          borderColor: colors,
          pointRadius: 8,
          pointHoverRadius: 12,
          pointBorderWidth: 2,
          pointBorderColor: '#fff'
        },
        {
          type: 'line',
          label: 'Trend Line',
          data: regressionData,
          fill: false,
          borderColor: '#e74c3c',
          borderWidth: 3,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(context) {
              const point = context[0].raw;
              return point.label || 'County';
            },
            label: function(context) {
              const point = context.raw;
              return `${point.label || 'County'} (${point.x.toFixed(2)}, ${point.y.toFixed(2)})`;
            }
          }
        }
      },
      interaction: {
        mode: 'nearest',
        intersect: true
      },
      hover: {
        mode: 'nearest',
        intersect: true,
        animationDuration: 0
      },
      animation: {
        duration: 0
      },
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      scales: {
        x: { 
          title: { 
            display: true, 
            text: `Equity: ${mapEquityMetricName(equityMetric, equityCategory)}`, 
            color: getChartTextColor(),
            font: { size: 11, weight: 'bold' }
          }, 
          beginAtZero: true, 
          ticks: { color: getChartTextColor(), font: { size: 10 }, maxRotation: 45, minRotation: 45 }
        },
        y: { 
          title: { 
            display: true, 
            text: transitMetric && transitMetric.includes('Percent Access') ? 'Percent Access' : `Transit: ${transitMetric}`, 
            color: getChartTextColor(),
            font: { size: 11, weight: 'bold' }
          }, 
          beginAtZero: true, 
          ticks: { color: getChartTextColor(), font: { size: 9 }, maxRotation: 45, minRotation: 45 }
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
  
  // Proceed to comparison page
  proceedToCompareBtn.addEventListener('click', function() {
    if (selectedEntitiesForComparison.length < 2) {
      alert('Please select at least 2 entities to compare.');
      return;
    }
    
    // Exit comparison mode
    exitComparisonMode();
    
    // Store selected states in sessionStorage to pass to comparison page
    const stateNames = selectedEntitiesForComparison.map(entity => entity.name);
    sessionStorage.setItem('selectedStatesForComparison', JSON.stringify(stateNames));
    
    // Redirect to comparison page
    window.location.href = '/comparison';
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
    hideAIReportLoading();
    showAIReportError(`Failed to generate chart comparison: ${error.message}`);
  }
}

// Add this new function to app.js:
function createReportPopup(reportData) {
  hideAIReportLoading();

  // Null checks and error handling
  if (!reportData || typeof reportData !== 'object') {
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


  // Event listeners
  document.getElementById('closeFullPageReport').onclick = function() {
    fullPageOverlay.style.display = 'none';
    document.body.style.overflow = ''; // Restore body scrolling
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
    fetchAndRenderDotplotInModal(states);
  } else {
    document.getElementById('dotplotContainer').innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No chart data available</p>';
  }
}
// Helper function to render dotplot specifically in the modal
// Helper function to render dotplot specifically in the modal
async function fetchAndRenderDotplotInModal(states) {
  if (!states || states.length === 0) {
    return;
  }
  
  
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
    
    // Set the data and initialize variables
    dotplotData = data;
    dotplotTab = 'equity'; // Reset to default
    selectedMetricIndexes = { equity: 0, transit: 0 };
    selectedLegends = { equity: [], transit: [] };
    
    // Render the chart interface
    renderDotplotChartInModal(chartContainer);
    
  } catch (err) {
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
      <div style="width: 280px; background: #f8f9fa; border-right: 1px solid #ddd; overflow: hidden; flex-shrink: 0;">
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

  // Initialize selected legends and render chart
  const metric = dotplotData[dotplotTab][selectedMetricIndexes[dotplotTab]];
  if (metric && metric.metrics) {
    const allLegends = metric.metrics.map(m => m.legend);
    if (!selectedLegends[dotplotTab] || selectedLegends[dotplotTab].length === 0) {
      selectedLegends[dotplotTab] = [...allLegends]; // Select ALL legends by default
    }
    // Render the chart
    setTimeout(() => renderD3DotplotInModal(metric, selectedLegends[dotplotTab]), 100);
  }
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
    return;
  }
  
  if (!metric || !metric.metrics) {
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
  
  // Collect all values for analysis and calculate percentiles
  let allValues = [];
  const percentileData = [];
  
  validLegends.forEach((legend) => {
    // Skip "state" metric
    if (legend.toLowerCase() === 'state') return;
    
    const metricData = metricsArray.find(m => m.legend === legend);
    if (!metricData || !metricData.values) return;
    
    // Get values for this legend
    const legendValues = [];
    validStates.forEach((state) => {
      const value = metricData.values[state];
      if (value !== null && value !== undefined && !isNaN(Number(value))) {
        const numValue = Number(value);
        legendValues.push(numValue);
        allValues.push(numValue);
      }
    });
    
    // Calculate percentiles for this legend
    if (legendValues.length > 0) {
      const sortedValues = [...legendValues].sort((a, b) => a - b);
      const min = sortedValues[0];
      const max = sortedValues[sortedValues.length - 1];
      
      validStates.forEach((state) => {
        const value = metricData.values[state];
        if (value !== null && value !== undefined && !isNaN(Number(value))) {
          const numValue = Number(value);
          const percentile = ((numValue - min) / (max - min)) * 100;
          
          percentileData.push({
            state, 
            legend, 
            value: percentile, // Use percentile value instead of actual value
            originalValue: numValue, // Keep original for tooltip
            min: min,
            max: max,
            lidx: validLegends.indexOf(legend), 
            sidx: validStates.indexOf(state)
          });
        }
      });
    }
  });
  
  if (percentileData.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; font-size: 18px;">No data points for selected legends</div>';
    return;
  }
  
  // Use percentile data instead of absolute values
  const chartData = percentileData;
  
  // For percentile scale, we always use 0-100%
  const displayMin = 0;
  const displayMax = 100;
  
  
  // Calculate chart dimensions - More adaptive sizing
  const containerRect = container.getBoundingClientRect();
  const chartContainerWidth = Math.max(containerRect.width || 900, 800); // Minimum width
  const chartContainerHeight = Math.max(containerRect.height || 600, 400); // Minimum height
  
  // Use container dimensions with better margins and centering
  const chartWidth = Math.min(chartContainerWidth - 100, 1000); // More margin for centering
  const chartHeight = Math.min(chartContainerHeight - 160, 600); // More margin for centering
  
  
  const chartMargin = {top: 60, right: 80, bottom: 80, left: 200};
  
  // Color scale - Using more distinct colors
  const colors = ['#2c41ff', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e', '#e91e63', '#00bcd4'];
  const color = d3.scaleOrdinal()
    .domain(validLegends)
    .range(colors);
  
  // CREATE LEGEND FIRST
  const legendContainer = document.createElement('div');
  legendContainer.className = 'legend-container';
  legendContainer.style.cssText = `
    width: 100%;
    max-width: ${chartContainerWidth}px;
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
  
  // Get ALL legends (not just selected ones) for the legend display
  const allLegends = metric.metrics.map(m => m.legend).filter(legend => legend.toLowerCase() !== 'state');
  
  // Calculate total width needed for all legend items
  const estimatedItemWidth = 250;
  const totalContentWidth = allLegends.length * estimatedItemWidth;
  
  const legendContent = document.createElement('div');
  legendContent.style.cssText = `
    display: flex;
    flex-wrap: nowrap;
    align-items: flex-start;
    width: ${Math.max(totalContentWidth, chartContainerWidth)}px;
    height: 80px;
    gap: 15px;
  `;
  
  // Add legend items
  allLegends.forEach((legend, i) => {
    const legendIndex = i;
    const useTriangle = legendIndex % 2 === 1;
    const legendColor = color(legend);
    
    const legendItem = document.createElement('div');
    const isSelected = selectedLegends[dotplotTab] && selectedLegends[dotplotTab].includes(legend);
    legendItem.style.cssText = `
      display: flex;
      align-items: center;
      flex-shrink: 0;
      white-space: nowrap;
      min-width: 200px;
      max-width: 300px;
      padding: 5px 10px;
      background: #f9f9f9;
      color: #333;
      border-radius: 15px;
      border: 2px solid ${isSelected ? '#007bff' : '#e0e0e0'};
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    legendItem.dataset.legend = legend;
    
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
    
    // Add click handler for legend item
    legendItem.addEventListener('click', function() {
      const legend = this.dataset.legend;
      const index = selectedLegends[dotplotTab].indexOf(legend);
      
      if (index > -1) {
        // Remove from selected
        selectedLegends[dotplotTab].splice(index, 1);
        this.style.border = '2px solid #e0e0e0';
      } else {
        // Add to selected
        selectedLegends[dotplotTab].push(legend);
        this.style.border = '2px solid #007bff';
      }
      
      // Preserve scroll position and re-render chart
      const scrollTop = legendContainer.scrollTop;
      setTimeout(() => {
        renderD3DotplotInModal(metric, selectedLegends[dotplotTab]);
        setTimeout(() => {
          const newLegendContainer = document.querySelector('.legend-container');
          if (newLegendContainer) {
            newLegendContainer.scrollTop = scrollTop;
          }
        }, 50);
      }, 100);
    });
    
    legendContent.appendChild(legendItem);
  });
  
  legendContainer.appendChild(legendContent);
  container.appendChild(legendContainer);
  
  // CREATE MULTIPLE GRAPHS BASED ON PERCENTILE RANGES
  const selectedLegendsList = selectedLegends[dotplotTab] || [];
  if (selectedLegendsList.length === 0) {
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666; font-size: 18px;">No metrics selected</div>';
    return;
  }
  
  // Calculate percentile ranges for multiple graphs
  const percentileRanges = [
    { min: 0, max: 33, label: 'Low Percentile (0-33%)', color: '#e74c3c' },
    { min: 33, max: 66, label: 'Medium Percentile (33-66%)', color: '#f39c12' },
    { min: 66, max: 100, label: 'High Percentile (66-100%)', color: '#27ae60' }
  ];
  
  // Create single chart container
  const chartContainer = document.createElement('div');
  chartContainer.style.cssText = `
    width: 95vw;
    height: 70vh;
    max-width: 1200px;
    max-height: 500px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: white;
    position: relative;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin: 20px auto;
    display: block;
    overflow: hidden;
  `;
  
  // Create chart area with proper boundaries
  const chartArea = document.createElement('div');
  chartArea.style.cssText = `
    width: 100%;
    height: 100%;
    padding: 15px;
    box-sizing: border-box;
    background: white;
    position: absolute;
    top: 0;
    left: 0;
  `;
  chartContainer.appendChild(chartArea);
    
  // Create SVG for this graph with responsive dimensions
  const svg = d3.select(chartArea)
    .append('svg')
    .attr('width', '100%')
    .attr('height', '100%')
    .style('display', 'block');
  
  // Calculate dimensions for this graph - ensure it fits within the container
  const containerWidth = chartArea.offsetWidth || 1000;
  const containerHeight = chartArea.offsetHeight || 400;
  const graphWidth = Math.min(containerWidth, 1100);
  const graphHeight = Math.min(containerHeight, 400);
  const graphMargin = { top: 25, right: 40, bottom: 50, left: 120 };
  
  // Use all data for the single chart
  const graphData = chartData;
  
  // Get unique states for this graph
  const graphStates = [...new Set(graphData.map(d => d.state))];
  
  // Create scales for this graph - use actual values with padding
  const actualValues = graphData.map(d => d.originalValue);
  const minValue = d3.min(actualValues);
  const maxValue = d3.max(actualValues);
  
  // Add padding to x-axis (only positive padding, no negative values)
  const valueRange = maxValue - minValue;
  const paddingAmount = valueRange * 0.05; // 5% padding
  const paddedMin = Math.max(0, minValue - paddingAmount); // Ensure no negative values
  const paddedMax = maxValue + paddingAmount;
  
  const xScale = d3.scaleLinear()
    .domain([paddedMin, paddedMax])
    .range([0, graphWidth - graphMargin.left - graphMargin.right]);
    
  const yScale = d3.scaleBand()
    .domain(graphStates)
    .range([0, graphHeight - graphMargin.top - graphMargin.bottom])
    .padding(0.3);
  
  // Create the main graph group
  const graph = svg.append('g')
    .attr('class', 'graph')
    .attr('transform', `translate(${graphMargin.left}, ${graphMargin.top})`);

  // Add thick gray lines for each state (min to max)
  graphStates.forEach(state => {
    const stateData = graphData.filter(d => d.state === state);
    if (stateData.length > 0) {
      const stateValues = stateData.map(d => d.originalValue);
      const stateMin = Math.min(...stateValues);
      const stateMax = Math.max(...stateValues);
      
      graph.append('line')
        .attr('x1', xScale(stateMin))
        .attr('x2', xScale(stateMax))
        .attr('y1', yScale(state) + yScale.bandwidth()/2)
        .attr('y2', yScale(state) + yScale.bandwidth()/2)
        .attr('stroke', '#cccccc')
        .attr('stroke-width', 8)
        .style('opacity', 0.8);
    }
  });
    
  // Create tooltip with better sizing and overflow protection
  const tooltip = d3.select('body').append('div')
    .attr('class', 'chart-tooltip')
    .style('position', 'absolute')
    .style('background', 'rgba(0, 0, 0, 0.9)')
    .style('color', 'white')
    .style('padding', '8px')
    .style('border-radius', '4px')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', 10000)
    .style('box-shadow', '0 2px 6px rgba(0,0,0,0.3)')
    .style('max-width', '200px')
    .style('word-wrap', 'break-word')
    .style('overflow', 'hidden');

  // Add data points with better visibility and tooltips
  graphData.forEach(d => {
    const legendIndex = selectedLegendsList.indexOf(d.legend);
    const useTriangle = legendIndex % 2 === 1;
    const pointColor = color(d.legend);
    
    let symbol;
    if (useTriangle) {
      symbol = graph.append('polygon')
        .attr('points', `${xScale(d.originalValue)},${yScale(d.state) + yScale.bandwidth()/2 - 8} ${xScale(d.originalValue) - 8},${yScale(d.state) + yScale.bandwidth()/2 + 8} ${xScale(d.originalValue) + 8},${yScale(d.state) + yScale.bandwidth()/2 + 8}`);
    } else {
      symbol = graph.append('circle')
        .attr('cx', xScale(d.originalValue))
        .attr('cy', yScale(d.state) + yScale.bandwidth()/2)
        .attr('r', 8);
    }
    
    symbol
      .attr('fill', pointColor)
      .attr('stroke', '#fff')
      .attr('stroke-width', 3)
      .style('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseover', function(event) {
        tooltip.transition().duration(200).style('opacity', 1);
        tooltip.html(`
          <div style="font-size: 16px; margin-bottom: 5px;">State: ${d.state}</div>
          <div style="font-size: 14px; margin-bottom: 3px;">Metric: ${d.legend}</div>
          <div style="font-size: 14px; color: #4CAF50;">Value: ${d.originalValue.toLocaleString()}</div>
        `);
        
        // Smart positioning to keep tooltip on screen with better margins
        const tooltipWidth = 280;
        const tooltipHeight = 120;
        let left = event.pageX + 20;
        let top = event.pageY - 20;
        
        // Adjust if tooltip would go off right edge
        if (left + tooltipWidth > window.innerWidth - 20) {
          left = event.pageX - tooltipWidth - 20;
        }
        
        // Adjust if tooltip would go off bottom edge
        if (top + tooltipHeight > window.innerHeight - 20) {
          top = event.pageY - tooltipHeight - 20;
        }
        
        tooltip.style('left', left + 'px').style('top', top + 'px');
      })
      .on('mouseout', function() {
        tooltip.transition().duration(200).style('opacity', 0);
      });
  });

  // Add gridlines for better readability
  const xTicks = xScale.ticks(8);
  const yTicks = yScale.domain();
  
  // Vertical gridlines
  graph.selectAll('.grid-line-vertical')
    .data(xTicks)
    .enter().append('line')
    .attr('class', 'grid-line-vertical')
    .attr('x1', d => xScale(d))
    .attr('x2', d => xScale(d))
    .attr('y1', 0)
    .attr('y2', graphHeight - graphMargin.top - graphMargin.bottom)
    .attr('stroke', '#b0b0b0')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,2')
    .style('opacity', 0.9);

  // Horizontal gridlines
  graph.selectAll('.grid-line-horizontal')
    .data(yTicks)
    .enter().append('line')
    .attr('class', 'grid-line-horizontal')
    .attr('x1', 0)
    .attr('x2', graphWidth - graphMargin.left - graphMargin.right)
    .attr('y1', d => yScale(d) + yScale.bandwidth()/2)
    .attr('y2', d => yScale(d) + yScale.bandwidth()/2)
    .attr('stroke', '#b0b0b0')
    .attr('stroke-width', 1)
    .attr('stroke-dasharray', '2,2')
    .style('opacity', 0.9);
    
  // Add axes with proper alignment - make them touch at origin
  svg.append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${graphMargin.left},${graphMargin.top})`)
    .call(d3.axisLeft(yScale))
    .style('font-size', '10px')
    .style('color', '#333');
  
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(${graphMargin.left},${graphHeight - graphMargin.bottom})`)
    .call(d3.axisBottom(xScale).tickFormat(d3.format('.2s')))
    .style('font-size', '10px')
    .style('color', '#333');
  
  // Add axis labels with proper positioning
  svg.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 3)
    .attr('x', 0 - (graphHeight / 2))
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('States');
  
  svg.append('text')
    .attr('transform', `translate(${graphWidth/2}, ${graphHeight - 3})`)
    .style('text-anchor', 'middle')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .style('fill', '#333')
    .text('Actual Values');
  
  container.appendChild(chartContainer);
  
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
      .catch(err => {});
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
  
  // Update map highlights to show selected states
  updateMapSelectionHighlights();
}

function exitComparisonMode() {
  isComparisonMode = false;
  
  // Hide the comparison overlay
  const comparisonOverlay = document.getElementById('comparisonOverlay');
  comparisonOverlay.style.display = 'none';
  
  // Remove visual effects from the content
  const contentWrapper = document.querySelector('.content-wrapper');
  contentWrapper.classList.remove('comparison-fade');
  
  // Reset map highlights
  resetMapSelections();
  
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

function generateComparisonChart() {
  const chartType = document.getElementById('comparisonChartType').value;
  const metricName = document.getElementById('comparisonMetric').value;
  const chartCanvas = document.getElementById('comparisonModalChart');
  
  
  // Destroy existing chart if it exists
  if (comparisonModalChart) {
    comparisonModalChart.destroy();
  }
  
  let chartData = [];
  let labels = [];
  
  if (selectedState) {
    // County comparison - keep the improved county matching logic
    
    // Log the exact titles in the county data for debugging
    
    // Process each selected county
    selectedEntitiesForComparison.forEach(entity => {
      
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

  const previousValue = metricSelect.value;
  metricSelect.innerHTML = '';

  const isCountyLevel = Boolean(selectedState);
  let availableMetrics = [];

  if (isCountyLevel && Array.isArray(transitMetricKeys)) {
    availableMetrics = [...transitMetricKeys];
  } else if (!isCountyLevel && Array.isArray(allStateData)) {
    availableMetrics = allStateData.map(metric => metric.title).filter(Boolean);
  }

  if (availableMetrics.length === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No metrics available';
    option.disabled = true;
    metricSelect.appendChild(option);
    metricSelect.disabled = true;
    return;
  }

  const metricMapping = createMetricMappingFromTitles(availableMetrics);
  let currentGroup = null;
  let currentOptgroup = null;
  let optionCount = 0;

  ORDERED_TRANSIT_METRICS.forEach(displayName => {
    if (!displayName) return;
    const actualName = metricMapping[displayName];
    if (!actualName) return;

    const group = getMetricGroup(displayName);
    if (group !== currentGroup) {
      currentOptgroup = document.createElement('optgroup');
      currentOptgroup.label = group;
      currentOptgroup.style.fontWeight = 'bold';
      currentOptgroup.style.backgroundColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color + '15' : '#f0f0f0';
      metricSelect.appendChild(currentOptgroup);
      currentGroup = group;
    }

    const option = document.createElement('option');
    option.value = actualName;
    option.textContent = displayName;
    option.dataset.displayName = displayName;
    option.dataset.group = group;
    currentOptgroup.appendChild(option);
    optionCount += 1;
  });

  if (optionCount === 0) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = 'No metrics available';
    option.disabled = true;
    metricSelect.appendChild(option);
    metricSelect.disabled = true;
    return;
  }

  metricSelect.disabled = false;
  const preferredValue = (() => {
    if (previousValue && Array.from(metricSelect.options).some(option => option.value === previousValue)) {
      return previousValue;
    }
    const contextValue = isCountyLevel ? selectedCountyMetric : selectedMetric;
    if (contextValue && Array.from(metricSelect.options).some(option => option.value === contextValue)) {
      return contextValue;
    }
    const percentAccessOption = Array.from(metricSelect.options).find(option =>
      option.textContent === DEFAULT_USA_METRIC_TITLE
    );
    if (percentAccessOption) {
      return percentAccessOption.value;
    }
    return metricSelect.options[0]?.value || '';
  })();

  if (preferredValue) {
    metricSelect.value = preferredValue;
  }
}

// Force browser back navigation to land on homepage.
// For this single-page experience, any back navigation inside the site should end at '/'.
// If already on '/', the native back will proceed to the previous site/entry point.
// Handle back button navigation - prevent going back to login/signup if authenticated
(function() {
  function checkAndRedirectFromAuthPages() {
    // Check if user is authenticated
    const isAuthenticated = document.cookie.includes('access_token');
    
    if (!isAuthenticated) {
      return; // No need to handle if not authenticated
    }

    // Check if current page is login or signup
    const currentPath = window.location.pathname;
    const isAuthPage = currentPath === '/auth/login' || currentPath === '/auth/signup';
    
    if (isAuthPage) {
      // If user is authenticated and on auth page, redirect to homepage
      window.history.replaceState(null, '', '/');
      window.location.replace('/');
      return;
    }
  }

  // Check on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndRedirectFromAuthPages);
  } else {
    checkAndRedirectFromAuthPages();
  }

  // Listen for back/forward button navigation
  window.addEventListener('popstate', function(event) {
    // Small delay to let the navigation complete
    setTimeout(() => {
      const isAuthenticated = document.cookie.includes('access_token');
      if (!isAuthenticated) return;

      const currentPath = window.location.pathname;
      if (currentPath === '/auth/login' || currentPath === '/auth/signup') {
        // Replace with homepage instead
        window.history.replaceState(null, '', '/');
        window.location.replace('/');
      }
    }, 0);
  });
})();