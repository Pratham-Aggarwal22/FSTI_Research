// Public/js/comparison.js - Clean Statistical Comparison Interface

// Chart.js plugins
// Chart.register(ChartZoom); // Removed zoom functionality

// Global variables
let selectedStates = [];
let selectedCounties = [];
let statisticalChart = null;
let availableStates = [];
let availableCounties = [];
let countyModalOpen = false;
let currentChartData = null; // Store chart data globally for callbacks
let chartHoverResetCleanup = null;

const COMPARISON_DEBUG = true;
const comparisonLog = (...args) => {
  // Removed console logging
};
const comparisonWarn = (...args) => {
  // Removed console logging
};

const METRIC_GROUP_COLORS = {
  'Access': '#9b59b6',
  'Travel Times': '#3498db',
  'Transfers': '#e67e22',
  'Initial Journey': '#1abc9c',
  'Total Journey': '#f39c12',
  'Vehicle Times': '#e74c3c',
  'Sample Data': '#95a5a6',
  'Equity': '#8e44ad',
  'Other': '#636e72'
};

const METRIC_GROUP_ORDER = [
  'Access',
  'Travel Times',
  'Transfers',
  'Initial Journey',
  'Total Journey',
  'Vehicle Times',
  'Sample Data',
  'Other'
];

const DEFAULT_METRIC_COLOR = '#2c41ff';

// Remove frequency collections from transit categories for dot plot selection
function filterTransitCategories(transitCategories = []) {
  return (transitCategories || []).filter(cat => {
    const label = (cat.displayCategory || cat.category || '').toLowerCase();
    return !label.includes('frequency');
  });
}

function getMetricGroup(metricName = '') {
  if (!metricName) return 'Travel Times';
  const normalized = metricName.toLowerCase();
  if (normalized.includes('percent access')) return 'Access';
  if (normalized.includes('vehicle')) return 'Vehicle Times';
  if (
    normalized.includes('travel time') ||
    normalized.includes('travel duration') ||
    normalized.includes('driving duration') ||
    normalized.includes('transit to car') ||
    normalized.includes('transit to driving') ||
    normalized.includes('transit:driving')
  ) {
    return 'Travel Times';
  }
  if (normalized.includes('transfer')) return 'Transfers';
  if (normalized.includes('initial')) return 'Initial Journey';
  if (normalized.includes('total')) return 'Total Journey';
  if (normalized.includes('sample')) return 'Sample Data';
  return 'Other';
}

function getMetricColor(metricName = '') {
  const group = getMetricGroup(metricName);
  return METRIC_GROUP_COLORS[group] || DEFAULT_METRIC_COLOR;
}

function styleSelectWithColor(selectElement, color) {
  if (!selectElement) return;
  const appliedColor = color || DEFAULT_METRIC_COLOR;
  selectElement.style.borderColor = appliedColor;
  selectElement.style.boxShadow = `0 0 0 1px ${appliedColor}`;
  selectElement.style.color = '#1f1f1f';
}

function applyMetricSelectStyles() {
  const metricSelect = document.getElementById('metricSelect');
  if (!metricSelect || metricSelect.selectedIndex < 0) return;
  const selectedOption = metricSelect.options[metricSelect.selectedIndex];
  const color = selectedOption?.dataset.color || DEFAULT_METRIC_COLOR;
  styleSelectWithColor(metricSelect, color);
}

function resetChartView() {
  const canvas = document.getElementById('statisticalChart');
  const placeholder = document.getElementById('chartPlaceholder');
  if (statisticalChart) {
    statisticalChart.destroy();
    statisticalChart = null;
  }
  if (canvas) canvas.style.display = 'none';
  if (placeholder) {
    placeholder.style.display = 'flex';
    placeholder.innerHTML = '<i class="fas fa-chart-line"></i><p>Please select the metrics first</p>';
  }
}

function updateChartAccent(color) {
  const appliedColor = color || DEFAULT_METRIC_COLOR;
  const chartContainer = document.querySelector('.chart-container-full');
  if (chartContainer) {
    chartContainer.style.borderTop = `4px solid ${appliedColor}`;
  }
  const legendTitle = document.querySelector('#chartLegend .legend-title');
  if (legendTitle) {
    legendTitle.style.borderColor = appliedColor;
    legendTitle.style.borderBottom = `2px solid ${appliedColor}`;
    legendTitle.style.color = appliedColor;
  }
}

// Function to set selected states from external source
function setSelectedStates(states) {
  selectedStates = states || [];
  comparisonLog('Selected states set:', selectedStates);
  
  // Update display
  updateSelectedStatesDisplay();
  
  // Show comparison interface if states are selected
  if (selectedStates.length > 0) {
    showNewComparisonInterface();
  }
}

// Make functions globally available
window.setSelectedStates = setSelectedStates;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Set up event listeners
    setupEventListeners();
    
    // Get selected states from sessionStorage
    const storedStates = sessionStorage.getItem('selectedStatesForComparison');
    if (storedStates) {
      const stateNames = JSON.parse(storedStates);
      setSelectedStates(stateNames);
      // Clear the stored states after using them
      sessionStorage.removeItem('selectedStatesForComparison');
    }
    
    // Update selected states display
    updateSelectedStatesDisplay();
    
    // Counties functionality removed - focusing on states only
  } catch (error) {
    // Error handling without console logging
  }
});

// Load available states
async function loadStates() {
  try {
    const response = await fetch('/comparison/api/states');
    availableStates = await response.json();
  } catch (error) {
    // Error handling without console logging
  }
}

// Set up event listeners
function setupEventListeners() {
  // Main category change handler
  const mainCategorySelect = document.getElementById('mainCategorySelect');
  const subcategorySelect = document.getElementById('subcategorySelect');
  const metricSelect = document.getElementById('metricSelect');
  
  if (mainCategorySelect) {
    mainCategorySelect.addEventListener('change', (e) => {
      const category = e.target.value;
      resetChartView();
      populateSubcategories(category);
      
      // Show subcategory dropdown
      if (subcategorySelect) {
        subcategorySelect.disabled = false;
        subcategorySelect.style.display = 'block';
      }
      
      // Hide and reset metric dropdown
      if (metricSelect) {
        metricSelect.disabled = true;
        metricSelect.style.display = 'none';
        metricSelect.innerHTML = '<option value="">Select metric...</option>';
      }
    });
  }
  
  if (subcategorySelect) {
    subcategorySelect.addEventListener('change', (e) => {
      const subcategory = e.target.value;
      const mainCategory = mainCategorySelect.value;
      resetChartView();
      populateMetrics(mainCategory, subcategory);
      
      // Show metric dropdown
      if (metricSelect) {
        metricSelect.disabled = false;
        metricSelect.style.display = 'block';
      }
    });
  }
  
  if (metricSelect) {
    metricSelect.addEventListener('change', (e) => {
      const metric = e.target.value;
      applyMetricSelectStyles();
      if (metric) {
        // Show county controls when metric is selected
        showCountyControls();
        // Don't auto-load counties when metric changes - keep existing counties
        // Only regenerate chart with current selections
        generateStatisticalChart();
      }
    });
  }
  
  // County controls event listeners
  const addCountyBtn = document.getElementById('addCountyBtn');
  const countyModal = document.getElementById('countyModal');
  const closeCountyModal = document.getElementById('closeCountyModal');
  const cancelCountySelection = document.getElementById('cancelCountySelection');
  const confirmCountySelection = document.getElementById('confirmCountySelection');
  const countySearch = document.getElementById('countySearch');
  
  if (addCountyBtn) {
    addCountyBtn.addEventListener('click', openCountyModal);
  }
  
  if (closeCountyModal) {
    closeCountyModal.addEventListener('click', closeCountyModalHandler);
  }
  
  if (cancelCountySelection) {
    cancelCountySelection.addEventListener('click', closeCountyModalHandler);
  }
  
  if (confirmCountySelection) {
    confirmCountySelection.addEventListener('click', confirmCountySelectionHandler);
  }
  
  if (countySearch) {
    countySearch.addEventListener('input', filterCounties);
  }
  
  // Close modal when clicking outside
  if (countyModal) {
    countyModal.addEventListener('click', (e) => {
      if (e.target === countyModal) {
        closeCountyModalHandler();
      }
    });
  }
}

