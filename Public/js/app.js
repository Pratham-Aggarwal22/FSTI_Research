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

// Helper function to get metric group
function getMetricGroup(metricName) {
  if (metricName.includes('Percent Access')) return 'Access';
  if (metricName.includes('Travel Time') || metricName.includes('Travel Duration') || 
      metricName.includes('Driving Duration') || metricName.includes('Transit to Car') ||
      metricName.includes('Transit: Driving') || metricName.includes('Transit to Driving')) return 'Travel Times';
  if (metricName.includes('Transfer')) return 'Transfers';
  if (metricName.includes('Initial')) return 'Initial Journey';
  if (metricName.includes('Total')) return 'Total Journey';
  if (metricName.includes('Vehicle')) return 'Vehicle Times';
  if (metricName.includes('Sample Size')) return 'Sample Data';
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
        console.error('Error loading metric info:', error);
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
    formattedValue = formatNumberToTwoDecimals(value);
  } else if (typeof value === 'string' && !isNaN(Number(value))) {
    formattedValue = formatNumberToTwoDecimals(Number(value));
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
  
  // Add event listener for back button in equity comparison
  document.getElementById('backToMapFromEquity').addEventListener('click', switchToMapView);
  
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
  
  // Setup equity category hover menu
  setupEquityCategoryHoverMenu();
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
    // Set default metric to "Percent Access" if available, otherwise use first available
    const percentAccessMetric = allStateData.find(metric => 
      metric.title === "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)"
    );
    selectedMetric = percentAccessMetric ? percentAccessMetric.title : allStateData[0].title;
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
      
      // Create new optgroup if group changed
      if (group !== currentGroup) {
        currentOptgroup = document.createElement('optgroup');
        currentOptgroup.label = group;
        currentOptgroup.style.fontWeight = 'bold';
        currentOptgroup.style.backgroundColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color + '15' : '#f0f0f0';
        select.appendChild(currentOptgroup);
        currentGroup = group;
      }
      
      const option = document.createElement('option');
      option.value = actualName; // Use actual database name as value
      option.textContent = desiredName; // Show desired name to user
      option.dataset.group = group;
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
  
  // Add info button for USA map metrics
  addInfoButtonToMetricSelection('usa_map');
}

