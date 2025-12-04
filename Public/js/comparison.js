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

const COMPARISON_DEBUG = false;
const comparisonLog = (...args) => {
  if (COMPARISON_DEBUG) {
    console.log(...args);
  }
};
const comparisonWarn = (...args) => {
  if (COMPARISON_DEBUG) {
    console.warn(...args);
  }
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

function getMetricGroup(metricName = '') {
  if (!metricName) return 'Travel Times';
  const normalized = metricName.toLowerCase();
  if (normalized.includes('percent access')) return 'Access';
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
  if (normalized.includes('vehicle')) return 'Vehicle Times';
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
    console.error('Error initializing comparison app:', error);
  }
});

// Load available states
async function loadStates() {
  try {
    const response = await fetch('/comparison/api/states');
    availableStates = await response.json();
  } catch (error) {
    console.error('Error loading states:', error);
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
    populateSubcategories('transit');
    
    // Show subcategory dropdown after main category is selected
    setTimeout(() => {
      if (subcategorySelect) {
        subcategorySelect.disabled = false;
        subcategorySelect.style.display = 'block';
        
        // Set default subcategory and populate metrics
        subcategorySelect.value = 'frequencies';
        populateMetrics('transit', 'frequencies');
        
        // Show metric dropdown after subcategory is selected
        setTimeout(() => {
          if (metricSelect) {
            metricSelect.disabled = false;
            metricSelect.style.display = 'block';
            
            // Set first metric and generate chart
            setTimeout(() => {
              const firstMetric = metricSelect.querySelector('option:not([value=""])');
              if (firstMetric) {
                metricSelect.value = firstMetric.value;
                    applyMetricSelectStyles();
                
                // Only generate chart if we have states selected
                if (selectedStates.length > 0) {
                  generateStatisticalChart();
                }
              }
            }, 100);
          }
        }, 100);
      }
    }, 100);
  }
}

// Populate subcategories based on main category  
async function populateSubcategories(category) {
  const subcategorySelect = document.getElementById('subcategorySelect');
  if (!subcategorySelect) return;
  
  subcategorySelect.innerHTML = '<option value="">Loading...</option>';
  
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
      // Use the actual equity categories from the data
      data.equity.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.category;
        option.textContent = cat.category;
        subcategorySelect.appendChild(option);
      });
    } else if (category === 'transit' && data.transit) {
      // Use the actual transit collection names from the data
      data.transit.forEach(cat => {
        const option = document.createElement('option');
        const displayName = cat.displayCategory || cat.category;
        option.value = cat.category;
        option.textContent = displayName;
        option.dataset.displayName = displayName;
        subcategorySelect.appendChild(option);
      });
    }
    
    if (subcategorySelect.children.length === 1) {
      subcategorySelect.innerHTML = '<option value="">No categories available</option>';
    }
    
  } catch (error) {
    console.error('Error loading subcategories:', error);
    subcategorySelect.innerHTML = '<option value="">Error loading categories</option>';
  }
}