// Show new comparison interface
function showNewComparisonInterface() {
  const newComparisonInterface = document.getElementById('newComparisonInterface');
  
  if (newComparisonInterface) {
    newComparisonInterface.style.display = 'block';
    setupNewComparisonInterface();
  }
}

// Setup the new comparison interface
function setupNewComparisonInterface() {
  const mainCategorySelect = document.getElementById('mainCategorySelect');
  const subcategorySelect = document.getElementById('subcategorySelect');
  const metricSelect = document.getElementById('metricSelect');
  
  // Initialize dropdowns as disabled and hidden
  if (subcategorySelect) {
    subcategorySelect.disabled = true;
    subcategorySelect.style.display = 'none';
  }
  if (metricSelect) {
    metricSelect.disabled = true;
    metricSelect.style.display = 'none';
  }
  
  // Set default selection (Transit Data) and show first dropdown
  if (mainCategorySelect) {
    mainCategorySelect.value = 'transit';
    showCountyControls();
    populateSubcategories('transit')
      .then(() => {
        if (metricSelect) {
          const firstMetric = metricSelect.querySelector('option:not([value=""])');
          if (firstMetric && !metricSelect.value) {
            metricSelect.value = firstMetric.value;
          }
          applyMetricSelectStyles();
          if (selectedStates.length > 0 && metricSelect.value) {
            generateStatisticalChart();
          }
        }
      })
      .catch(error => {
        // Error handling without console logging
      });
  }
}

// Populate subcategories based on main category  
async function populateSubcategories(category) {
  const subcategorySelect = document.getElementById('subcategorySelect');
  const metricSelect = document.getElementById('metricSelect');
  if (!subcategorySelect) return;
  
  subcategorySelect.innerHTML = '<option value="">Loading...</option>';
  if (metricSelect) {
    metricSelect.innerHTML = '<option value="">Select metric...</option>';
    metricSelect.disabled = true;
    metricSelect.style.display = 'none';
  }
  
  try {
    // Fetch the comparison-dotplot data to get actual categories
    const response = await fetch('/comparison/api/comparison-dotplot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        states: selectedStates
      })
    });
    
    const data = await response.json();
    subcategorySelect.innerHTML = '<option value="">Select subcategory...</option>';
    
    if (category === 'equity' && data.equity) {
      data.equity.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.category;
        option.textContent = cat.category;
        subcategorySelect.appendChild(option);
      });
      subcategorySelect.disabled = false;
      subcategorySelect.style.display = 'block';
    } else if (category === 'transit' && data.transit) {
      const filteredTransit = filterTransitCategories(data.transit);
      const transitCategories = filteredTransit.length > 0 ? filteredTransit : data.transit;
      const hideSubcategory = transitCategories.length <= 1;
      
      transitCategories.forEach(cat => {
        const option = document.createElement('option');
        const displayName = cat.displayCategory || cat.category;
        option.value = cat.category;
        option.textContent = displayName;
        option.dataset.displayName = displayName;
        subcategorySelect.appendChild(option);
      });

      const defaultTransitCategory = transitCategories[0];
      if (defaultTransitCategory) {
        subcategorySelect.value = defaultTransitCategory.category;
        if (metricSelect) {
          metricSelect.disabled = false;
          metricSelect.style.display = 'block';
        }
        await populateMetrics('transit', defaultTransitCategory.category, data);
      }

      subcategorySelect.disabled = hideSubcategory;
      subcategorySelect.style.display = hideSubcategory ? 'none' : 'block';
    }
    
    if (subcategorySelect.children.length === 1) {
      subcategorySelect.innerHTML = '<option value="">No categories available</option>';
    }
    
  } catch (error) {
    subcategorySelect.innerHTML = '<option value="">Error loading categories</option>';
  }
}

// Populate metrics based on category and subcategory
async function populateMetrics(category, subcategory, prefetchedData = null) {
  const metricSelect = document.getElementById('metricSelect');
  if (!metricSelect) return;
  
  metricSelect.innerHTML = '<option value="">Loading metrics...</option>';
  
  try {
    // Fetch metrics from the comparison-dotplot API
    let data = prefetchedData;
    if (!data) {
      const response = await fetch('/comparison/api/comparison-dotplot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          states: selectedStates
        })
      });
      data = await response.json();
    }

    metricSelect.innerHTML = '<option value="">Select metric...</option>';
    
    if (category === 'equity' && data.equity) {
      // Find the matching equity category by exact name
      const equityCategory = data.equity.find(cat => cat.category === subcategory);
      
      if (equityCategory && equityCategory.metrics) {
        equityCategory.metrics
          .filter(metric => {
            const name = (metric.legend || metric.originalLegend || '').toLowerCase();
            return name !== 'state';
          })
          .forEach(metric => {
          const option = document.createElement('option');
          // Use originalLegend for database queries, mapped legend for display
          option.value = metric.originalLegend || metric.legend;
          option.textContent = metric.legend; // Display mapped name
          option.dataset.displayName = metric.legend; // Store mapped name
          option.dataset.group = 'Equity';
          option.dataset.color = METRIC_GROUP_COLORS['Equity'];
          metricSelect.appendChild(option);
        });
      }
    } else if (category === 'transit' && data.transit) {
      const filteredTransit = filterTransitCategories(data.transit);
      const transitCategories = filteredTransit.length > 0 ? filteredTransit : data.transit;
      const transitCategory = (transitCategories || []).find(cat => cat.category === subcategory);
      const effectiveTransitCategory = transitCategory || (transitCategories ? transitCategories[0] : null);

      if (effectiveTransitCategory && effectiveTransitCategory.metrics) {
        const filteredMetrics = (effectiveTransitCategory.metrics || []).filter(metric => {
          const name = (metric.legend || metric.originalLegend || '').toLowerCase();
          return !name.includes('sample size');
        });
        const groupedMetrics = {};
        filteredMetrics.forEach(metric => {
          const displayName = metric.legend || metric.originalLegend;
          const group = getMetricGroup(displayName);
          if (!groupedMetrics[group]) {
            groupedMetrics[group] = [];
          }
          groupedMetrics[group].push(metric);
        });
        
        const orderedGroups = [
          ...METRIC_GROUP_ORDER,
          ...Object.keys(groupedMetrics).filter(group => !METRIC_GROUP_ORDER.includes(group))
        ];
        
        orderedGroups.forEach(group => {
          const metricsInGroup = groupedMetrics[group];
          if (!metricsInGroup || metricsInGroup.length === 0) return;
          
          metricsInGroup.sort((a, b) => {
            const nameA = (a.legend || a.originalLegend || '').toLowerCase();
            const nameB = (b.legend || b.originalLegend || '').toLowerCase();
            return nameA.localeCompare(nameB);
          });
          
          const optgroup = document.createElement('optgroup');
          const optgroupColor = METRIC_GROUP_COLORS[group] || DEFAULT_METRIC_COLOR;
          optgroup.label = group;
          optgroup.dataset.color = optgroupColor;
          optgroup.style.backgroundColor = `${optgroupColor}15`;
          optgroup.style.color = '#000';
          
          metricsInGroup.forEach(metric => {
            const option = document.createElement('option');
            const displayName = metric.legend || metric.originalLegend;
            option.value = metric.originalLegend || metric.legend;
            option.textContent = displayName;
            option.dataset.displayName = displayName;
            option.dataset.group = group;
            option.dataset.color = optgroupColor;
            option.style.color = '#000';
            optgroup.appendChild(option);
          });
          
          metricSelect.appendChild(optgroup);
        });
      }
    }
    
    metricSelect.disabled = false;
    metricSelect.style.display = 'block';

    const availableOptions = metricSelect.querySelectorAll('option');
    if (availableOptions.length <= 1) {
      metricSelect.innerHTML = '<option value="">No metrics available</option>';
    } else {
      // do not auto-select; wait for user selection
    }
    
  } catch (error) {
    metricSelect.innerHTML = '<option value="">Error loading metrics</option>';
  }
}