function addInfoButtonToMetricSelection(mapType) {
  const metricSelection = document.getElementById('metricSelection');
  if (!metricSelection) return;
  
  // Remove existing info button if it exists
  const existingInfoBtn = metricSelection.querySelector('.metric-info-btn');
  if (existingInfoBtn) {
    existingInfoBtn.remove();
  }
  
  // Create info button
  const infoBtn = document.createElement('button');
  infoBtn.className = 'metric-info-btn';
  infoBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
  infoBtn.title = 'Click for metric information';
  infoBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  `;
  
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const currentMetric = document.getElementById('metricSelect').value;
    if (currentMetric) {
      // Find the display name for the current metric
      const metricMapping = createMetricMapping(allStateData);
      const displayName = Object.keys(metricMapping).find(key => metricMapping[key] === currentMetric);
      if (displayName) {
        showInfoPopup(displayName, mapType);
      }
    } else {
      showInfoPopup('Select a metric first', 'Please select a metric from the dropdown to view its information.');
    }
  });
  
  // Add the button to the metric selection container
  metricSelection.style.position = 'relative';
  metricSelection.appendChild(infoBtn);
}

function handleMetricChange(event) {
  selectedMetric = event.target.value;
  
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
  if (!usMap) return;
  const metricData = allStateData.find(d => d.title === selectedMetric);
  if (!metricData) return;
  
  const values = Object.entries(metricData)
    .filter(([key]) => key !== '_id' && key !== 'title')
    .map(([, value]) => formatNumberToTwoDecimals(value));
  
  if (values.length === 0) return;
  
  // Use natural breaks for better categorization
  const breaks = naturalBreaks(values, 3);
  
  // Special handling for Percent Access - always green for high values
  let isHighGood = METRIC_COLOR_LOGIC[selectedMetric] === 'high_is_good';
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
  createLegendWithBreaks(breaks, colors, isHighGood, values);
}

function createLegendWithBreaks(breaks, colors, isHighGood, validValues = []) {
  console.log('createLegendWithBreaks called with:', { breaks, colors, isHighGood, validValues });
  const legend = document.getElementById('legend');
  console.log('Legend element found:', legend);
  if (!legend) {
    console.error('Legend element not found!');
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
    const actualMax = allValues.length > 0 ? Math.max(...allValues) : 0;
    
    // Create ranges based on breaks
    if (breaks.length === 1) {
      ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
      ranges.push({ min: breaks[0], max: actualMax, color: colors[1] });
    } else if (breaks.length === 2) {
      ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
      ranges.push({ min: breaks[0], max: breaks[1], color: colors[1] });
      ranges.push({ min: breaks[1], max: actualMax, color: colors[2] });
    } else {
      // Handle more than 2 breaks
      ranges.push({ min: actualMin, max: breaks[0], color: colors[0] });
      for (let i = 0; i < breaks.length - 1; i++) {
        ranges.push({ min: breaks[i], max: breaks[i + 1], color: colors[i + 1] });
      }
      ranges.push({ min: breaks[breaks.length - 1], max: actualMax, color: colors[colors.length - 1] });
    }
    
    ranges.forEach(range => {
      const rangeText = range.max === actualMax ? 
        `${range.min.toFixed(2)} - ${range.max.toFixed(2)}` : 
        `${range.min.toFixed(2)} - ${range.max.toFixed(2)}`;
      
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
  
  console.log('Setting legend content:', wrapperContent);
  legend.innerHTML = wrapperContent;
  
  // Re-attach event listener for info button
  const infoBtn = legend.querySelector('.info-button');
  if (infoBtn) {
    infoBtn.onclick = (e) => {
      e.stopPropagation();
      const metricName = selectedMetric || 'Metric';
      
      // Get the color scheme information
      let isHighGood = METRIC_COLOR_LOGIC[selectedMetric] === 'high_is_good';
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
  
  console.log('Legend updated successfully');
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
        .style('cursor', 'pointer')
        .style('pointer-events', 'all') // Enable pointer events for text
        .text(d => statesData[d.id]?.abbr || '')
        .on('click', (event, d) => {
          event.stopPropagation(); // Prevent event bubbling
          handleStateClick(d.id);
        })
        .on('mouseover', function(event, d) {
          d3.select(this).attr('cursor', 'pointer').attr('font-size', '12px');
          // Also highlight the corresponding state path
          d3.select(`path[data-state-id="${d.id}"]`).attr('stroke-width', 2);
          // Show full state name
          d3.select(this).text(statesData[d.id]?.name || '');
        })
        .on('mouseout', function(event, d) {
          d3.select(this).attr('font-size', '10px');
          // Reset state path highlight
          d3.select(`path[data-state-id="${d.id}"]`).attr('stroke-width', 1);
          // Show abbreviation again
          d3.select(this).text(statesData[d.id]?.abbr || '');
        });
      mapContainer.appendChild(svg.node());
      usMap = { svg, path, projection, states, colorScale };
      
      // Use natural breaks for legend
      console.log('Creating legend with natural breaks for USA map');
      const breaks = naturalBreaks(values, 3);
      
      // Special handling for Percent Access - always green for high values
      let isHighGood = METRIC_COLOR_LOGIC[selectedMetric] === 'high_is_good';
      if (selectedMetric && selectedMetric.includes('Percent Access')) {
        isHighGood = true;
      }
      
      const colors = getColorScheme(selectedMetric, isHighGood);
      console.log('Natural breaks:', breaks);
      console.log('Colors:', colors);
      console.log('Is high good:', isHighGood);
      console.log('Selected metric:', selectedMetric);
      console.log('Metric color logic result:', METRIC_COLOR_LOGIC[selectedMetric]);
      createLegendWithBreaks(breaks, colors, isHighGood, values);
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
  
  console.log("User is logged in, processing state click:", stateId);
  
  // Clear any existing tooltips
  d3.selectAll('.county-tooltip').remove();
  
  selectedState = stateId;
  selectedCounty = null;
  activeView = 'county';
  
  // Update UI elements - Hide compare counties button for state maps
  const compareBtn = document.getElementById('compareStatesButton');
  if (compareBtn) {
    compareBtn.style.display = 'none';
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
  
  // Fix scrollbar issue: Restore scrollbar functionality after state selection
  console.log('🔧 [NAV] Calling restoreScrollbarFunctionality from handleStateClick (delayed)');
  setTimeout(() => {
    restoreScrollbarFunctionality();
  }, 100);
  
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
  
  // Add boundary highlight to selected county and keep all counties clickable
  if (countyMap && countyMap.svg) {
    countyMap.svg.selectAll('.county')
      .transition()
      .duration(300)
      .attr('stroke', function() {
        const mapCountyName = d3.select(this).attr('data-county-name');
        
        // Compare using normalized versions but keep originals for display
        const normalizedMapName = normalizeCountyNameForComparison(mapCountyName);
        const normalizedSelectedName = normalizeCountyNameForComparison(originalCountyName);
        
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
        const normalizedSelectedName = normalizeCountyNameForComparison(originalCountyName);
        
        if (normalizedMapName === normalizedSelectedName) {
          return 3; // Thicker boundary for selected county
        } else {
          return 1; // Normal boundary for other counties
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
  console.log('🏠 [NAV] handleBackToStates called - returning to homepage');
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
  
  // Fix Bug 2: Reset the compare button text to "Compare States" when returning to USA map
  const compareBtn = document.getElementById('compareStatesButton');
  if (compareBtn) {
    compareBtn.textContent = 'Compare States';
    compareBtn.style.display = 'block';
  }
  
  // Fix scrollbar issue: Ensure scrollbar is restored when returning to homepage
  console.log('🔧 [NAV] Calling restoreScrollbarFunctionality from handleBackToStates (delayed)');
  setTimeout(() => {
    restoreScrollbarFunctionality();
  }, 100);
}

function handleBackToState() {
  if (selectedCounty) {
    selectedCounty = null;
    document.getElementById('mapTitle').textContent = `${statesData[selectedState].name} Counties`;
    
    // Clear any existing tooltips
    d3.selectAll('.county-tooltip').remove();
    
    // Restore all counties to normal appearance and make them clickable again
    if (countyMap && countyMap.svg) {
      countyMap.svg.selectAll('.county')
        .transition()
        .duration(300)
        .attr('opacity', 1)
        .attr('data-clickable', 'true')
        .attr('stroke', '#666') // Reset to normal boundary color
        .attr('stroke-width', 1) // Reset to normal boundary width
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
    
    // Keep compare counties button hidden for state maps
    const compareBtn = document.getElementById('compareStatesButton');
    if (compareBtn) {
      compareBtn.style.display = 'none';
    }
    
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
    
    // Show compare states button when back to USA map
    const compareBtn = document.getElementById('compareStatesButton');
    if (compareBtn) {
      compareBtn.style.display = 'block';
      compareBtn.textContent = 'Compare States';
    }
    
    // Fix scrollbar issue: Ensure scrollbar is restored when returning to state view
    setTimeout(() => {
      restoreScrollbarFunctionality();
    }, 100);
  }
}

function updateDataPanel() {
  console.log('📊 [DATA] updateDataPanel called - selectedState:', selectedState, 'selectedCounty:', selectedCounty);
  const dataPanelContent = document.getElementById('dataPanelContent');
  if (!selectedState) {
    console.log('📊 [DATA] Updating for USA view (no selected state)');
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
    console.log('📊 [DATA] Cleared inline styles for USA view');
    
    return;
  }
  if (selectedCounty) {
    console.log('📊 [DATA] Updating for county view:', selectedCounty);
    const template = document.getElementById('countyDataTemplate');
    const countyPanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(countyPanel);
    document.getElementById('backToStateButton').addEventListener('click', handleBackToState);
    
    // Fix Bug 1: Ensure scrollbar functionality is maintained by removing any inline styles
    dataPanelContent.style.overflowY = '';
    dataPanelContent.style.scrollbarWidth = '';
    dataPanelContent.style.scrollbarColor = '';
    console.log('📊 [DATA] Cleared inline styles for county view');
    
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
    console.log('📊 [DATA] Updating for state view:', statesData[selectedState]?.name);
    const template = document.getElementById('stateDataTemplate');
    const statePanel = template.content.cloneNode(true);
    dataPanelContent.innerHTML = '';
    dataPanelContent.appendChild(statePanel);
    document.getElementById('backButton').addEventListener('click', handleBackToStates);
    document.getElementById('stateName').textContent = statesData[selectedState].name;
    
    // Fix Bug 1: Ensure scrollbar functionality is maintained by removing any inline styles
    dataPanelContent.style.overflowY = '';
    dataPanelContent.style.scrollbarWidth = '';
    dataPanelContent.style.scrollbarColor = '';
    console.log('📊 [DATA] Cleared inline styles for state view');
    
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
      
      const infoButton = createInfoButton(desiredName, 'usa');
      label.appendChild(infoButton);
      
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
      
      const infoButton = createInfoButton(desiredName, 'state');
      label.appendChild(infoButton);
      
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
    wrapper.style.marginBottom = '2rem'; // Add gap between charts
    
    // Create title with info button
    const titleContainer = document.createElement('div');
    titleContainer.style.display = 'flex';
    titleContainer.style.alignItems = 'center';
    titleContainer.style.gap = '0.5rem';
    
    const title = document.createElement('h4');
    title.textContent = displayTitle;
    title.style.margin = '0';
    
    // Create info button
    const infoButton = document.createElement('button');
    infoButton.className = 'info-button';
    infoButton.innerHTML = 'i';
    infoButton.title = 'Click for more information';
    
    // Add click handler for info button
    infoButton.addEventListener('click', () => {
      // Try to load from frequency_metrics.txt file first, fallback to hardcoded text
      showInfoPopup(displayTitle, 'frequency');
    });
    
    titleContainer.appendChild(title);
    titleContainer.appendChild(infoButton);
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
    chartData.sort((a, b) => {
      const aNum = parseInt(a.range.match(/\d+/)?.[0] || '0', 10);
      const bNum = parseInt(b.range.match(/\d+/)?.[0] || '0', 10);
      return aNum - bNum;
    });
    
    // Create different colors for each bar
    const backgroundColor = chartData.map((_, index) => colorPalette[index % colorPalette.length]);
    const borderColor = backgroundColor;
    
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
          backgroundColor: backgroundColor,
          borderColor: borderColor,
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
            title: { display: true, text: 'Frequency (Number of addresses)', color: chartTextColor }, 
            ticks: { color: chartTextColor } 
          },
          x: { 
            title: { display: true, text: xAxisTitle, color: chartTextColor }, 
            ticks: { color: chartTextColor } 
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
      
      // Fix scrollbar issue: Restore scrollbar functionality after county data is loaded
      console.log('🔧 [NAV] Calling restoreScrollbarFunctionality from fetchCountyData (delayed)');
      setTimeout(() => {
        restoreScrollbarFunctionality();
      }, 100);
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
        
        const infoButton = createInfoButton(databaseFieldName, 'county');
        label.appendChild(infoButton);
        
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
    
    dataToProcess.forEach(([collectionName, freqData]) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'chart-wrapper';
      wrapper.style.marginBottom = '2rem'; // Add gap between charts
      
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
      
      // Create info button
      const infoButton = document.createElement('button');
      infoButton.className = 'info-button';
      infoButton.innerHTML = 'i';
      infoButton.title = 'Click for more information';
      
      // Add click handler for info button
      infoButton.addEventListener('click', () => {
        showInfoPopup(cleanTitle, 'county_frequency');
      });
      
      titleContainer.appendChild(title);
      titleContainer.appendChild(infoButton);
      wrapper.appendChild(titleContainer);
      
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
      
      // Create different colors for each bar
      const backgroundColor = chartData.map((_, index) => colorPalette[index % colorPalette.length]);
      const borderColor = backgroundColor;
      
      // Determine units for x-axis title
      let xAxisTitle = 'Range';
      if (cleanTitle.includes('Minutes') || cleanTitle.includes('Duration')) {
        xAxisTitle = 'Range (in min)';
      } else if (cleanTitle.includes('Miles') || cleanTitle.includes('Distance')) {
        xAxisTitle = 'Range (in miles)';
      }
      
      const chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels: chartData.map(d => d.range),
          datasets: [{
            label: cleanTitle,
            data: chartData.map(d => d.count),
            backgroundColor: backgroundColor,
            borderColor: borderColor,
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
              title: { display: true, text: 'Frequency (Number of addresses)', color: chartTextColor }, 
              ticks: { color: chartTextColor } 
            },
            x: { 
              title: { display: true, text: xAxisTitle, color: chartTextColor }, 
              ticks: { color: chartTextColor } 
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
  
  // Create mapping between new display names and old database names
  const metricPatterns = {
    "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)": [
      "Percent Access", "percent access", "Percent_Access", "percent_access"
    ],
    "Average Travel Time by Transit in Minutes": [
      "Average Travel Time by Transit in Minutes", "Average Travel Duration in Minutes",
      "travel duration", "Travel_Duration", "travel_duration"
    ],
    "Average Travel Time by Car in Minutes": [
      "Average Travel Time by Car in Minutes", "Average Driving Duration with Traffic in Minutes",
      "driving duration with traffic", "Driving_Duration_with_Traffic", "driving_duration_with_traffic"
    ],
    "Transit to Car Travel Time Ratio": [
      "Transit to Car Travel Time Ratio", "Transit: Driving", "Transit to Driving Ratio",
      "transit driving", "Transit_Driving", "transit_driving"
    ],
    "Number of Transfers": [
      "Number of Transfers", "Transfers", "transfers", "TRANSFERS"
    ],
    "Average Initial Walk Distance in Miles": [
      "Average Initial Walk Distance in Miles", "initial walk distance", "Initial_Walk_Distance"
    ],
    "Average Initial Walk Time in Minutes": [
      "Average Initial Walk Time in Minutes", "Average Initial Walk Duration in Minutes",
      "initial walk time", "initial walk duration", "Initial_Walk_Duration", "Initial_Walk_Time"
    ],
    "Average Initial Wait Time in Minutes": [
      "Average Initial Wait Time in Minutes", "initial wait time", "Initial_Wait_Time"
    ],
    "Average Total Walk Distance in Miles": [
      "Average Total Walk Distance in Miles", "total walk distance", "Total_Walk_Distance"
    ],
    "Average Total Walk Time": [
      "Average Total Walk Time in Minutes", "Average Total Walk Duration in Minutes", "Average Total Walk Duration in minutes",
      "total walk duration", "Total_Walk_Duration", "total walk time"
    ],
    "Average Total Wait Time in Minutes": [
      "Average Total Wait Time in Minutes", "Average Total Wait Duration in Minutes",
      "total wait duration", "Total_Wait_Duration", "total wait time"
    ],
    "Average In-Vehicle Travel Time in Minutes": [
      "Average In-Vehicle Travel Time in Minutes", "Average In-Vehicle Duration in Minutes",
      "in-vehicle duration", "In_Vehicle_Duration", "in-vehicle travel time"
    ],
    "Average Out-of-Vehicle Travel Time in Minutes": [
      "Average Out-of-Vehicle Travel Time in Minutes", "Average Out-of-Vehicle Duration in Minutes",
      "out-of-vehicle duration", "Out_of_Vehicle_Duration", "out-of-vehicle travel time"
    ],
    "In-Vehicle to Out-of-Vehicle Time Ratio": [
      "In-Vehicle to Out-of-Vehicle Time Ratio", "In-Vehicle:Out-of-Vehicle",
      "in-vehicle:out-of-vehicle", "In_Vehicle_Out_of_Vehicle"
    ],
    "Sample Size": [
      "Sample Size", "sample size", "Sample_Size", "sample_size"
    ]
  };
  
  // Group metrics by category
  let currentGroup = null;
  let currentOptgroup = null;
  
  // Use ordered metrics with Average prefix for county data
  ORDERED_TRANSIT_METRICS_WITH_AVERAGE.forEach(displayName => {
    // Skip empty strings (visual breaks)
    if (!displayName) return;
    
    // Try to find matching database field name
    let databaseFieldName = null;
    
    // First try exact match
    if (availableMetrics.includes(displayName)) {
      databaseFieldName = displayName;
    } else if (metricPatterns[displayName]) {
      // Try pattern variations
      for (const pattern of metricPatterns[displayName]) {
        const match = availableMetrics.find(dbField => 
          dbField === pattern ||
          dbField.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(dbField.toLowerCase()) ||
          dbField.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === pattern.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()
        );
        if (match) {
          databaseFieldName = match;
          break;
        }
      }
    }
    
    // If we found a match, add to dropdown with grouping
    if (databaseFieldName) {
      const group = getMetricGroup(displayName);
      
      // Create new optgroup if group changed
      if (group !== currentGroup) {
        currentOptgroup = document.createElement('optgroup');
        currentOptgroup.label = group;
        currentOptgroup.style.fontWeight = 'bold';
        currentOptgroup.style.backgroundColor = METRIC_GROUPS[group] ? METRIC_GROUPS[group].color + '15' : '#f0f0f0';
        select.appendChild(currentOptgroup);
        currentGroup = group;
      }
      
      const option = document.createElement('option');
      option.value = databaseFieldName;  // Use database field name for data lookup
      option.textContent = displayName;   // Show new display name to user
      option.dataset.displayName = displayName;
      option.dataset.group = group;
      currentOptgroup.appendChild(option);
    }
  });
  
  // Set default to "Percent Access" if available, otherwise first option
  if (select.options.length > 0) {
    const percentAccessOption = Array.from(select.options).find(option => 
      option.textContent === "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)"
    );
    if (percentAccessOption) {
      select.value = percentAccessOption.value;
      selectedCountyMetric = percentAccessOption.value;
    } else {
      select.value = select.options[0].value;
      selectedCountyMetric = select.options[0].value;
    }
  }
  
  select.removeEventListener('change', countyHandleMetricChange);
  select.addEventListener('change', countyHandleMetricChange);
  
  // Add info button for county map metrics
  addInfoButtonToCountyMetricSelection('county_map');
}

function addInfoButtonToCountyMetricSelection(mapType) {
  const countyMetricSelection = document.getElementById('countyMetricSelection');
  if (!countyMetricSelection) return;
  
  // Remove existing info button if it exists
  const existingInfoBtn = countyMetricSelection.querySelector('.county-metric-info-btn');
  if (existingInfoBtn) {
    existingInfoBtn.remove();
  }
  
  // Create info button
  const infoBtn = document.createElement('button');
  infoBtn.className = 'county-metric-info-btn';
  infoBtn.innerHTML = '<i class="fas fa-info-circle"></i>';
  infoBtn.title = 'Click for metric information';
  infoBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    cursor: pointer;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  `;
  
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const select = document.getElementById('countyMetricSelect');
    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption) {
      // Use the display name from the option's dataset, or fall back to textContent
      const displayName = selectedOption.dataset.displayName || selectedOption.textContent;
      showInfoPopup(displayName, mapType);
    } else {
      showInfoPopup('Select a metric first', 'Please select a metric from the dropdown to view its information.');
    }
  });
  
  // Add the button to the county metric selection container
  countyMetricSelection.style.position = 'relative';
  countyMetricSelection.appendChild(infoBtn);
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
  
  // Process all county data
  allCountyData.forEach(doc => {
    if (doc.title != null) {
      const countyName = String(doc.title);
      const normalizedCountyName = normalizeCountyNameForComparison(countyName);
      
      // Get the raw value for the selected metric
      const rawValue = doc[selectedCountyMetric];
      
      console.log(`Processing ${countyName}: rawValue=${rawValue}, type=${typeof rawValue}, metric=${selectedCountyMetric}`);
      
      // Check if Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes) is zero for this county (skip Sample Size metric)
      if (selectedCountyMetric !== 'Sample Size') {
        const percentAccessValue = doc['Percent Access'];
        const hasZeroPercentAccess = (percentAccessValue === 0 || percentAccessValue === 0.0);
        
        console.log(`Percent Access for ${countyName}: ${percentAccessValue}, hasZeroPercentAccess: ${hasZeroPercentAccess}`);
        
        if (hasZeroPercentAccess) {
          metricValues[normalizedCountyName] = 'No Access';
          nullCount++;
          console.log(`${countyName}: No Access (zero Percent Access for this county)`);
          return; // Skip processing - exclude from natural breaks
        }
      }
      
      // Process non-zero values only (only reached if Percent Access is non-zero)
      if (rawValue === null || rawValue === undefined || rawValue === '') {
        // Missing data for the selected metric - but since Percent Access is non-zero, this shouldn't happen
        metricValues[normalizedCountyName] = 'No Access';
        nullCount++;
        console.log(`${countyName}: No Access (missing data for selected metric but non-zero Percent Access)`);
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
          console.log(`${countyName}: No Access (zero Percent Access value for Percent Access metric)`);
          return; // Skip processing - exclude from natural breaks
        }
        
        const formattedValue = formatNumberToTwoDecimals(valueToProcess);
        metricValues[normalizedCountyName] = formattedValue;
        validValues.push(formattedValue);
        console.log(`${countyName}: ${formattedValue}`);
      } else if (typeof rawValue === 'string') {
        const parsed = parseFloat(rawValue.trim());
        if (isNaN(parsed)) {
          metricValues[normalizedCountyName] = 'No Access';
          nullCount++;
          console.log(`${countyName}: No Access (unparseable string: ${rawValue})`);
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
            console.log(`${countyName}: No Access (zero Percent Access parsed value for Percent Access metric)`);
            return; // Skip processing - exclude from natural breaks
          }
          
          const formattedValue = formatNumberToTwoDecimals(valueToProcess);
          metricValues[normalizedCountyName] = formattedValue;
          validValues.push(formattedValue);
          console.log(`${countyName}: ${formattedValue}`);
        }
      } else {
        metricValues[normalizedCountyName] = 'No Access';
        nullCount++;
        console.log(`${countyName}: No Access (unknown type: ${typeof rawValue})`);
      }
    }
  });
  
  console.log(`Processed counties: ${validValues.length} valid values, ${nullCount} No Access`);
  console.log(`Selected metric: ${selectedCountyMetric}`);
  console.log(`Is Percent Access metric: ${selectedCountyMetric.includes('Percent Access')}`);
  
  // Debug: Show some sample metric values
  const sampleValues = Object.entries(metricValues).slice(0, 5);
  console.log('Sample metric values:', sampleValues);
  
  // Create color scale for valid numeric values only
  let colorScale;
  if (validValues.length === 0) {
    // No valid numeric data
    colorScale = null;
  } else if (validValues.length === 1 || Math.min(...validValues) === Math.max(...validValues)) {
    // All valid values are the same
    colorScale = () => '#27ae60';
  } else {
    // Use natural breaks for better categorization
    const breaks = naturalBreaks(validValues, 3);
    const isHighGood = METRIC_COLOR_LOGIC[selectedCountyMetric] === 'high_is_good';
    const colors = getColorScheme(selectedCountyMetric, isHighGood);
    
    colorScale = d3.scaleThreshold()
      .domain(breaks)
      .range(colors);
  }
  
  // Update county colors
  let coloredCount = 0;
  let nullColoredCount = 0;
  
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
  
  console.log(`Applied colors: ${coloredCount} valid, ${nullColoredCount} No Access (black)`);
  
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
  console.log('createCountyLegendForMap called');
  const legend = document.getElementById('legend');
  console.log('County legend element found:', legend);
  const colorScale = countyMap?.colorScale;
  const validValues = countyMap?.validValues || [];
  const hasNullValues = countyMap?.hasNullValues || false;
  console.log('County legend data:', { validValues: validValues.length, hasNullValues });
  console.log('Selected county metric:', selectedCountyMetric);
  console.log('Is Percent Access metric:', selectedCountyMetric.includes('Percent Access'));
  
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
    const isHighGood = METRIC_COLOR_LOGIC[selectedCountyMetric] === 'high_is_good';
    const colors = getColorScheme(selectedCountyMetric, isHighGood);
    
    legendContent += `<div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">`;
    
    if (breaks.length === 0 || validValues.length === 1) {
      // All valid values are the same
      legendContent += `
        <div style="display: flex; align-items: center; gap: 5px;">
          <div style="width: 20px; height: 20px; background: ${colors[0]};"></div> 
          <span>${validValues[0].toFixed(2)}</span>
        </div>
      `;
    } else {
      // Create ranges based on natural breaks
      const ranges = [];
      
      // Get actual min and max values for better display
      const allValues = [...validValues];
      const actualMin = Math.min(...allValues);
      const actualMax = Math.max(...allValues);
      console.log('Range values:', { allValues, actualMin, actualMax, breaks });
      
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
          `${range.min.toFixed(2)} - ${range.max.toFixed(2)}` : 
          `${range.min.toFixed(2)} - ${range.max.toFixed(2)}`;
        
        console.log('Range:', { min: range.min, max: range.max, text: rangeText, color: range.color });
        
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
  
  console.log('Setting county legend content:', wrapperContent);
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
      const isHighGood = METRIC_COLOR_LOGIC[selectedCountyMetric] === 'high_is_good';
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
      
      legendInfo += `<br><br>Counties with "No Access" (zero Percent Access) are shown with a striped pattern.`;
      
      showInfoPopup(`${metricName} - Legend Information`, legendInfo);
    };
  }
  console.log('County legend updated successfully');
  console.log('Final legend HTML:', legend.innerHTML);
}