// Populate metrics based on category and subcategory
async function populateMetrics(category, subcategory) {
  const metricSelect = document.getElementById('metricSelect');
  if (!metricSelect) return;
  
  metricSelect.innerHTML = '<option value="">Loading metrics...</option>';
  
  try {
    // Fetch metrics from the comparison-dotplot API
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
    metricSelect.innerHTML = '<option value="">Select metric...</option>';
    
    if (category === 'equity' && data.equity) {
      // Find the matching equity category by exact name
      const equityCategory = data.equity.find(cat => cat.category === subcategory);
      
      if (equityCategory && equityCategory.metrics) {
        equityCategory.metrics.forEach(metric => {
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
      // Find the matching transit category by exact name
      const transitCategory = data.transit.find(cat => cat.category === subcategory);
      
      if (transitCategory && transitCategory.metrics) {
        const groupedMetrics = {};
        transitCategory.metrics.forEach(metric => {
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
          optgroup.label = group;
          optgroup.dataset.color = METRIC_GROUP_COLORS[group] || DEFAULT_METRIC_COLOR;
          
          metricsInGroup.forEach(metric => {
            const option = document.createElement('option');
            const displayName = metric.legend || metric.originalLegend;
            option.value = metric.originalLegend || metric.legend;
            option.textContent = displayName;
            option.dataset.displayName = displayName;
            option.dataset.group = group;
            option.dataset.color = METRIC_GROUP_COLORS[group] || DEFAULT_METRIC_COLOR;
            optgroup.appendChild(option);
          });
          
          metricSelect.appendChild(optgroup);
        });
      }
    }
    
    const availableOptions = metricSelect.querySelectorAll('option');
    if (availableOptions.length <= 1) {
      metricSelect.innerHTML = '<option value="">No metrics available</option>';
    } else {
      applyMetricSelectStyles();
    }
    
  } catch (error) {
    console.error('Error loading metrics:', error);
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
        counties: selectedCounties.map(county => county.fullName)
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    comparisonLog('Statistical data received:', data);
    
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
      console.error('No statistical data received');
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
    console.error('Error fetching statistical data:', error);
  }
}

// County functionality removed - focusing on states only

// Create statistical chart
function createStatisticalChart(data) {
  comparisonLog('=== CHART CREATION DEBUG ===');
  comparisonLog('Input data for chart creation:', data);
  
  const canvas = document.getElementById('statisticalChart');
  const placeholder = document.getElementById('chartPlaceholder');
  const accentColor = data.metricColor || DEFAULT_METRIC_COLOR;
  
  if (!canvas) {
    console.error('Chart canvas not found');
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
    console.error('Invalid chart data - no datasets found');
    return;
  }
  
  if (!chartData.yLabels || chartData.yLabels.length === 0) {
    console.error('Invalid chart data - no Y-axis labels found');
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
  
  // Calculate proper height: 60px per entity + generous padding for legends/titles
  // This ensures all states show without being too cramped or enlarged
  const entityHeight = 60; // Comfortable spacing per state/county
  const topPadding = 150; // Space for title and legend at top
  const bottomPadding = 100; // Space at bottom
  
  // Add extra space for x-axis labels after each state (except last one which uses chart's x-axis)
  const stateCount = selectedStates.length;
  const xAxisSpacing = Math.max(0, (stateCount - 1) * 30); // Additional space for x-axis labels
  
  const calculatedChartHeight = (yLabelsCount * entityHeight) + topPadding + bottomPadding + xAxisSpacing;
  
  // Minimum height to prevent tiny charts, but let it grow as needed
  const finalChartHeight = Math.max(500, calculatedChartHeight);
  
  comparisonLog(`Y-axis labels count: ${yLabelsCount}`);
  comparisonLog(`Calculated chart height: ${finalChartHeight}px (${yLabelsCount} entities × ${entityHeight}px + ${topPadding + bottomPadding}px padding)`);
  
  // Set DYNAMIC container height - grows with content but with proper spacing
  const chartContainer = document.querySelector('.chart-container-full');
  
  if (chartContainer) {
    // Container grows to fit all content - no scrollbar needed, all states visible
    chartContainer.style.height = `${finalChartHeight}px`;
    chartContainer.style.minHeight = `${finalChartHeight}px`;
    chartContainer.style.maxHeight = 'none';
    chartContainer.style.overflow = 'visible';
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
          if (!label || label === '') return; // Skip empty labels (spacers)
          
          // Get all x values for this y position
          const yPixel = yAxis.getPixelForValue(index);
          let minValue = Infinity;
          let maxValue = -Infinity;
          
          chart.data.datasets.forEach(dataset => {
            const point = dataset.data.find(d => d.y === label);
            if (point && point.x !== undefined) {
              minValue = Math.min(minValue, point.x);
              maxValue = Math.max(maxValue, point.x);
            }
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
          const yPixel = yAxis.getPixelForValue(gapIndex);
          
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
            const tickX = xAxis.getPixelForValue(tickValue);
            
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
  statisticalChart = new Chart(canvas, {
    type: 'scatter',
    data: {
      datasets: chartData.datasets
    },
    plugins: [rangeBarPlugin],
    options: {
      responsive: true,
      maintainAspectRatio: false,
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
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          titleColor: '#1a1a1a',
          bodyColor: '#4a4a4a',
          borderColor: '#e0e0e0',
          borderWidth: 1,
          padding: 12,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
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
              return `${type}: ${value.toFixed(3)}`;
            }
          }
        },
      },
      scales: {
        x: {
          type: 'linear',
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
              return value.toFixed(2);
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
          min: function(context) {
            const values = context.chart.data.datasets.flatMap(dataset => dataset.data.map(point => point.x));
            const min = Math.min(...values);
            const range = Math.max(...values) - min;
            return min - (range * 0.05);
          },
          max: function(context) {
            const values = context.chart.data.datasets.flatMap(dataset => dataset.data.map(point => point.x));
            const max = Math.max(...values);
            const range = max - Math.min(...values);
            return max + (range * 0.05);
          }
        },
        y: {
          type: 'category',
          position: 'left',
          title: {
            display: false
          },
          labels: chartData.yLabels,
          offset: true,
          display: true,
          afterBuildTicks: function(scale) {
            comparisonLog('=== afterBuildTicks called ===');
            comparisonLog('Current chart data available:', currentChartData !== null);
            if (currentChartData && currentChartData.yLabels) {
              comparisonLog('Building Y-axis ticks with', currentChartData.yLabels.length, 'labels');
              scale.ticks = currentChartData.yLabels.map((label, index) => ({
                value: index,
                label: label
              }));
              comparisonLog('Set', scale.ticks.length, 'ticks');
            } else {
              console.error('No chart data available for Y-axis ticks');
            }
          },
          ticks: {
            padding: 10,
            font: function(context) {
              const index = context.index;
              const entity = currentChartData && currentChartData.allEntities ? currentChartData.allEntities[index] : null;
              
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
              const index = context.index;
              const entity = currentChartData && currentChartData.allEntities ? currentChartData.allEntities[index] : null;
              
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
              
              const label = currentChartData.yLabels[index];
              const entity = currentChartData.allEntities[index];
              
              if (!label || label === '') {
                return '';
              }
              
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
            color: '#e5e5e5',
            lineWidth: 1,
            drawOnChartArea: true,
            drawTicks: false,
            offset: false
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
          bottom: 20,
          left: 20
        }
      },
      elements: {
        point: {
          radius: 4.5,
          hoverRadius: 6,
          borderWidth: 2,
          borderColor: '#fff',
          hitRadius: 6
        }
      },
      interaction: {
        intersect: false,
        mode: 'nearest'
      }
    }
  });
  
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
    console.error('Error creating chart:', error);
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
  
  // Add initial gap at the start
  yLabels.push(''); // Gap at start
  allEntities.push({ name: '', type: 'start-gap' });
  
  // Add states with their counties with proper spacing
  selectedStates.forEach((state, stateIndex) => {
    // Add state
    yLabels.push(state);
    const stateEntity = { name: state, type: 'state', hasCounties: false };
    allEntities.push(stateEntity);
    
    // Add counties for this state
    if (countiesByState[state] && countiesByState[state].length > 0) {
      // Mark state as having counties
      stateEntity.hasCounties = true;
      
      countiesByState[state].forEach((county, countyIndex) => {
        yLabels.push(county.fullName);
        allEntities.push({ 
          name: county.fullName, 
          type: 'county', 
          state: county.state,
          countyName: county.name 
        });
      });
    }
    
    // Add gap after this state group (except for last state) ONLY if state has counties
    if (stateIndex < selectedStates.length - 1 && stateEntity.hasCounties) {
      yLabels.push(''); // Gap between state groups
      allEntities.push({ name: '', type: 'state-gap' });
    }
  });
  
  // Add final gap at the end
  yLabels.push(''); // Gap at end
  allEntities.push({ name: '', type: 'end-gap' });
  
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
          const pointData = {
            x: data.statistics[state][statType.key],
            y: state,
            entity: state,
            type: statType.label,
            entityType: 'state'
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
            const pointData = {
              x: data.countyStatistics[countyKey][statType.key],
              y: countyKey,
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
    countyControls.style.display = 'block';
  }
  
  if (addCountyBtn) {
    addCountyBtn.disabled = false;
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
    console.error('Error loading default counties:', error);
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
    console.error('Error loading counties:', error);
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
    const stateHeader = document.createElement('div');
    stateHeader.className = 'county-state-header';
    stateHeader.innerHTML = `<strong>${state}</strong> (${countiesByState[state].length} counties)`;
    stateHeader.style.padding = '12px 16px';
    stateHeader.style.backgroundColor = '#f8f9fa';
    stateHeader.style.fontWeight = 'bold';
    stateHeader.style.borderBottom = '1px solid #e0e0e0';
    countyList.appendChild(stateHeader);
    
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
      countyList.appendChild(countyItem);
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
    console.error('Chart container not found!');
    return;
  }
  
  // Calculate height based on actual Y-axis labels
  const yLabelsCount = currentChartData && currentChartData.yLabels ? currentChartData.yLabels.length : 0;
  
  // Same calculation as in createStatisticalChart
  const entityHeight = 60; // Comfortable spacing per state/county
  const topPadding = 150; // Space for title and legend at top
  const bottomPadding = 100; // Space at bottom
  
  // Add extra space for x-axis labels after each state (except last one)
  const stateCount = selectedStates.length;
  const xAxisSpacing = Math.max(0, (stateCount - 1) * 30);
  
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
    console.error('No statistical chart found for styling');
    return;
  }
  
  comparisonLog('Statistical chart found, applying styling...');
  
  // Wait for chart to fully render
  setTimeout(() => {
    const chartContainer = document.querySelector('.chart-container-full');
    if (!chartContainer) {
      console.error('Chart container not found for styling');
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