// County controls removed - focusing on states only

// County functionality removed - focusing on states only

// Generate statistical chart
function generateStatisticalChart() {
  const mainCategory = document.getElementById('mainCategorySelect').value;
  const subcategory = document.getElementById('subcategorySelect').value;
  const metric = document.getElementById('metricSelect').value;
  
  comparisonLog('=== CHART GENERATION DEBUG ===');
  comparisonLog('Selected states:', selectedStates);
  comparisonLog('Main category:', mainCategory);
  comparisonLog('Subcategory:', subcategory);
  comparisonLog('Metric:', metric);
  
  if (!mainCategory || !subcategory || !metric) {
    comparisonLog('Missing required selections for chart generation');
    return;
  }
  
  if (selectedStates.length === 0) {
    comparisonLog('No states selected for comparison');
    return;
  }
  
  comparisonLog('All requirements met, fetching statistical data...');
  // Fetch data and generate chart
  fetchStatisticalData(mainCategory, subcategory, metric);
}

// Fetch statistical data
async function fetchStatisticalData(category, subcategory, metric) {
  try {
    comparisonLog('Fetching statistical data for:', { category, subcategory, metric, states: selectedStates });
    
    const response = await fetch('/comparison/api/statistical-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        category,
        subcategory,
        metric,
        states: selectedStates,
        counties: []
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    comparisonLog('Statistical data received:', data);
    // Do not alert for skipped states
    
    // Get the mapped metric name from the selected option
    const metricSelect = document.getElementById('metricSelect');
    const selectedOption = metricSelect ? metricSelect.options[metricSelect.selectedIndex] : null;
    const mappedMetricName = selectedOption ? (selectedOption.dataset.displayName || selectedOption.textContent) : data.metric;
    const accentColor = category === 'equity'
      ? METRIC_GROUP_COLORS['Equity']
      : getMetricColor(mappedMetricName);
    const metricGroup = category === 'equity'
      ? 'Equity'
      : getMetricGroup(mappedMetricName);
    updateChartAccent(accentColor);
    
    // Add mapped metric name to data for chart display
    data.mappedMetric = mappedMetricName;
    data.metricColor = accentColor;
    data.metricGroup = metricGroup;
    
    comparisonLog('=== API RESPONSE DEBUG ===');
    comparisonLog('Full API response:', data);
    comparisonLog('Statistics object:', data.statistics);
    comparisonLog('Statistics keys:', data.statistics ? Object.keys(data.statistics) : 'No statistics object');
    comparisonLog('Mapped metric name:', mappedMetricName);
    
    if (data.statistics && Object.keys(data.statistics).length > 0) {
      comparisonLog('Creating chart with data:', data.statistics);
      createStatisticalChart(data);
    } else {
      comparisonLog('Response data:', data);
      // Show placeholder message
      const canvas = document.getElementById('statisticalChart');
      const placeholder = document.getElementById('chartPlaceholder');
      if (canvas) {
        canvas.style.display = 'none';
      }
      if (placeholder) {
        placeholder.style.display = 'flex';
        placeholder.innerHTML = '<i class="fas fa-chart-line"></i><p>No data available for selected metric</p>';
      }
    }
  } catch (error) {
    // Error handling without console logging
  }
}

// County functionality removed - focusing on states only

// Create statistical chart
function createStatisticalChart(data) {
  comparisonLog('=== CHART CREATION DEBUG ===');
  comparisonLog('Input data for chart creation:', data);
  const formatShortNumber = (val) => {
    const abs = Math.abs(val);
    if (abs >= 1_000_000) return (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (abs >= 1_000) return (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    return val.toFixed(2);
  };
  
  const canvas = document.getElementById('statisticalChart');
  const placeholder = document.getElementById('chartPlaceholder');
  const accentColor = data.metricColor || DEFAULT_METRIC_COLOR;
  
  if (!canvas) {
    return;
  }
  
  // Hide placeholder and show canvas
  if (placeholder) {
    placeholder.style.display = 'none';
  }
  canvas.style.display = 'block';
  
  comparisonLog('Canvas found:', canvas);
  const ctx = canvas.getContext('2d');
  if (chartHoverResetCleanup) {
    chartHoverResetCleanup();
    chartHoverResetCleanup = null;
  }

  if (statisticalChart) {
    comparisonLog('Destroying existing chart');
    statisticalChart.destroy();
    statisticalChart = null;
  }
  
  // Clear the canvas context
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Prepare data for the new chart format
  const chartData = prepareNewStatisticalChartData(data);
  currentChartData = chartData; // Store globally for callbacks
  comparisonLog('Chart data prepared:', chartData);
  comparisonLog('Number of datasets:', chartData.datasets ? chartData.datasets.length : 'No datasets');
  comparisonLog('Chart data structure:', JSON.stringify(chartData, null, 2));
  
  // Validate chart data
  if (!chartData || !chartData.datasets || chartData.datasets.length === 0) {
    return;
  }
  
  if (!chartData.yLabels || chartData.yLabels.length === 0) {
    return;
  }
  
  comparisonLog('Chart data validation passed');
  comparisonLog('Y-axis labels for chart:', chartData.yLabels);
  comparisonLog('Number of Y-axis labels:', chartData.yLabels.length);
  comparisonLog('All entities for chart:', chartData.allEntities);
  
  // Log each Y-axis label that will be used in the chart
  if (chartData.yLabels) {
    chartData.yLabels.forEach((label, index) => {
      comparisonLog(`Chart Y-axis label ${index}: "${label}"`);
    });
  }
  
  // Calculate required height based on actual Y-axis labels
  const yLabelsCount = chartData.yLabels ? chartData.yLabels.length : 0;
  
  // Calculate proper height: keep spacing tight but readable
  const entityHeight = 50; // Comfortable spacing per state/county
  const topPadding = 140; // Space for title and legend at top
  const bottomPadding = 150; // Keep x-axis label visible without pushing chart too low
  
  // Only add extra spacing between state groups when counties are shown
  const stateCount = selectedStates.length;
  const hasCountySpacing = selectedCounties && selectedCounties.length > 0;
  const xAxisSpacing = hasCountySpacing ? Math.max(0, (stateCount - 1) * 30) : 0;
  
  const calculatedChartHeight = (yLabelsCount * entityHeight) + topPadding + bottomPadding + xAxisSpacing;
  
  // Minimum height to prevent tiny charts, but let it grow as needed
  const finalChartHeight = Math.max(500, calculatedChartHeight);
  
  comparisonLog(`Y-axis labels count: ${yLabelsCount}`);
  comparisonLog(`Calculated chart height: ${finalChartHeight}px (${yLabelsCount} entities × ${entityHeight}px + ${topPadding + bottomPadding}px padding)`);
  
  // Set DYNAMIC container height - grows with content but with proper spacing
  const chartContainer = document.querySelector('.chart-container-full');
  
  if (chartContainer) {
    // Allow horizontal scroll if needed for wide ranges
    chartContainer.style.height = `${finalChartHeight}px`;
    chartContainer.style.minHeight = `${finalChartHeight}px`;
    chartContainer.style.maxHeight = 'none';
    chartContainer.style.overflowX = 'auto';
    chartContainer.style.overflowY = 'visible';
  }
  
  // Canvas matches container - everything fits perfectly
  canvas.style.height = `${finalChartHeight}px`;
  canvas.style.width = '100%';
  canvas.style.minHeight = `${finalChartHeight}px`;
  
  // Custom plugin to draw range bars behind points and x-axis after each state
  const rangeBarPlugin = {
    id: 'rangeBars',
    beforeDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const xAxis = chart.scales.x;
      
      // Draw range bar for each entity (state/county)
      if (currentChartData && currentChartData.yLabels) {
        currentChartData.yLabels.forEach((label, index) => {
          if (!label || label === '' || label.startsWith('__gap')) return; // Skip empty/gap labels
          
          // Get all x values for this Y index (we now use numeric Y values)
          const yPixel = yAxis.getPixelForValue(index);
          let minValue = Infinity;
          let maxValue = -Infinity;
          
          chart.data.datasets.forEach(dataset => {
            (dataset.data || []).forEach(point => {
              if (point && point.y === index && point.x !== undefined) {
                minValue = Math.min(minValue, point.x);
                maxValue = Math.max(maxValue, point.x);
              }
            });
          });
          
          if (minValue !== Infinity && maxValue !== -Infinity) {
            const xMin = xAxis.getPixelForValue(minValue);
            const xMax = xAxis.getPixelForValue(maxValue);
            
            // Draw subtle background bar (like in reference image)
            ctx.save();
            ctx.fillStyle = 'rgba(150, 150, 150, 0.12)';
            ctx.fillRect(xMin, yPixel - 8, xMax - xMin, 16);
            
            // Draw darker grey horizontal line
            ctx.strokeStyle = '#999999';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(xMin, yPixel);
            ctx.lineTo(xMax, yPixel);
            ctx.stroke();
            ctx.restore();
          }
        });
      }
    },
    afterDatasetsDraw(chart) {
      const ctx = chart.ctx;
      const yAxis = chart.scales.y;
      const xAxis = chart.scales.x;
      
      // Draw x-axis after each state group (except the last one) ONLY if that state has counties
      if (currentChartData && currentChartData.allEntities) {
        const stateIndices = [];
        currentChartData.allEntities.forEach((entity, index) => {
          // Only add state-gap positions - they're only created if the state has counties
          if (entity.type === 'state-gap') {
            stateIndices.push(index);
          }
        });
        
        stateIndices.forEach(gapIndex => {
          // Align to pixel grid to avoid fuzziness
          const rawY = yAxis.getPixelForValue(gapIndex);
          const yPixel = Math.round(rawY) + 0.5;
          
          ctx.save();
          // Draw x-axis line
          ctx.strokeStyle = '#d0d0d0';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xAxis.left, yPixel);
          ctx.lineTo(xAxis.right, yPixel);
          ctx.stroke();
          
          // Draw x-axis ticks and labels
          ctx.font = '10px Inter, Arial, sans-serif';
          ctx.fillStyle = '#666';
          ctx.textAlign = 'center';
          
          const tickCount = 5;
          const xMin = xAxis.min;
          const xMax = xAxis.max;
          const step = (xMax - xMin) / (tickCount - 1);
          
          for (let i = 0; i < tickCount; i++) {
            const tickValue = xMin + (step * i);
            const tickX = Math.round(xAxis.getPixelForValue(tickValue)) + 0.5;
            
            // Draw tick mark
            ctx.beginPath();
            ctx.moveTo(tickX, yPixel);
            ctx.lineTo(tickX, yPixel + 5);
            ctx.stroke();
            
            // Draw tick label
            ctx.fillText(tickValue.toFixed(2), tickX, yPixel + 16);
          }
          ctx.restore();
        });
      }
    }
  };
  
  try {
  // Determine x-axis type and min/max
  const allValues = (chartData.datasets || []).flatMap(ds => (ds.data || []).map(d => d.x)).filter(v => typeof v === 'number' && !isNaN(v));
  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 1;
  let xAxisType = 'linear';
  let suggestedMin = 0;
  let suggestedMax = maxVal;
  if (data.category === 'equity' && minVal > 0 && maxVal / Math.max(minVal, 1e-6) > 100) {
    xAxisType = 'logarithmic';
    suggestedMin = Math.max(minVal * 0.8, 0.0001);
    suggestedMax = maxVal * 1.1;
  } else {
    const range = maxVal - minVal;
    suggestedMin = 0; // clamp to zero; no negatives
    suggestedMax = maxVal + range * 0.1;
  }

  statisticalChart = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: chartData.datasets
    },
    plugins: [rangeBarPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      devicePixelRatio: Math.max(window.devicePixelRatio || 1, 2), // Fix for blurry/pixelated text
      onHover: (event, activeElements) => {
        // Hover event handling
      },
      hover: {
        // Allow hovering slightly around a point; Chart.js will pick
        // the nearest point, which is now correctly aligned with the
        // row thanks to numeric Y indices.
        mode: 'nearest',
        intersect: false,
        axis: 'xy',
        animationDuration: 0
      },
      animation: {
        duration: 0
      },
      plugins: {
        title: {
          display: true,
          text: `${data.mappedMetric || data.metric}`,
          font: {
            size: 16,
            weight: '600',
            family: "'Inter', 'Arial', sans-serif"
          },
          color: accentColor,
          padding: {
            top: 10,
            bottom: 20
          }
        },
        legend: {
          display: true,
          position: 'top',
          align: 'start',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            font: {
              size: 11,
              weight: '500',
              family: "'Inter', 'Arial', sans-serif"
            },
            padding: 15,
            color: '#4a4a4a',
            boxWidth: 8,
            boxHeight: 8
          }
        },
        tooltip: {
          enabled: true,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1a1a1a',
          bodyColor: '#4a4a4a',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          // Let Chart.js choose the nearest point to the cursor; with
          // properly aligned Y values this stays on the correct row.
          mode: 'nearest',
          intersect: false,
          bodyFont: {
            size: 12,
            family: "'Inter', 'Arial', sans-serif"
          },
          titleFont: {
            size: 13,
            weight: '600',
            family: "'Inter', 'Arial', sans-serif"
          },
          callbacks: {
            title: function(context) {
              const point = context[0];
              const entity = point.raw.entity;
              return entity;
            },
            label: function(context) {
              const value = context.raw.x;
              const type = context.dataset.label;
              const meta = context.raw.meta || {};
              const lines = [`${type}: ${value.toFixed(3)}`];
              if (type === 'Minimum' && meta.minCounty) {
                lines.push(`County: ${meta.minCounty}`);
              }
              if (type === 'Maximum' && meta.maxCounty) {
                lines.push(`County: ${meta.maxCounty}`);
              }
              return lines;
            },
            footer: function(context) {
              const raw = context[0]?.raw || {};
              const meta = raw.meta || {};
              if (meta.totalCount !== undefined && meta.zeroAccessCount !== undefined) {
                return `Zero-access counties: ${meta.zeroAccessCount}/${meta.totalCount}`;
              }
              return '';
            }
          }
        },
      },
      scales: {
        x: {
          type: xAxisType,
          position: 'bottom',
          title: {
            display: true,
            text: data.mappedMetric || data.metric || 'Statistical Values',
            font: {
              size: 12,
              weight: '500',
              family: "'Inter', 'Arial', sans-serif"
            },
            color: accentColor,
            padding: {
              top: 10
            }
          },
          ticks: {
            callback: function(value) {
              return formatShortNumber(value);
            },
            font: {
              size: 11,
              family: "'Inter', 'Arial', sans-serif"
            },
            color: '#666',
            padding: 8
          },
          grid: {
            color: '#e5e5e5',
            lineWidth: 1,
            drawOnChartArea: true,
            drawTicks: false,
            tickLength: 0
          },
          border: {
            display: true,
            color: '#d0d0d0',
            width: 1
          },
          beginAtZero: false,
          suggestedMin,
          suggestedMax
        },
        y: {
          // Linear scale with one row per integer index (0, 1, 2, ...).
          // We keep a half-unit padding above and below so rows don't
          // sit directly on the chart edges.
          type: 'linear',
          position: 'left',
          reverse: true,
          title: {
            display: false
          },
          display: true,
          min: -0.5,
          max: (chartData.yLabels ? chartData.yLabels.length - 0.5 : 0.5),
          ticks: {
            stepSize: 1,
            padding: 10,
            autoSkip: false,
            labelOffset: 20,
            font: function(context) {
              if (!currentChartData || !currentChartData.allEntities) {
                return {
                  size: 11,
                  weight: 'normal',
                  family: "'Inter', 'Arial', sans-serif"
                };
              }
              
              // Safety check: ensure tick and value exist
              if (!context.tick || typeof context.tick.value === 'undefined') {
                 return {
                  size: 11,
                  weight: 'normal',
                  family: "'Inter', 'Arial', sans-serif"
                };
              }

              const index = Math.round(context.tick.value);
              const entity = currentChartData.allEntities[index];
              
              if (entity && entity.type === 'county') {
                return {
                  size: 11,
                  weight: 'normal',
                  family: "'Inter', 'Arial', sans-serif"
                };
              } else if (entity && entity.type === 'state') {
                return {
                  size: 12,
                  weight: '600',
                  family: "'Inter', 'Arial', sans-serif"
                };
              }
              
              return {
                size: 11,
                weight: 'normal',
                family: "'Inter', 'Arial', sans-serif"
              };
            },
            color: function(context) {
              if (!currentChartData || !currentChartData.allEntities) {
                return '#4a4a4a';
              }

              // Safety check: ensure tick and value exist
              if (!context.tick || typeof context.tick.value === 'undefined') {
                return '#4a4a4a';
              }

              const index = Math.round(context.tick.value);
              const entity = currentChartData.allEntities[index];
              
              if (entity && entity.type === 'county') {
                return '#666';
              } else if (entity && entity.type === 'state') {
                return '#1a1a1a';
              }
              
              return '#4a4a4a';
            },
            display: true,
            callback: function(value, index, ticks) {
              if (!currentChartData || !currentChartData.yLabels || !currentChartData.allEntities) {
                return '';
              }
              
              const labelIndex = Math.round(value);

              if (labelIndex < 0 || labelIndex >= currentChartData.yLabels.length) {
                return '';
              }
              
              const label = currentChartData.yLabels[labelIndex];
              
              // Hide gap labels
              if (!label || label === '' || label.startsWith('__gap')) {
                return '';
              }
              
              const entity = currentChartData.allEntities[labelIndex];
              
              if (entity && entity.type === 'county') {
                const county = selectedCounties.find(c => c.fullName === label);
                if (county) {
                  return county.name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
                }
              }
              
              return label;
            }
          },
          grid: {
            // Hide the default horizontal grid lines; we draw our own
            // grey range bars that align exactly with the labels.
            color: '#e5e5e5',
            lineWidth: 1,
            drawOnChartArea: false,
            drawTicks: false,
            tickLength: 0
          },
          border: {
            display: true,
            color: '#d0d0d0',
            width: 1
          }
        }
      },
      layout: {
        padding: {
          top: 20,
          right: 40,
          // Extra bottom padding so the last state has clear space
          // above the x-axis and doesn't feel cramped.
          bottom: 70,
          left: 20
        }
      },
      elements: {
        point: {
          radius: 4.5,
          hoverRadius: 6,
          // Generous hit radius so hover works reliably even if the
          // user isn't pixel-perfect.
          hitRadius: 20,
          borderWidth: 2,
          borderColor: '#fff',
        }
      },
      interaction: {
        // Global interaction: pick the nearest point in X/Y space,
        // without requiring exact intersection.
        intersect: false,
        mode: 'nearest',
        axis: 'xy'
      }
    }
  });
  renderChartInfoButton(statisticalChart, data.statistics || {}, data.category);
  
  comparisonLog('Chart created successfully');
  comparisonLog('Chart instance:', statisticalChart);
  comparisonLog('Chart data:', statisticalChart.data);
  
  // Force resize after creation
  setTimeout(() => {
    if (statisticalChart && statisticalChart.resize) {
      comparisonLog('Resizing chart...');
      statisticalChart.resize();
    }
    
    // Force another resize to ensure all content is visible
    setTimeout(() => {
      if (statisticalChart && statisticalChart.resize) {
        comparisonLog('Second resize to ensure all content visible...');
        statisticalChart.resize();
      }
    }, 500);
  }, 100);
  
  // Log Y-axis information
  comparisonLog('=== CHART Y-AXIS DEBUG ===');
  comparisonLog('Chart scales:', statisticalChart.scales);
  comparisonLog('Y-axis scale:', statisticalChart.scales?.y);
  comparisonLog('Y-axis labels in chart:', statisticalChart.scales?.y?.labels);
  comparisonLog('Y-axis ticks:', statisticalChart.scales?.y?.ticks);
  comparisonLog('Y-axis display:', statisticalChart.scales?.y?.display);
  comparisonLog('=== END CHART Y-AXIS DEBUG ===');
  
  } catch (error) {
    if (statisticalChart) {
      statisticalChart.destroy();
      statisticalChart = null;
    }
    return;
  }
  
  chartHoverResetCleanup = attachChartHoverReset(canvas);
  
  // Adjust chart size based on number of entities
  adjustChartSize();
  
  // Add zoom reset functionality
  // Zoom controls removed
  
  // Apply custom styling to Y-axis labels after chart renders
  setTimeout(() => {
    applyCustomYAxisStyling();
    // No scroll indicator needed - all states are visible with dynamic height
  }, 200);
}