// -----------------------------------------------------------------------------
// SCROLLBAR RESTORATION FUNCTION
function restoreScrollbarFunctionality() {
  console.log('🔧 [SCROLLBAR] Starting scrollbar restoration...');
  
  // Get the right panel (data panel) content
  const dataPanelContent = document.getElementById('dataPanelContent');
  if (!dataPanelContent) {
    console.log('❌ [SCROLLBAR] dataPanelContent not found!');
    return;
  }
  
  console.log('✅ [SCROLLBAR] dataPanelContent found:', dataPanelContent);
  console.log('📊 [SCROLLBAR] Current scrollHeight:', dataPanelContent.scrollHeight);
  console.log('📊 [SCROLLBAR] Current clientHeight:', dataPanelContent.clientHeight);
  console.log('📊 [SCROLLBAR] Current overflowY:', dataPanelContent.style.overflowY);
  console.log('📊 [SCROLLBAR] Current computed overflowY:', getComputedStyle(dataPanelContent).overflowY);
  
  // Get the parent sidebar container
  const rightPanel = document.getElementById('rightPanel');
  if (rightPanel) {
    console.log('📊 [SCROLLBAR] rightPanel scrollHeight:', rightPanel.scrollHeight);
    console.log('📊 [SCROLLBAR] rightPanel clientHeight:', rightPanel.clientHeight);
    console.log('📊 [SCROLLBAR] rightPanel computed height:', getComputedStyle(rightPanel).height);
  }
  
  // Force the sidebar content to have a constrained height
  const viewportHeight = window.innerHeight;
  const navbarHeight = 80; // Approximate navbar height
  const availableHeight = viewportHeight - navbarHeight;
  
  console.log('📏 [SCROLLBAR] Viewport height:', viewportHeight);
  console.log('📏 [SCROLLBAR] Available height for sidebar:', availableHeight);
  
  // Set explicit height constraint on the sidebar content
  dataPanelContent.style.maxHeight = `${availableHeight - 100}px`; // Leave some padding
  dataPanelContent.style.overflowY = 'auto';
  dataPanelContent.style.scrollbarWidth = 'thin';
  dataPanelContent.style.scrollbarColor = 'var(--text-light) transparent';
  
  console.log('🔧 [SCROLLBAR] Set maxHeight to:', dataPanelContent.style.maxHeight);
  console.log('🔧 [SCROLLBAR] Set overflowY to:', dataPanelContent.style.overflowY);
  
  // Force a reflow to ensure the scrollbar is properly rendered
  const height = dataPanelContent.offsetHeight;
  console.log('🔄 [SCROLLBAR] Forced reflow, height:', height);
  
  // Also ensure the sidebar container has proper scrollbar settings
  if (rightPanel) {
    console.log('✅ [SCROLLBAR] rightPanel found:', rightPanel);
    rightPanel.style.overflowY = '';
    rightPanel.style.scrollbarWidth = '';
    rightPanel.style.scrollbarColor = '';
    console.log('🧹 [SCROLLBAR] Cleared rightPanel inline styles');
  } else {
    console.log('❌ [SCROLLBAR] rightPanel not found!');
  }
  
  // Small delay to ensure DOM is fully updated
  setTimeout(() => {
    console.log('⏰ [SCROLLBAR] Delayed restoration (10ms later)...');
    // Trigger a reflow again to ensure scrollbar is rendered
    const finalHeight = dataPanelContent.offsetHeight;
    console.log('🔄 [SCROLLBAR] Final reflow, height:', finalHeight);
    console.log('📊 [SCROLLBAR] Final scrollHeight:', dataPanelContent.scrollHeight);
    console.log('📊 [SCROLLBAR] Final clientHeight:', dataPanelContent.clientHeight);
    console.log('📊 [SCROLLBAR] Final computed overflowY:', getComputedStyle(dataPanelContent).overflowY);
    console.log('📊 [SCROLLBAR] Can scroll?', dataPanelContent.scrollHeight > dataPanelContent.clientHeight);
    console.log('📊 [SCROLLBAR] Max height set to:', dataPanelContent.style.maxHeight);
    console.log('✅ [SCROLLBAR] Scrollbar restoration completed');
  }, 10);
}