function renderStateInfoPanel() {
  // deprecated
}

// Render inline (i) icons next to y-axis labels
function renderChartInfoButton(chart, statistics, category) {
  const container = document.querySelector('.chart-container-full');
  if (!container) return;
  // Remove existing button
  container.querySelectorAll('.chart-info-button').forEach(btn => btn.remove());
  if (category !== 'transit') return;
  const btn = document.createElement('button');
  btn.className = 'chart-info-button';
  btn.textContent = 'ℹ';
  Object.assign(btn.style, {
    position: 'absolute',
    top: '8px',
    left: '8px',
    zIndex: 10,
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    border: '1px solid #ccc',
      background: '#f5f5f5',
    cursor: 'pointer',
    fontSize: '12px',
    lineHeight: '20px',
    padding: 0
  });

  const openModal = () => {
    const entries = Object.keys(statistics || {}).map(state => {
      const s = statistics[state] || {};
      const zero = s.zeroAccessCount ?? 0;
      const total = s.totalCount ?? 0;
      return `<div class="chart-info-row"><strong>${state}</strong>: ${zero}/${total} zero-access counties</div>`;
    });
    const content = entries.length ? entries.join('') : '<div>No statistics available.</div>';

    const overlay = document.createElement('div');
    overlay.className = 'chart-info-overlay';
    Object.assign(overlay.style, {
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0,0,0,0.45)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    });

    const modal = document.createElement('div');
    Object.assign(modal.style, {
      background: '#fff',
      borderRadius: '8px',
      padding: '16px',
      minWidth: '260px',
      maxWidth: '360px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      fontSize: '14px',
      lineHeight: '1.5',
      position: 'relative'
    });
    modal.innerHTML = `
      <div style="font-weight:600; margin-bottom:8px;">Zero Access Summary</div>
      <div class="chart-info-body">${content}</div>
      <button class="chart-info-close" style="position:absolute; top:8px; right:8px; border:none; background:none; font-size:16px; cursor:pointer;">×</button>
    `;

    modal.querySelector('.chart-info-close').addEventListener('click', () => {
      overlay.remove();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    overlay.appendChild(modal);
    document.body.appendChild(overlay);
  };

  btn.addEventListener('click', openModal);
  container.style.position = container.style.position === 'static' ? 'relative' : container.style.position;
  container.appendChild(btn);
}

// Deprecated inline icons (no-op)
function renderStateInfoIcons() {
  try {
  } catch (err) {
    // Error handling without console logging
  }
}

function resetStatisticalChartHover() {
  if (!statisticalChart) return;
  if (typeof statisticalChart.setActiveElements === 'function') {
    statisticalChart.setActiveElements([]);
  }
  if (statisticalChart.tooltip) {
    if (typeof statisticalChart.tooltip.setActiveElements === 'function') {
      statisticalChart.tooltip.setActiveElements([], { x: 0, y: 0 });
    } else if (Array.isArray(statisticalChart.tooltip._active)) {
      statisticalChart.tooltip._active = [];
    }
  }
  statisticalChart.update('none');
}

function attachChartHoverReset(canvas) {
  if (!canvas) return null;
  const handler = () => resetStatisticalChartHover();
  const events = ['mouseleave', 'pointerleave', 'touchend', 'touchcancel'];
  events.forEach(evt => canvas.addEventListener(evt, handler));
  return () => {
    events.forEach(evt => canvas.removeEventListener(evt, handler));
  };
}

// Prepare statistical chart data
function prepareStatisticalChartData(data) {
  const datasets = [];
  const colors = ['#2c41ff', '#0984e3', '#fd9644', '#20bf6b', '#eb3b5a'];
  const statisticalTypes = ['mean', 'percentile_10', 'percentile_90', 'min', 'max'];
  
  statisticalTypes.forEach((type, index) => {
    const typeData = [];
    
    if (data.statistics) {
      Object.keys(data.statistics).forEach(state => {
        if (data.statistics[state] && data.statistics[state][type] !== undefined) {
          typeData.push({
            x: data.statistics[state][type],
            y: state
          });
        }
      });
    }
    
    datasets.push({
      label: type.replace('_', ' ').toUpperCase(),
      data: typeData,
      backgroundColor: colors[index],
      borderColor: colors[index],
      pointRadius: 8,
      pointHoverRadius: 10
    });
  });
  
  return {
    datasets: datasets
  };
}

// Prepare new statistical chart data with states and counties
function prepareNewStatisticalChartData(data) {
  comparisonLog('=== DATA PREPARATION DEBUG ===');
  comparisonLog('Input data for preparation:', data);
  comparisonLog('Selected states:', selectedStates);
  comparisonLog('Selected counties:', selectedCounties);
  
  const datasets = [];
  
  // First, create range bars (grey bars showing min-max range)
  const rangeBarData = [];
  
  // Statistical types for the dots with different shapes
  const statisticalTypes = [
    { key: 'min', label: 'Minimum', color: '#20bf6b', symbol: 'triangle' },
    { key: 'percentile_10', label: '10th Percentile', color: '#f7b731', symbol: 'rect' },
    { key: 'mean', label: 'Mean', color: '#2c41ff', symbol: 'circle' },
    { key: 'percentile_90', label: '90th Percentile', color: '#eb3b5a', symbol: 'rectRot' },
    { key: 'max', label: 'Maximum', color: '#fd9644', symbol: 'triangle' }
  ];
  
  // Create y-axis labels with proper spacing structure
  const yLabels = [];
  const allEntities = [];
  
  // Group counties by state
  const countiesByState = {};
  if (selectedCounties && selectedCounties.length > 0) {
    selectedCounties.forEach(county => {
      if (!countiesByState[county.state]) {
        countiesByState[county.state] = [];
      }
      countiesByState[county.state].push(county);
    });
  }
  
  // Add initial gap only when counties are present (keeps spacing tighter for state-only view)
  const hasCounties = selectedCounties && selectedCounties.length > 0;
  if (hasCounties) {
    yLabels.push('__gap_start'); // Unique gap label
    allEntities.push({ name: '', type: 'start-gap' });
  }
  
  // Add states with their counties with proper spacing
  selectedStates.forEach((state, stateIndex) => {
    // Add state
    yLabels.push(state);
    const stateEntity = { name: state, type: 'state', hasCounties: false };
    allEntities.push(stateEntity);
    
    // Counties are temporarily disabled in the UI; no county rows added.
  });
  
  // Add final gap only when counties are present
  if (hasCounties) {
    yLabels.push('__gap_end'); // Unique gap label
    allEntities.push({ name: '', type: 'end-gap' });
  }

  // Map each label to its numeric index. We'll use the numeric index
  // as the actual Y value for all points so that hover, custom grid
  // drawing, and label rendering are perfectly aligned.
  const yIndexByLabel = {};
  yLabels.forEach((label, index) => {
    if (label && label !== '' && !label.startsWith('__gap')) {
      yIndexByLabel[label] = index;
    }
  });
  
  comparisonLog('=== Y-AXIS LABELS DEBUG ===');
  comparisonLog('Selected states:', selectedStates);
  comparisonLog('Selected counties:', selectedCounties);
  comparisonLog('Counties by state:', countiesByState);
  comparisonLog('Y-axis labels:', yLabels);
  comparisonLog('All entities:', allEntities);
  comparisonLog('Y-axis labels length:', yLabels.length);
  
  // Log each label individually
  yLabels.forEach((label, index) => {
    const entity = allEntities[index];
    comparisonLog(`Label ${index}: "${label}" (Type: ${entity ? entity.type : 'unknown'})`);
  });
  
  comparisonLog('=== END Y-AXIS LABELS DEBUG ===');
  
  // Create datasets for each statistical type
  statisticalTypes.forEach((statType, index) => {
    const typeData = [];
    comparisonLog(`Processing statistical type: ${statType.key}`);
    
    if (data.statistics) {
      comparisonLog('Statistics data available:', data.statistics);
      
      // Add state data
      selectedStates.forEach(state => {
        comparisonLog(`Processing state: ${state}`);
        comparisonLog(`State data:`, data.statistics[state]);
        if (data.statistics[state] && data.statistics[state][statType.key] !== undefined) {
          const yIndex = yIndexByLabel[state];
          if (typeof yIndex !== 'number') {
            comparisonWarn('No Y index found for state label:', state);
            return;
          }
          const pointData = {
            x: data.statistics[state][statType.key],
            // Use numeric index for Y so everything stays in sync
            y: yIndex,
            entity: state,
            type: statType.label,
            entityType: 'state',
            meta: data.statistics[state]
          };
          comparisonLog(`Adding point for ${state}:`, pointData);
          typeData.push(pointData);
        } else {
          comparisonLog(`No data for ${state} - ${statType.key}`);
        }
      });
      
      // Add county data if available
      if (selectedCounties.length > 0 && data.countyStatistics) {
        selectedCounties.forEach(county => {
          const countyKey = county.fullName;
          comparisonLog(`Processing county: ${countyKey}`);
          comparisonLog(`County data:`, data.countyStatistics[countyKey]);
          if (data.countyStatistics[countyKey] && data.countyStatistics[countyKey][statType.key] !== undefined) {
            const yIndex = yIndexByLabel[countyKey];
            if (typeof yIndex !== 'number') {
              // If we don't have a row for this county, skip plotting it
              comparisonWarn('No Y index found for county label:', countyKey);
              return;
            }
            const pointData = {
              x: data.countyStatistics[countyKey][statType.key],
              y: yIndex,
              entity: countyKey,
              type: statType.label,
              entityType: 'county'
            };
            comparisonLog(`Adding point for ${countyKey}:`, pointData);
            typeData.push(pointData);
          } else {
            comparisonLog(`No data for ${countyKey} - ${statType.key}`);
          }
        });
      }
    } else {
      comparisonLog('No statistics data available');
    }
    
    comparisonLog(`Dataset for ${statType.label}:`, typeData);
    datasets.push({
      label: statType.label,
      data: typeData,
      backgroundColor: statType.color,
      borderColor: statType.color,
      pointRadius: 5,
      pointHoverRadius: 7,
      pointStyle: statType.symbol,
      borderWidth: 2,
      rotation: statType.key === 'max' ? 180 : 0 // Rotate max triangle upside down
    });
  });
  
  comparisonLog('Final datasets:', datasets);
  comparisonLog('Final yLabels:', yLabels);
  
  return {
    datasets: datasets,
    yLabels: yLabels,
    allEntities: allEntities
  };
}

// Update selected states display
function updateSelectedStatesDisplay() {
  const display = document.getElementById('selectedStatesDisplay');
  if (!display) return;
  
  if (selectedStates.length === 0) {
    display.innerHTML = '<div class="no-states">No states selected</div>';
    return;
  }
  
  display.innerHTML = selectedStates.map(state => 
    `<span class="state-tag">${state}</span>`
  ).join('');
}

// County functionality
function showCountyControls() {
  const countyControls = document.getElementById('countyControls');
  const addCountyBtn = document.getElementById('addCountyBtn');
  
  if (countyControls) {
    countyControls.style.display = 'none';
  }
  
  if (addCountyBtn) {
    addCountyBtn.disabled = true;
  }
  
  // Don't auto-load counties - let user add them manually if needed
  // loadDefaultCounties(); // Removed auto-loading
}

async function loadDefaultCounties() {
  try {
    const mainCategory = document.getElementById('mainCategorySelect').value;
    const subcategory = document.getElementById('subcategorySelect').value;
    const metric = document.getElementById('metricSelect').value;
    
    comparisonLog('=== LOADING DEFAULT COUNTIES ===');
    comparisonLog('Main category:', mainCategory);
    comparisonLog('Subcategory:', subcategory);
    comparisonLog('Metric:', metric);
    comparisonLog('Selected states:', selectedStates);
    
    if (!mainCategory || !subcategory || !metric) {
      comparisonLog('Missing required selections, skipping county loading');
      return;
    }
    
    const response = await fetch('/comparison/api/best-counties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        states: selectedStates,
        category: mainCategory,
        subcategory: subcategory,
        metric: metric,
        maxCounties: 3
      })
    });
    
    const data = await response.json();
    comparisonLog('Best counties data:', data);
    
    if (data.bestCounties && data.bestCounties.length > 0) {
      // Select 3 counties from each state by default
      selectedCounties = [];
      const countiesByState = {};
      
      // Group counties by state
      data.bestCounties.forEach(county => {
        if (!countiesByState[county.state]) {
          countiesByState[county.state] = [];
        }
        countiesByState[county.state].push(county);
      });
      
      comparisonLog('Counties grouped by state:', countiesByState);
      
      // Select up to 3 counties from each state
      selectedStates.forEach(state => {
        if (countiesByState[state]) {
          const stateCounties = countiesByState[state].slice(0, 3);
          comparisonLog(`Selecting ${stateCounties.length} counties for ${state}:`, stateCounties);
          stateCounties.forEach(county => {
            selectedCounties.push({
              name: county.county,
              state: county.state,
              fullName: `${county.county}, ${county.state}`
            });
          });
        } else {
          comparisonWarn(`No counties found for state: ${state}`);
        }
      });
      
      comparisonLog('Final selected counties after loading:', selectedCounties);
      comparisonLog('Total counties selected:', selectedCounties.length);
      
      comparisonLog('Final selected counties:', selectedCounties);
      updateSelectedCountiesDisplay();
      generateStatisticalChart();
    }
  } catch (error) {
    // Error handling without console logging
  }
}

function openCountyModal() {
  const countyModal = document.getElementById('countyModal');
  if (countyModal) {
    countyModal.style.display = 'flex';
    countyModalOpen = true;
    loadAvailableCounties();
  }
}

function closeCountyModalHandler() {
  const countyModal = document.getElementById('countyModal');
  if (countyModal) {
    countyModal.style.display = 'none';
    countyModalOpen = false;
  }
}

async function loadAvailableCounties() {
  try {
    const response = await fetch('/comparison/api/counties', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        states: selectedStates
      })
    });
    
    const data = await response.json();
    availableCounties = data.counties || [];
    
    renderCountyList();
  } catch (error) {
    availableCounties = [];
    renderCountyList();
  }
}

function renderCountyList() {
  const countyList = document.getElementById('countyList');
  if (!countyList) return;
  
  countyList.innerHTML = '';
  
  // Group counties by state
  const countiesByState = {};
  availableCounties.forEach(county => {
    if (!countiesByState[county.state]) {
      countiesByState[county.state] = [];
    }
    countiesByState[county.state].push(county);
  });
  
  // Render counties grouped by state
  Object.keys(countiesByState).forEach(state => {
    const stateGroup = document.createElement('div');
    stateGroup.className = 'county-state-group collapsed';

    const stateHeader = document.createElement('div');
    stateHeader.className = 'county-state-header';
    stateHeader.innerHTML = `
      <button type="button" class="toggle-btn" aria-label="Toggle ${state} counties">+</button>
      <strong>${state}</strong> (${countiesByState[state].length} counties)
    `;
    stateHeader.style.padding = '12px 16px';
    stateHeader.style.backgroundColor = '#f8f9fa';
    stateHeader.style.fontWeight = 'bold';
    stateHeader.style.borderBottom = '1px solid #e0e0e0';
    stateGroup.appendChild(stateHeader);

    const countiesContainer = document.createElement('div');
    countiesContainer.className = 'county-state-body';
    countiesContainer.style.display = 'none';

    countiesByState[state].forEach(county => {
      const countyItem = document.createElement('div');
      countyItem.className = 'county-item';
      countyItem.dataset.county = county.name;
      countyItem.dataset.state = county.state;
      
      const isSelected = selectedCounties.some(selected => 
        selected.name === county.name && selected.state === county.state
      );
      
      if (isSelected) {
        countyItem.classList.add('selected');
      }
      
      countyItem.innerHTML = `
        <div class="county-checkbox">${isSelected ? '✓' : ''}</div>
        <div class="county-info">
          <div class="county-name">${county.name}</div>
          <div class="county-state">${county.state}</div>
        </div>
      `;
      
      countyItem.addEventListener('click', () => toggleCountySelection(county));
      countiesContainer.appendChild(countyItem);
    });

    stateGroup.appendChild(countiesContainer);
    countyList.appendChild(stateGroup);

    stateHeader.addEventListener('click', () => {
      const isCollapsed = stateGroup.classList.contains('collapsed');
      stateGroup.classList.toggle('collapsed', !isCollapsed);
      stateGroup.classList.toggle('expanded', isCollapsed);
      countiesContainer.style.display = isCollapsed ? 'block' : 'none';
      const toggleBtn = stateHeader.querySelector('.toggle-btn');
      if (toggleBtn) {
        toggleBtn.textContent = isCollapsed ? '−' : '+';
      }
    });
  });
  
  updateCountyCount();
}