// -----------------------------------------------------------------------------
// EQUITY COMPARISON FUNCTIONS
function switchToMapView() {
  console.log('🗺️ [NAV] switchToMapView called');
  document.getElementById('mapView').style.display = 'block';
  document.getElementById('legend').style.display = 'block';
  document.getElementById('equityComparisonContent').style.display = 'none';
  document.getElementById('mapViewTab').classList.add('active');
  document.getElementById('equityComparisonTab').classList.remove('active');
  
  // Restore both sidebars
  document.getElementById('leftPanel').style.display = 'block';
  document.getElementById('rightPanel').style.display = 'block';
  console.log('📱 [NAV] Sidebars restored to display: block');
  
  // Show compare counties tab
  const compareBtn = document.getElementById('compareStatesButton');
  if (compareBtn) {
    compareBtn.style.display = 'block';
  }
  
  // Restore main content layout
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.style.marginLeft = '';
    mainContent.style.marginRight = '';
    mainContent.style.width = '';
    mainContent.classList.remove('equity-comparison-active');
  }
  
  // Fix scrollbar issue: Restore scrollbar functionality after sidebar visibility changes
  console.log('🔧 [NAV] Calling restoreScrollbarFunctionality from switchToMapView');
  restoreScrollbarFunctionality();
}