function toggleCountySelection(county) {
  const countyItem = document.querySelector(`[data-county="${county.name}"][data-state="${county.state}"]`);
  if (!countyItem) return;
  
  const isSelected = countyItem.classList.contains('selected');
  
  if (isSelected) {
    // Remove county
    selectedCounties = selectedCounties.filter(selected => 
      !(selected.name === county.name && selected.state === county.state)
    );
    countyItem.classList.remove('selected');
    countyItem.querySelector('.county-checkbox').textContent = '';
  } else {
    // Check if we can add more counties for this state
    const stateCount = selectedCounties.filter(selected => selected.state === county.state).length;
    if (stateCount >= 3) {
      alert(`You can only select up to 3 counties per state. ${county.state} already has ${stateCount} counties selected.`);
      return;
    }
    
    // Add county
    selectedCounties.push({
      name: county.name,
      state: county.state,
      fullName: `${county.name}, ${county.state}`
    });
    countyItem.classList.add('selected');
    countyItem.querySelector('.county-checkbox').textContent = '✓';
  }
  
  updateCountyCount();
}

function updateCountyCount() {
  const countyCount = document.getElementById('countyCount');
  if (countyCount) {
    countyCount.textContent = selectedCounties.length;
  }
}

function filterCounties() {
  const searchTerm = document.getElementById('countySearch').value.toLowerCase();
  const countyItems = document.querySelectorAll('.county-item');
  
  countyItems.forEach(item => {
    const countyName = item.querySelector('.county-name').textContent.toLowerCase();
    const countyState = item.querySelector('.county-state').textContent.toLowerCase();
    
    if (countyName.includes(searchTerm) || countyState.includes(searchTerm)) {
      item.style.display = 'flex';
    } else {
      item.style.display = 'none';
    }
  });
}

function confirmCountySelectionHandler() {
  updateSelectedCountiesDisplay();
  closeCountyModalHandler();
  generateStatisticalChart();
}

function updateSelectedCountiesDisplay() {
  const selectedCountiesContainer = document.getElementById('selectedCounties');
  if (!selectedCountiesContainer) return;
  
  selectedCountiesContainer.innerHTML = '';
  
  if (selectedCounties.length === 0) {
    selectedCountiesContainer.innerHTML = '<div class="placeholder">No counties selected</div>';
    return;
  }
  
  selectedCounties.forEach(county => {
    const countyTag = document.createElement('div');
    countyTag.className = 'selected-county';
    countyTag.innerHTML = `
      <span>${county.fullName}</span>
      <button type="button" class="remove-county" onclick="removeCounty('${county.name}', '${county.state}')">
        <i class="fas fa-times"></i>
      </button>
    `;
    selectedCountiesContainer.appendChild(countyTag);
  });
}

function removeCounty(countyName, stateName) {
  selectedCounties = selectedCounties.filter(county => 
    !(county.name === countyName && county.state === stateName)
  );
  updateSelectedCountiesDisplay();
  generateStatisticalChart();
}

// Adjust chart size based on number of entities
function adjustChartSize() {
  const chartContainer = document.querySelector('.chart-container-full');
  if (!chartContainer) {
    return;
  }
  
  // Calculate height based on actual Y-axis labels
  const yLabelsCount = currentChartData && currentChartData.yLabels ? currentChartData.yLabels.length : 0;
  
  // Same calculation as in createStatisticalChart
  const entityHeight = 50; // Comfortable spacing per state/county
  const topPadding = 140; // Space for title and legend at top
  const bottomPadding = 150; // Space at bottom for x-axis label
  
  // Only add extra spacing when counties are shown (state gaps)
  const stateCount = selectedStates.length;
  const hasCountySpacing = selectedCounties && selectedCounties.length > 0;
  const xAxisSpacing = hasCountySpacing ? Math.max(0, (stateCount - 1) * 30) : 0;
  
  const calculatedChartHeight = (yLabelsCount * entityHeight) + topPadding + bottomPadding + xAxisSpacing;
  const finalChartHeight = Math.max(500, calculatedChartHeight);
  
  comparisonLog('=== CHART SIZING DEBUG ===');
  comparisonLog(`States: ${selectedStates.length}, Counties: ${selectedCounties.length}`);
  comparisonLog(`Y-axis labels count: ${yLabelsCount}`);
  comparisonLog(`Final chart height: ${finalChartHeight}px (${yLabelsCount} entities × ${entityHeight}px + ${topPadding + bottomPadding}px padding)`);
  
  // Set DYNAMIC container height - grows with content
  chartContainer.style.height = `${finalChartHeight}px`;
  chartContainer.style.minHeight = `${finalChartHeight}px`;
  chartContainer.style.maxHeight = 'none';
  chartContainer.style.overflow = 'visible';
  
  // Update canvas size to match container
  const canvas = document.getElementById('statisticalChart');
  if (canvas) {
    canvas.style.height = `${finalChartHeight}px`;
    canvas.style.width = '100%';
    canvas.style.minHeight = `${finalChartHeight}px`;
    
    comparisonLog(`Canvas and container set to: ${finalChartHeight}px - All ${yLabelsCount} entities will be visible`);
    
    // Force chart resize after a short delay
    setTimeout(() => {
      if (statisticalChart && statisticalChart.resize) {
        comparisonLog('Resizing chart...');
        statisticalChart.resize();
      }
    }, 200);
  }
  
  comparisonLog('=== END CHART SIZING DEBUG ===');
}