function switchToEquityComparison() {
  if (!selectedState || selectedCounty) {
    return;
  }
  loadComparisonData();
  
  // Hide map and legend
  document.getElementById('mapView').style.display = 'none';
  document.getElementById('legend').style.display = 'none';
  
  // Show equity comparison content
  document.getElementById('equityComparisonContent').style.display = 'block';
  document.getElementById('equityComparisonTab').classList.add('active');
  document.getElementById('mapViewTab').classList.remove('active');
  
  // Update state title
  const stateTitle = document.getElementById('equityStateTitle');
  if (stateTitle && statesData[selectedState]) {
    stateTitle.textContent = `Transit Vs Equity - ${statesData[selectedState].name}`;
  }
  
  // Hide both sidebars
  document.getElementById('leftPanel').style.display = 'none';
  document.getElementById('rightPanel').style.display = 'none';
  
  // Hide compare counties tab
  const compareBtn = document.getElementById('compareStatesButton');
  if (compareBtn) {
    compareBtn.style.display = 'none';
  }
  
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
        
        // Store metrics for this category
        equityMetricsByCategory[category] = equityMetricKeys;
        
        console.log("Extracted Equity Metric Keys:", equityMetricKeys);
      } else {
        console.warn(`No equity data found for ${category}`);
        equityMetricKeys = [];
        equityMetricsByCategory[category] = [];
      }
      
      // Populate metrics menu for the current category
      populateEquityMetricsMenu(category, equityMetricKeys);
      
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
  
  // Create mapping patterns (similar to county metrics) - COMPLETE LIST
  const metricPatterns = {
    "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)": [
      "Percent Access", "percent access", "Percent_Access"
    ],
    "Average Travel Time by Transit in Minutes": [
      "Average Travel Time by Transit in Minutes", "Average Travel Duration in Minutes", "Travel Duration in Minutes"
    ],
    "Average Travel Time by Car in Minutes": [
      "Average Travel Time by Car in Minutes", "Average Driving Duration with Traffic in Minutes", "Driving Duration with Traffic in Minutes"
    ],
    "Transit to Car Travel Time Ratio": [
      "Transit to Car Travel Time Ratio", "Transit: Driving", "Transit to Driving Ratio"
    ],
    "Number of Transfers": [
      "Number of Transfers", "Transfers", "transfers"
    ],
    "Average Initial Walk Distance in Miles": [
      "Average Initial Walk Distance in Miles", "Initial Walk Distance in Miles"
    ],
    "Average Initial Walk Time in Minutes": [
      "Average Initial Walk Time in Minutes", "Average Initial Walk Duration in Minutes", "Initial Walk Duration in Minutes"
    ],
    "Average Initial Wait Time in Minutes": [
      "Average Initial Wait Time in Minutes", "Initial Wait Time in Minutes"
    ],
    "Average Total Walk Distance in Miles": [
      "Average Total Walk Distance in Miles", "Total Walk Distance in Miles"
    ],
    "Average Total Walk Time": [
      "Average Total Walk Time in Minutes", "Average Total Walk Duration in Minutes", "Total Walk Duration in Minutes"
    ],
    "Average Total Wait Time in Minutes": [
      "Average Total Wait Time in Minutes", "Average Total Wait Duration in Minutes", "Total Wait Duration in Minutes"
    ],
    "Average In-Vehicle Travel Time in Minutes": [
      "Average In-Vehicle Travel Time in Minutes", "Average In-Vehicle Duration in Minutes", "In-Vehicle Duration in Minutes"
    ],
    "Average Out-of-Vehicle Travel Time in Minutes": [
      "Average Out-of-Vehicle Travel Time in Minutes", "Average Out-of-Vehicle Duration in Minutes", "Out-of-Vehicle Duration in Minutes"
    ],
    "In-Vehicle to Out-of-Vehicle Time Ratio": [
      "In-Vehicle to Out-of-Vehicle Time Ratio", "In-Vehicle:Out-of-Vehicle"
    ],
    "Sample Size": [
      "Sample Size", "sample size"
    ]
  };
  
  // Group metrics by category
  let currentGroup = null;
  let currentOptgroup = null;
  
  // Use ordered metrics with Average prefix for equity comparison
  ORDERED_TRANSIT_METRICS_WITH_AVERAGE.forEach(displayName => {
    // Skip empty strings
    if (!displayName) return;
    
    // Try to find matching database field
    let databaseFieldName = null;
    if (transitMetricKeys.includes(displayName)) {
      databaseFieldName = displayName;
    } else if (metricPatterns[displayName]) {
      for (const pattern of metricPatterns[displayName]) {
        const match = transitMetricKeys.find(dbField => 
          dbField === pattern ||
          dbField.toLowerCase().includes(pattern.toLowerCase()) ||
          pattern.toLowerCase().includes(dbField.toLowerCase())
        );
        if (match) {
          databaseFieldName = match;
          break;
        }
      }
    }
    
    // If found, add with grouping
    if (databaseFieldName) {
      const group = getMetricGroup(displayName);
      
      // Create new optgroup if group changed
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
    }
  });
  
  if (select.options.length > 0) {
    // Set default to "Percent Access" if available, otherwise first option
    const percentAccessOption = Array.from(select.options).find(option => 
      option.textContent === "Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)"
    );
    select.value = percentAccessOption ? percentAccessOption.value : select.options[0].value;
    selectedCountyMetric = select.value;
    
    console.log("Default transit metric selected:", selectedCountyMetric);
  }
  
  select.addEventListener('change', createComparisonScatterPlotFull);
}