// Zoom controls removed

// Apply custom styling to Y-axis labels using DOM manipulation
function applyCustomYAxisStyling() {
  comparisonLog('=== APPLYING CUSTOM Y-AXIS STYLING ===');
  
  if (!statisticalChart) {
    return;
  }
  
  comparisonLog('Statistical chart found, applying styling...');
  
  // Wait for chart to fully render
  setTimeout(() => {
    const chartContainer = document.querySelector('.chart-container-full');
    if (!chartContainer) {
      return;
    }
    
    comparisonLog('Chart container found, looking for Y-axis labels...');
    
    // Find all Y-axis labels
    const yAxisLabels = chartContainer.querySelectorAll('text');
    comparisonLog(`Found ${yAxisLabels.length} text elements in chart container`);
    
    yAxisLabels.forEach((label, index) => {
      const labelText = label.textContent || label.innerText;
      comparisonLog(`Text element ${index}: "${labelText}"`);
      
      if (!labelText || labelText === '') return; // Skip empty labels (spacers)
      
      // Check if this is a county by comparing with selected counties
      const isCounty = selectedCounties.some(county => {
        const countyName = county.name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        const countyFullName = county.fullName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
        return labelText === countyName || 
               labelText === countyFullName ||
               labelText.toLowerCase() === county.name.toLowerCase() ||
               labelText.toLowerCase() === county.fullName.toLowerCase();
      });
      
      comparisonLog(`Label "${labelText}" is county: ${isCounty}`);
      
      if (isCounty) {
        // Style county labels (smaller, lighter, not bold)
        label.style.fontSize = '11px';
        label.style.fontWeight = 'normal';
        label.style.fill = '#666'; // Dark gray
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.marginLeft = '15px'; // Indent counties
        comparisonLog(`Styled county label: "${labelText}"`);
      } else {
        // Style state labels (bold, larger, dark)
        label.style.fontSize = '14px';
        label.style.fontWeight = 'bold';
        label.style.fill = '#000'; // Very dark black
        label.style.fontFamily = 'Arial, sans-serif';
        label.style.marginLeft = '0px'; // No indent for states
        comparisonLog(`Styled state label: "${labelText}"`);
      }
    });
    
    comparisonLog('=== END CUSTOM Y-AXIS STYLING ===');
  }, 100);
}

// Add scroll indicator to show users they can scroll
function addScrollIndicator() {
  const chartContainer = document.querySelector('.chart-container-full');
  if (!chartContainer) return;
  
  // Remove existing indicator if present
  const existingIndicator = chartContainer.querySelector('.scroll-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Check if content is scrollable
  const isScrollable = chartContainer.scrollHeight > chartContainer.clientHeight;
  
  if (isScrollable) {
    // Create scroll indicator
    const scrollIndicator = document.createElement('div');
    scrollIndicator.className = 'scroll-indicator';
    scrollIndicator.innerHTML = '<i class="fas fa-chevron-down"></i> Scroll to see more';
    chartContainer.appendChild(scrollIndicator);
    
    // Hide indicator when user scrolls
    chartContainer.addEventListener('scroll', () => {
      const scrollPercentage = (chartContainer.scrollTop / (chartContainer.scrollHeight - chartContainer.clientHeight)) * 100;
      if (scrollPercentage > 10) {
        scrollIndicator.style.opacity = '0';
      } else {
        scrollIndicator.style.opacity = '1';
      }
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      scrollIndicator.style.opacity = '0';
    }, 3000);
  }
}