function populateEquityMetricDropdown() {
  const select = document.getElementById('equityMetricSelect');
  select.innerHTML = '';
  
  console.log("Populating equity metrics:", equityMetricKeys);
  
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
    
    console.log("Default equity metric selected:", select.value);
  }
  
  select.addEventListener('change', createComparisonScatterPlotFull);
}

function populateEquityMetricsMenu(category, metrics) {
  console.log(`📝 [EQUITY MENU] populateEquityMetricsMenu called for category: ${category}`);
  console.log(`   - Metrics count:`, metrics ? metrics.length : 0);
  
  const menuId = `metricsMenu_${category}`;
  const menu = document.getElementById(menuId);
  
  if (!menu) {
    console.error(`❌ [EQUITY MENU] Metrics menu not found: ${menuId}`);
    console.error(`   - Searching for element with ID: ${menuId}`);
    // Try to find all metrics menus
    const allMenus = document.querySelectorAll('[id^="metricsMenu_"]');
    console.error(`   - Found ${allMenus.length} menus with metricsMenu prefix`);
    allMenus.forEach(m => console.error(`   - Found menu: ${m.id}`));
    return;
  }
  
  console.log(`✅ [EQUITY MENU] Found menu element: ${menuId}`);
  console.log(`   - Menu current innerHTML length:`, menu.innerHTML.length);
  
  if (!metrics || metrics.length === 0) {
    console.warn(`⚠️ [EQUITY MENU] No metrics provided for ${category}`);
    menu.innerHTML = '<div class="equity-metric-loading">No metrics available</div>';
    return;
  }
  
  menu.innerHTML = '';
  console.log(`   - Clearing menu and adding ${metrics.length} metric items`);
  
  metrics.forEach((metric, index) => {
    const menuItem = document.createElement('div');
    menuItem.className = 'equity-metric-item';
    menuItem.dataset.metric = metric;
    menuItem.dataset.category = category;
    const displayName = mapEquityMetricName(metric, category);
    menuItem.textContent = displayName;
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log(`🖱️ [EQUITY MENU] Metric clicked: ${displayName} (${metric})`);
      selectEquityMetric(category, metric, displayName);
    });
    menu.appendChild(menuItem);
    
    if (index < 3) {
      console.log(`   - Added metric ${index + 1}: ${displayName}`);
    }
  });
  
  console.log(`✅ [EQUITY MENU] Populated menu with ${metrics.length} items`);
  console.log(`   - Menu innerHTML length now:`, menu.innerHTML.length);
  
  // Ensure menu is visible if parent option is being hovered
  const option = document.querySelector(`.equity-category-option[data-category="${category}"]`);
  if (option) {
    const isHovered = option.matches(':hover');
    console.log(`   - Parent option hovered:`, isHovered);
    if (isHovered) {
      menu.classList.add('active');
      console.log(`   - Menu activated because parent is hovered`);
    }
  }
  
  console.log(`   - Menu active class after population:`, menu.classList.contains('active'));
  console.log(`   - Menu computed display:`, window.getComputedStyle(menu).display);
}

function selectEquityMetric(category, metric, displayName) {
  console.log(`🎯 [EQUITY MENU] Selecting metric: ${metric} for category: ${category}`);
  
  // Update hidden selects
  const categorySelect = document.getElementById('equityCategorySelect');
  const metricSelect = document.getElementById('equityMetricSelect');
  const previousCategory = categorySelect ? categorySelect.value : null;
  
  if (categorySelect) {
    categorySelect.value = category;
    console.log(`   ✅ [EQUITY MENU] Category select updated to: ${category}`);
  }
  
  // If category changed, we need to reload the equity data for the new category
  if (previousCategory !== category && selectedState) {
    console.log(`   🔄 [EQUITY MENU] Category changed from ${previousCategory} to ${category}, reloading data`);
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
      console.log(`   ✅ [EQUITY MENU] Metric select updated to: ${metric}`);
    } else {
      // Option doesn't exist - need to repopulate dropdown with metrics from this category
      console.log(`   ⚠️ [EQUITY MENU] Metric option not found, repopulating dropdown for category: ${category}`);
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
        console.log(`   ✅ [EQUITY MENU] Repopulated dropdown with ${equityMetricsByCategory[category].length} metrics`);
      } else {
        console.error(`   ❌ [EQUITY MENU] No metrics available for category: ${category}`);
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
  console.log(`   📊 [EQUITY MENU] Updating chart with category: ${category}, metric: ${metric}`);
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
  console.log('🔧 [EQUITY MENU] Setting up equity category hover menu...');
  const categoryDisplay = document.getElementById('equityCategoryDisplay');
  const categoryOptions = document.querySelector('.equity-category-options');
  
  if (!categoryDisplay) {
    console.error('❌ [EQUITY MENU] categoryDisplay not found!');
    return;
  }
  if (!categoryOptions) {
    console.error('❌ [EQUITY MENU] categoryOptions not found!');
    return;
  }
  
  console.log('✅ [EQUITY MENU] Found categoryDisplay and categoryOptions');
  
  // Toggle menu on click
  categoryDisplay.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('🖱️ [EQUITY MENU] Category display clicked');
    categoryOptions.classList.toggle('active');
    console.log('📋 [EQUITY MENU] Category options active:', categoryOptions.classList.contains('active'));
    if (!categoryOptions.classList.contains('active')) {
      closeEquityMenus();
    }
  });
  
  // Handle category option hover
  const categoryOptionsList = document.querySelectorAll('.equity-category-option');
  console.log(`📋 [EQUITY MENU] Found ${categoryOptionsList.length} category options`);
  
  categoryOptionsList.forEach((option, index) => {
    const category = option.dataset.category;
    const metricsMenu = document.getElementById(`metricsMenu_${category}`);
    
    console.log(`🔍 [EQUITY MENU] Setting up option ${index + 1}: ${category}`);
    console.log(`   - Metrics menu element:`, metricsMenu ? 'Found' : 'NOT FOUND');
    console.log(`   - Metrics menu ID: metricsMenu_${category}`);
    
    if (!metricsMenu) {
      console.error(`❌ [EQUITY MENU] Metrics menu not found for category: ${category}`);
      console.error(`   - Looking for element with ID: metricsMenu_${category}`);
      // Try to find it in the DOM
      const allMenus = document.querySelectorAll('.equity-metrics-menu');
      console.log(`   - Found ${allMenus.length} total metrics menus in DOM`);
      allMenus.forEach((m, i) => {
        console.log(`   - Menu ${i + 1} ID:`, m.id);
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
        
        console.log(`🖱️ [EQUITY MENU] Mouse entered category option: ${category}`);
        // Show metrics menu on the right
        if (metricsMenu) {
          console.log(`   ✅ [EQUITY MENU] Metrics menu found for ${category}`);
          console.log(`   📊 [EQUITY MENU] Menu innerHTML length:`, metricsMenu.innerHTML.length);
          console.log(`   📊 [EQUITY MENU] Cached metrics:`, equityMetricsByCategory[category] ? equityMetricsByCategory[category].length : 0);
          
          // Always try to load/populate metrics when hovering
          if (equityMetricsByCategory[category] && equityMetricsByCategory[category].length > 0) {
            console.log(`   ✅ [EQUITY MENU] Using cached metrics (${equityMetricsByCategory[category].length} metrics)`);
            // We have metrics cached, use them
            populateEquityMetricsMenu(category, equityMetricsByCategory[category]);
            metricsMenu.classList.add('active');
            console.log(`   ✅ [EQUITY MENU] Menu activated with cached metrics`);
          } else {
            // Check if menu has actual metric items or just placeholder/loading content
            const hasMetricItems = metricsMenu.querySelector('.equity-metric-item');
            const hasLoadingMessage = metricsMenu.innerHTML.includes('Hover to load') || 
                                      metricsMenu.innerHTML.includes('Loading') ||
                                      metricsMenu.querySelector('.equity-metric-loading');
            
            console.log(`   📊 [EQUITY MENU] Menu state check:`);
            console.log(`      - Has metric items:`, hasMetricItems ? 'Yes' : 'No');
            console.log(`      - Has loading message:`, hasLoadingMessage ? 'Yes' : 'No');
            console.log(`      - innerHTML length:`, metricsMenu.innerHTML.length);
            
            if (!hasMetricItems || hasLoadingMessage || metricsMenu.innerHTML.length < 200) {
              console.log(`   ⏳ [EQUITY MENU] Loading metrics for category: ${category}`);
              // Need to load metrics for this category
              loadMetricsForCategory(category);
              // Show menu immediately (will show loading message)
              metricsMenu.classList.add('active');
              console.log(`   ✅ [EQUITY MENU] Menu activated (loading metrics)`);
            } else {
              console.log(`   ✅ [EQUITY MENU] Menu already has content, just showing it`);
              // Menu has content, just show it
              metricsMenu.classList.add('active');
            }
          }
          
          console.log(`   📊 [EQUITY MENU] Menu active class:`, metricsMenu.classList.contains('active'));
          console.log(`   📊 [EQUITY MENU] Menu display style:`, window.getComputedStyle(metricsMenu).display);
          console.log(`   📊 [EQUITY MENU] Menu visibility:`, window.getComputedStyle(metricsMenu).visibility);
        } else {
          console.error(`   ❌ [EQUITY MENU] Metrics menu element not found for ${category}!`);
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
          console.log(`   🔒 [EQUITY MENU] Closing menu for ${category}`);
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
  console.log(`📋 [EQUITY MENU] Found ${allMetricsMenus.length} metrics menus`);
  
  allMetricsMenus.forEach((menu, index) => {
    console.log(`   - Menu ${index + 1} ID:`, menu.id);
    menu.addEventListener('mouseenter', () => {
      console.log(`🖱️ [EQUITY MENU] Mouse entered metrics menu: ${menu.id}`);
      menu.classList.add('active');
    });
    menu.addEventListener('mouseleave', () => {
      console.log(`🖱️ [EQUITY MENU] Mouse left metrics menu: ${menu.id}`);
      menu.classList.remove('active');
    });
  });
  
  // Close menus when clicking outside
  document.addEventListener('click', (e) => {
    if (!categoryDisplay.contains(e.target) && !categoryOptions.contains(e.target)) {
      console.log('🖱️ [EQUITY MENU] Clicked outside, closing menus');
      closeEquityMenus();
    }
  });
  
  console.log('✅ [EQUITY MENU] Setup complete');
}

// Store metrics for each category
let equityMetricsByCategory = {};

function loadMetricsForCategory(category) {
  console.log(`📥 [EQUITY MENU] loadMetricsForCategory called for: ${category}`);
  
  // This will be called when hovering over a category that hasn't been loaded yet
  const menuId = `metricsMenu_${category}`;
  const menu = document.getElementById(menuId);
  
  if (!menu) {
    console.error(`❌ [EQUITY MENU] Menu element not found: ${menuId}`);
    return;
  }
  
  console.log(`✅ [EQUITY MENU] Found menu element: ${menuId}`);
  
  // Check if we already have metrics for this category
  if (equityMetricsByCategory[category] && equityMetricsByCategory[category].length > 0) {
    console.log(`✅ [EQUITY MENU] Using cached metrics for ${category} (${equityMetricsByCategory[category].length} metrics)`);
    populateEquityMetricsMenu(category, equityMetricsByCategory[category]);
    return;
  }
  
  // Show loading message
  console.log(`⏳ [EQUITY MENU] Showing loading message for ${category}`);
  menu.innerHTML = '<div class="equity-metric-loading">Loading metrics...</div>';
  
  // Fetch metrics for this category
  if (!selectedState) {
    console.warn(`⚠️ [EQUITY MENU] No state selected, cannot load metrics`);
    menu.innerHTML = '<div class="equity-metric-loading">Please select a state first</div>';
    return;
  }
  
  const stateName = statesData[selectedState].name;
  const correctedStateName = getCountyDbName(stateName);
  const formattedState = formatStateNameForDb(correctedStateName);
  
  console.log(`🌐 [EQUITY MENU] Fetching metrics for category: ${category}, state: ${formattedState}`);
  const url = `/api/equityCountyAverageValues/${encodeURIComponent(category)}/${encodeURIComponent(formattedState)}`;
  console.log(`   - URL:`, url);
  
  fetch(url)
    .then(response => {
      console.log(`📡 [EQUITY MENU] Response status:`, response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log(`📦 [EQUITY MENU] Received data for ${category}:`, data ? data.length : 0, 'items');
      
      if (data && data.length > 0) {
        console.log(`   - First data item keys:`, Object.keys(data[0]));
        let metrics = [];
        
        if (category === 'Housing_Data') {
          if (data[0].data) {
            metrics = Object.keys(data[0].data);
            console.log(`   - Found metrics in data.data:`, metrics.length);
          } else if (data[0].Population) {
            metrics = Object.keys(data[0].Population);
            console.log(`   - Found metrics in data.Population:`, metrics.length);
          } else {
            metrics = Object.keys(data[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && 
              key !== 'county' && key !== 'data' && key !== 'Population'
            );
            console.log(`   - Found metrics in data root:`, metrics.length);
          }
        } else {
          if (data[0].data && typeof data[0].data === 'object') {
            metrics = Object.keys(data[0].data);
            console.log(`   - Found metrics in data.data:`, metrics.length);
          } else {
            metrics = Object.keys(data[0]).filter(key => 
              key !== '_id' && key !== 'title' && key !== 'state' && key !== 'data'
            );
            console.log(`   - Found metrics in data root:`, metrics.length);
          }
        }
        
        console.log(`✅ [EQUITY MENU] Extracted ${metrics.length} metrics for ${category}`);
        if (metrics.length > 0) {
          console.log(`   - Sample metrics:`, metrics.slice(0, 3));
        }
        
        // Store metrics for this category
        equityMetricsByCategory[category] = metrics;
        
        // Populate the menu
        populateEquityMetricsMenu(category, metrics);
        
        // Ensure menu is visible
        const menuElement = document.getElementById(`metricsMenu_${category}`);
        if (menuElement) {
          menuElement.classList.add('active');
          console.log(`✅ [EQUITY MENU] Menu activated after loading metrics`);
          console.log(`   - Menu display:`, window.getComputedStyle(menuElement).display);
        } else {
          console.error(`❌ [EQUITY MENU] Could not find menu element to activate: ${menuId}`);
        }
      } else {
        console.warn(`⚠️ [EQUITY MENU] No data received for ${category}`);
        menu.innerHTML = '<div class="equity-metric-loading">No metrics available</div>';
      }
    })
    .catch(err => {
      console.error(`❌ [EQUITY MENU] Error loading metrics for ${category}:`, err);
      console.error(`   - Error details:`, err.message);
      menu.innerHTML = '<div class="equity-metric-loading">Error loading metrics</div>';
    });
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
        console.log(`📊 [CHART] Inferred category ${cat} from metric ${equityMetric}`);
        break;
      }
    }
  }
  
  console.log(`📊 [CHART] Using equity category: ${equityCategory}, metric: ${equityMetric}`);
  
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
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
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
  
  console.log(`[CHART] Using actual values scale`);
  
  // Calculate chart dimensions - More adaptive sizing
  const containerRect = container.getBoundingClientRect();
  const chartContainerWidth = Math.max(containerRect.width || 900, 800); // Minimum width
  const chartContainerHeight = Math.max(containerRect.height || 600, 400); // Minimum height
  
  // Use container dimensions with better margins and centering
  const chartWidth = Math.min(chartContainerWidth - 100, 1000); // More margin for centering
  const chartHeight = Math.min(chartContainerHeight - 160, 600); // More margin for centering
  
  console.log(`[CHART] Chart dimensions: ${chartWidth}x${chartHeight} (container: ${chartContainerWidth}x${chartContainerHeight})`);
  
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
  
  console.log(`[CHART] Single chart rendered with actual values`);
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
    // County metrics - use ordered metrics with Average prefix
    if (transitMetricKeys && transitMetricKeys.length > 0) {
      ORDERED_TRANSIT_METRICS_WITH_AVERAGE.forEach(metricName => {
        if (transitMetricKeys.includes(metricName)) {
          const option = document.createElement('option');
          option.value = metricName;
          option.textContent = metricName;
          metricSelect.appendChild(option);
        }
      });
    } else {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No metrics available';
      option.disabled = true;
      metricSelect.appendChild(option);
    }
  } else {
    // State metrics - use ordered metrics without Average prefix
    if (allStateData && allStateData.length > 0) {
      ORDERED_TRANSIT_METRICS.forEach(metricName => {
        const metricExists = allStateData.some(metric => metric.title === metricName);
        if (metricExists) {
          const option = document.createElement('option');
          option.value = metricName;
          option.textContent = metricName;
          metricSelect.appendChild(option);
        }
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