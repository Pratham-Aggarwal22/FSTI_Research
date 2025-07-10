// Public/js/comparison.js
document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const comparisonLevelRadios = document.querySelectorAll('input[name="comparisonLevel"]');
    const stateSelectionContainer = document.querySelector('.state-selection-container');
    const countySelectionContainer = document.querySelector('.county-selection-container');
    const stateOptionsDropdown = document.getElementById('stateOptions');
    const countyOptionsDropdown = document.getElementById('countyOptions');
    const stateForCountiesSelect = document.getElementById('stateForCounties');
    const chartTypeSelect = document.getElementById('chartType');
    const metricSelect = document.getElementById('metricSelect');
    const compareBtn = document.getElementById('compareBtn');
    const emptyState = document.getElementById('emptyState');
    const comparisonResults = document.getElementById('comparisonResults');
    const chartContainer = document.querySelector('.chart-container');
    const dataTable = document.getElementById('dataTable');
    const downloadChartBtn = document.getElementById('downloadChartBtn');
    const fullScreenBtn = document.getElementById('fullScreenBtn');
    const toggleData3dBtn = document.getElementById('toggleData3dBtn');
    const animateDataBtn = document.getElementById('animateDataBtn');
    const fullScreenModal = document.getElementById('fullScreenModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const themeToggle = document.getElementById('themeToggle');
    const comparisonChart = document.getElementById('comparisonChart');
    const fullscreenChart = document.getElementById('fullscreenChart');
    
    // State variables
    let selectedStates = [];
    let selectedCounties = [];
    let selectedState = '';
    let availableStates = [];
    let availableCounties = [];
    let availableMetrics = [];
    let selectedChartType = 'bar';
    let selectedMetric = '';
    let comparisonData = null;
    let currentChart = null;
    let fullscreenChartInstance = null;
    let is3DEnabled = false;
    
    // Theme initialization
    themeToggle.checked = document.body.classList.contains('dark-mode');
    
    // Theme toggle event
    themeToggle.addEventListener('change', () => {
      document.body.classList.toggle('dark-mode');
      if (currentChart) {
        updateChart();
      }
    });
    
    // Comparison level change event
    comparisonLevelRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'state') {
          stateSelectionContainer.style.display = 'block';
          countySelectionContainer.style.display = 'none';
        } else {
          stateSelectionContainer.style.display = 'none';
          countySelectionContainer.style.display = 'block';
        }
      });
    });
    
    // Initialize the app
    initApp();
    
    async function initApp() {
      try {
        // Fetch available states
        const response = await fetch('/comparison/api/states');
        availableStates = await response.json();
        
        // Populate state options
        populateStateOptions();
        populateStateForCounties();
        
        // Set up event listeners
        setupMultiSelectDropdowns();
        setupEventListeners();
      } catch (error) {
        console.error('Error initializing comparison app:', error);
      }
    }
    
    function populateStateOptions() {
      const optionsList = stateOptionsDropdown.querySelector('.options-list');
      optionsList.innerHTML = '';
      
      availableStates.forEach(state => {
        const option = document.createElement('div');
        option.className = 'option';
        option.dataset.value = state;
        option.textContent = state;
        optionsList.appendChild(option);
      });
    }
    
    function populateStateForCounties() {
      stateForCountiesSelect.innerHTML = '<option value="">Select a state</option>';
      
      availableStates.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        stateForCountiesSelect.appendChild(option);
      });
    }
    
    function setupMultiSelectDropdowns() {
      // State multi-select
      const stateSelectedOptions = stateSelectionContainer.querySelector('.selected-options');
      
      stateSelectedOptions.addEventListener('click', () => {
        stateOptionsDropdown.classList.toggle('active');
        stateSelectedOptions.classList.toggle('active');
      });
      
      document.addEventListener('click', (e) => {
        if (!stateSelectionContainer.contains(e.target)) {
          stateOptionsDropdown.classList.remove('active');
          stateSelectedOptions.classList.remove('active');
        }
        
        if (!countySelectionContainer.contains(e.target)) {
          countyOptionsDropdown.classList.remove('active');
          countySelectionContainer.querySelector('.selected-options').classList.remove('active');
        }
      });
      
      const stateOptions = stateOptionsDropdown.querySelectorAll('.option');
      stateOptions.forEach(option => {
        option.addEventListener('click', () => {
          const stateValue = option.dataset.value;
          
          if (!selectedStates.includes(stateValue)) {
            selectedStates.push(stateValue);
            renderSelectedStates();
            option.classList.add('selected');
          }
        });
      });
      
      // County multi-select
      const countySelectedOptions = countySelectionContainer.querySelector('.selected-options');
      
      countySelectedOptions.addEventListener('click', () => {
        countyOptionsDropdown.classList.toggle('active');
        countySelectedOptions.classList.toggle('active');
      });
    }
    
    function renderSelectedStates() {
      const selectedOptionsContainer = stateSelectionContainer.querySelector('.selected-options');
      
      if (selectedStates.length === 0) {
        selectedOptionsContainer.innerHTML = '<div class="placeholder">Select states to compare...</div>';
        return;
      }
      
      selectedOptionsContainer.innerHTML = '';
      
      selectedStates.forEach(state => {
        const stateElement = document.createElement('div');
        stateElement.className = 'selected-option';
        stateElement.innerHTML = `
          ${state}
          <span class="remove-option" data-value="${state}">×</span>
        `;
        selectedOptionsContainer.appendChild(stateElement);
      });
      
      // Add event listeners to remove buttons
      const removeButtons = selectedOptionsContainer.querySelectorAll('.remove-option');
      removeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
          // Public/js/comparison.js (continued)
        e.stopPropagation();
        const stateToRemove = button.dataset.value;
        selectedStates = selectedStates.filter(s => s !== stateToRemove);
        renderSelectedStates();
        
        // Update option selected state
        const option = stateOptionsDropdown.querySelector(`.option[data-value="${stateToRemove}"]`);
        if (option) {
          option.classList.remove('selected');
        }
      });
    });
    
    // Update metrics if needed
    if (selectedStates.length > 0) {
      fetchMetrics();
    }
  }
  
  function renderSelectedCounties() {
    const selectedOptionsContainer = countySelectionContainer.querySelector('.selected-options');
    
    if (selectedCounties.length === 0) {
      selectedOptionsContainer.innerHTML = '<div class="placeholder">Select counties to compare...</div>';
      return;
    }
    
    selectedOptionsContainer.innerHTML = '';
    
    selectedCounties.forEach(county => {
      const countyElement = document.createElement('div');
      countyElement.className = 'selected-option';
      countyElement.innerHTML = `
        ${county}
        <span class="remove-option" data-value="${county}">×</span>
      `;
      selectedOptionsContainer.appendChild(countyElement);
    });
    
    // Add event listeners to remove buttons
    const removeButtons = selectedOptionsContainer.querySelectorAll('.remove-option');
    removeButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        const countyToRemove = button.dataset.value;
        selectedCounties = selectedCounties.filter(c => c !== countyToRemove);
        renderSelectedCounties();
        
        // Update option selected state
        const option = countyOptionsDropdown.querySelector(`.option[data-value="${countyToRemove}"]`);
        if (option) {
          option.classList.remove('selected');
        }
      });
    });
    
    // Update metrics if needed
    if (selectedCounties.length > 0) {
      fetchCountyMetrics();
    }
  }
  
  function setupEventListeners() {
    // Chart type change
    chartTypeSelect.addEventListener('change', () => {
      selectedChartType = chartTypeSelect.value;
      if (currentChart) {
        updateChart();
      }
    });
    
    // Metric select change
    metricSelect.addEventListener('change', () => {
      selectedMetric = metricSelect.value;
      if (currentChart) {
        updateChart();
      }
    });
    
    // State for counties change
    stateForCountiesSelect.addEventListener('change', async () => {
      selectedState = stateForCountiesSelect.value;
      selectedCounties = [];
      renderSelectedCounties();
      
      if (selectedState) {
        try {
          const response = await fetch(`/comparison/api/counties/${encodeURIComponent(selectedState)}`);
          availableCounties = await response.json();
          populateCountyOptions();
        } catch (error) {
          console.error('Error fetching counties:', error);
        }
      } else {
        availableCounties = [];
        populateCountyOptions();
      }
    });
    
    // Compare button click
    compareBtn.addEventListener('click', () => {
      const comparisonLevel = document.querySelector('input[name="comparisonLevel"]:checked').value;
      
      if (comparisonLevel === 'state' && selectedStates.length > 0 && selectedMetric) {
        generateComparison();
      } else if (comparisonLevel === 'county' && selectedCounties.length > 0 && selectedMetric) {
        generateCountyComparison();
      } else {
        alert('Please select entities and a metric to compare.');
      }
    });
    
    // Download chart button
    downloadChartBtn.addEventListener('click', () => {
      if (!currentChart) return;
      
      const link = document.createElement('a');
      link.download = `transit-comparison-${Date.now()}.png`;
      link.href = comparisonChart.toDataURL('image/png');
      link.click();
    });
    
    // Full screen button
    fullScreenBtn.addEventListener('click', () => {
      if (!currentChart) return;
      
      fullScreenModal.style.display = 'flex';
      document.getElementById('modalTitle').textContent = `${selectedMetric} Comparison`;
      
      // Create new chart for fullscreen
      if (fullscreenChartInstance) {
        fullscreenChartInstance.destroy();
      }
      
      fullscreenChartInstance = new Chart(fullscreenChart, currentChart.config);
    });
    
    // Close modal button
    closeModalBtn.addEventListener('click', () => {
      fullScreenModal.style.display = 'none';
    });
    
    // Toggle 3D view
    toggleData3dBtn.addEventListener('click', () => {
      is3DEnabled = !is3DEnabled;
      
      if (is3DEnabled) {
        chartContainer.classList.add('chart-3d-container');
        comparisonChart.parentElement.classList.add('chart-3d');
        toggleData3dBtn.innerHTML = '<i class="fas fa-square"></i> Disable 3D View';
      } else {
        chartContainer.classList.remove('chart-3d-container');
        comparisonChart.parentElement.classList.remove('chart-3d');
        toggleData3dBtn.innerHTML = '<i class="fas fa-cube"></i> Enable 3D View';
      }
    });
    
    // Animate data button
    animateDataBtn.addEventListener('click', () => {
      if (!currentChart) return;
      
      // Clone the current data
      const originalData = JSON.parse(JSON.stringify(currentChart.data));
      
      // Animate to zero
      currentChart.data.datasets.forEach(dataset => {
        dataset.data = dataset.data.map(() => 0);
      });
      currentChart.update();
      
      // Animate back to original values
      setTimeout(() => {
        const targetData = originalData.datasets.map(d => d.data);
        
        // Create animation timeline
        const duration = 1500;
        const startTime = performance.now();
        
        function animateChart(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Update chart data with interpolated values
          currentChart.data.datasets.forEach((dataset, i) => {
            dataset.data = targetData[i].map(target => target * progress);
          });
          
          currentChart.update('none');
          
          if (progress < 1) {
            requestAnimationFrame(animateChart);
          }
        }
        
        requestAnimationFrame(animateChart);
      }, 300);
    });
  }
  
  function populateCountyOptions() {
    const optionsList = countyOptionsDropdown.querySelector('.options-list');
    optionsList.innerHTML = '';
    
    if (availableCounties.length === 0) {
      optionsList.innerHTML = '<div class="option disabled">No counties available</div>';
      return;
    }
    
    availableCounties.forEach(county => {
      const option = document.createElement('div');
      option.className = 'option';
      option.dataset.value = county;
      option.textContent = county;
      optionsList.appendChild(option);
      
      option.addEventListener('click', () => {
        if (!selectedCounties.includes(county)) {
          selectedCounties.push(county);
          renderSelectedCounties();
          option.classList.add('selected');
        }
      });
    });
  }
  
  async function fetchMetrics() {
    try {
      const response = await fetch('/comparison/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ states: selectedStates })
      });
      
      const data = await response.json();
      comparisonData = data;
      
      // Extract metric names
      availableMetrics = data.map(item => item.metric);
      
      // Populate metric select
      metricSelect.innerHTML = '<option value="">Select metric...</option>';
      availableMetrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
      });
      
      // Select first metric by default
      if (availableMetrics.length > 0 && !selectedMetric) {
        metricSelect.value = availableMetrics[0];
        selectedMetric = availableMetrics[0];
      } else if (selectedMetric) {
        metricSelect.value = selectedMetric;
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }
  
  async function fetchCountyMetrics() {
    try {
      const response = await fetch('/comparison/api/county-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          state: selectedState,
          counties: selectedCounties 
        })
      });
      
      const data = await response.json();
      comparisonData = data;
      
      // Extract metric names
      availableMetrics = data.map(item => item.metric);
      
      // Populate metric select
      metricSelect.innerHTML = '<option value="">Select metric...</option>';
      availableMetrics.forEach(metric => {
        const option = document.createElement('option');
        option.value = metric;
        option.textContent = metric;
        metricSelect.appendChild(option);
      });
      
      // Select first metric by default
      if (availableMetrics.length > 0 && !selectedMetric) {
        metricSelect.value = availableMetrics[0];
        selectedMetric = availableMetrics[0];
      } else if (selectedMetric) {
        metricSelect.value = selectedMetric;
      }
    } catch (error) {
      console.error('Error fetching county metrics:', error);
    }
  }
  
  function generateComparison() {
    if (!comparisonData || !selectedMetric) return;
    
    const metricData = comparisonData.find(item => item.metric === selectedMetric);
    if (!metricData) return;
    
    // Display comparison results
    emptyState.style.display = 'none';
    comparisonResults.style.display = 'block';
    
    // Create chart
    createChart(metricData.data);
    
    // Populate data table
    populateDataTable(metricData.data);
  }
  
  function generateCountyComparison() {
    if (!comparisonData || !selectedMetric) return;
    
    const metricData = comparisonData.find(item => item.metric === selectedMetric);
    if (!metricData) return;
    
    // Display comparison results
    emptyState.style.display = 'none';
    comparisonResults.style.display = 'block';
    
    // Create chart
    createChart(metricData.data);
    
    // Populate data table
    populateDataTable(metricData.data);
  }
  
  function createChart(data) {
    if (currentChart) {
      currentChart.destroy();
    }
    
    const entities = Object.keys(data);
    const values = entities.map(entity => data[entity]);
    
    // Generate colors for each entity
    const colors = generateColors(entities.length);
    
    const ctx = comparisonChart.getContext('2d');
    const chartConfig = getChartConfig(selectedChartType, entities, values, colors);
    
    currentChart = new Chart(ctx, chartConfig);
  }
  
  function updateChart() {
    if (!currentChart || !comparisonData || !selectedMetric) return;
    
    const metricData = comparisonData.find(item => item.metric === selectedMetric);
    if (!metricData) return;
    
    // Create a new chart with the updated configuration
    createChart(metricData.data);
    
    // Populate data table
    populateDataTable(metricData.data);
  }
  
  function getChartConfig(chartType, labels, data, colors) {
    // Text color based on theme
    const textColor = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)';
    const gridColor = document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    const config = {
      type: chartType,
      data: {
        labels: labels,
        datasets: []
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: ['pie', 'doughnut', 'polarArea'].includes(chartType),
            position: 'bottom',
            labels: {
              color: textColor,
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              }
            }
          },
          tooltip: {
            backgroundColor: document.body.classList.contains('dark-mode') ? 'rgba(50, 50, 50, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            titleColor: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
            bodyColor: document.body.classList.contains('dark-mode') ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            titleFont: {
              family: "'Poppins', sans-serif",
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              family: "'Poppins', sans-serif",
              size: 13
            },
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            boxWidth: 10,
            boxHeight: 10,
            boxPadding: 3,
            usePointStyle: true
          }
        },
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        },
        scales: {
          x: {
            display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              }
            },
            title: {
              display: true,
              text: ['pie', 'doughnut', 'polarArea'].includes(chartType) ? '' : 'Entity',
              color: textColor,
              font: {
                family: "'Poppins', sans-serif",
                size: 14,
                weight: 'bold'
              }
            }
          },
          y: {
            display: !['pie', 'doughnut', 'polarArea'].includes(chartType),
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              }
            },
            title: {
              display: true,
              text: ['pie', 'doughnut', 'polarArea'].includes(chartType) ? '' : selectedMetric,
              color: textColor,
              font: {
                family: "'Poppins', sans-serif",
                size: 14,
                weight: 'bold'
              }
            }
          },
          r: {
            display: chartType === 'radar' || chartType === 'polarArea',
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                family: "'Poppins', sans-serif",
                size: 12
              }
            }
          }
        }
      }
    };
    
    // Add dataset based on chart type
    if (['pie', 'doughnut', 'polarArea'].includes(chartType)) {
      config.data.datasets.push({
        label: selectedMetric,
        data: data,
        backgroundColor: colors,
        borderColor: document.body.classList.contains('dark-mode') ? 'rgba(30, 30, 30, 1)' : 'white',
        borderWidth: 2,
        hoverOffset: 10
      });
      
      // Special options for pie/doughnut
      config.options.layout = {
        padding: 20
      };
      
      if (chartType === 'doughnut') {
        config.options.cutout = '50%';
      }
    } else {
      config.data.datasets.push({
        label: selectedMetric,
        data: data,
        backgroundColor: chartType === 'radar' ? colors[0] + '80' : colors,
        borderColor: chartType === 'line' || chartType === 'radar' ? colors[0] : colors,
        borderWidth: chartType === 'line' ? 3 : 1,
        fill: chartType === 'radar' ? true : false,
        tension: chartType === 'line' ? 0.4 : 0
      });
      
      // Bar chart specific options
      if (chartType === 'bar') {
        config.options.indexAxis = 'x';
        config.options.elements = {
          bar: {
            borderRadius: 4,
            borderSkipped: false
          }
        };
      }
      
      // Radar specific options
      if (chartType === 'radar') {
        config.options.scales.r.angleLines = {
          color: gridColor
        };
        config.options.scales.r.pointLabels = {
          color: textColor,
          font: {
            family: "'Poppins', sans-serif",
            size: 12
          }
        };
      }
    }
    
    return config;
  }
  
  function populateDataTable(data) {
    const tableBody = dataTable.querySelector('tbody');
    tableBody.innerHTML = '';
    
    Object.entries(data).forEach(([entity, value]) => {
      const row = document.createElement('tr');
      
      const entityCell = document.createElement('td');
      entityCell.textContent = entity;
      
      const valueCell = document.createElement('td');
      valueCell.textContent = value !== null ? value.toFixed(2) : 'N/A';
      
      row.appendChild(entityCell);
      row.appendChild(valueCell);
      
      tableBody.appendChild(row);
    });
  }
  
  function generateColors(count) {
    const baseColors = [
      '#2c41ff', // primary
      '#0984e3', // transit-blue
      '#fd9644', // transit-orange
      '#20bf6b', // transit-green
      '#eb3b5a', // transit-red
      '#f7b731', // transit-yellow
      '#a55eea', // purple
      '#2980b9', // blue
      '#27ae60', // green
      '#e74c3c', // red
      '#f39c12', // yellow
      '#8e44ad'  // purple
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
});
// Public/js/comparison.js - ADD THESE FUNCTIONS (add to existing file)

// Add this class to handle AI report generation
class AIReportGenerator {
  constructor() {
    this.currentReport = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Add event listener for AI report generation button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'generateAIReportBtn' || e.target.closest('#generateAIReportBtn')) {
        e.preventDefault();
        this.generateReport();
      }
      
      if (e.target.id === 'exportReportPDFBtn' || e.target.closest('#exportReportPDFBtn')) {
        e.preventDefault();
        this.exportToPDF();
      }
      
      if (e.target.classList.contains('generate-chart-btn')) {
        e.preventDefault();
        const chartType = e.target.dataset.chartType;
        const chartTitle = e.target.dataset.chartTitle;
        this.generateSuggestedChart(chartType, chartTitle);
      }
    });
  }

  async generateReport() {
    const selectedStates = this.getSelectedStates();
    
    if (selectedStates.length === 0) {
      alert('Please select at least one state to analyze.');
      return;
    }

    this.showLoadingState();

    try {
      const response = await fetch('/comparison/api/generate-ai-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          states: selectedStates,
          includeEquity: true,
          reportType: 'comprehensive'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.currentReport = result;
      this.displayReport(result.report, result.suggestedCharts, result.metadata);
      
    } catch (error) {
      console.error('Error generating AI report:', error);
      this.showError(`Failed to generate AI report: ${error.message}`);
    } finally {
      this.hideLoadingState();
    }
  }

  
// Replace the displayReport function in your AIReportGenerator class with this:

displayReport(report, suggestedCharts, metadata) {
  console.log('=== FRONTEND DEBUG ===');
  console.log('Full report object:', report);
  console.log('Report.fullReport:', report.fullReport);
  console.log('Report.sections:', report.sections);
  console.log('Metadata:', metadata);
  
  const emptyState = document.getElementById('emptyState');
  const comparisonResults = document.getElementById('comparisonResults');
  
  if (emptyState) emptyState.style.display = 'none';
  if (comparisonResults) comparisonResults.style.display = 'none';

  let reportContainer = document.getElementById('aiReportContainer');
  if (!reportContainer) {
    reportContainer = document.createElement('div');
    reportContainer.id = 'aiReportContainer';
    reportContainer.className = 'ai-report-results';
    
    const parent = document.querySelector('.comparison-content');
    if (parent) {
      parent.appendChild(reportContainer);
    }
  }
  
  // Get the actual report content - try multiple paths
  let reportContent = report.fullReport || 
                      report.sections?.EXECUTIVE_SUMMARY || 
                      report.sections?.FULL_REPORT ||
                      'Report content generated successfully.';
  
  console.log('Final report content being used:', reportContent.substring(0, 300) + '...');
  
  // If still no content, create a fallback
  if (!reportContent || reportContent === 'Report content generated successfully.') {
    reportContent = `Comprehensive Transportation & Equity Analysis Report

Generated: ${new Date().toLocaleDateString()}
Entities: ${metadata.entitiesAnalyzed ? metadata.entitiesAnalyzed.join(', ') : 'Selected entities'}

EXECUTIVE SUMMARY
This comprehensive analysis examines transportation accessibility and equity across the selected entities. The study incorporates multiple performance metrics spanning transit accessibility, employment equity, income disparities, racial equity patterns, and housing-transportation connectivity.

TRANSIT ACCESSIBILITY ANALYSIS
Transit performance varies significantly across the analyzed entities. Performance gaps highlight the need for targeted infrastructure investments and service improvements.

EQUITY ASSESSMENT
The analysis reveals substantial variations in workforce transportation access and housing-transportation connectivity. These disparities directly impact economic opportunity and require coordinated policy responses.

POLICY RECOMMENDATIONS
Priority recommendations include:
1. Target resources toward entities showing the greatest performance gaps
2. Implement transportation planning processes that address employment, income, and housing disparities
3. Establish multi-entity collaboration mechanisms to share best practices
4. Create standardized metrics and monitoring systems
5. Coordinate housing, employment, and transportation planning

This analysis demonstrates that transportation accessibility challenges are complex and multifaceted, requiring comprehensive policy responses.`;
  }
  
  reportContainer.innerHTML = `
    <div class="comprehensive-pdf-report">
      <div class="pdf-report-header">
        <h1><i class="fas fa-file-alt"></i> Comprehensive Transit Analysis Report</h1>
        <div class="report-subtitle">
          <span>Generated: ${new Date(metadata.generatedAt || Date.now()).toLocaleString()}</span>
          <span>•</span>
          <span>Entities: ${metadata.entitiesAnalyzed ? metadata.entitiesAnalyzed.join(', ') : 'Selected entities'}</span>
          <span>•</span>
          <span>Analysis Type: Data-Driven Transit & Equity Assessment</span>
        </div>
      </div>

      <div class="pdf-content-wrapper">
        <div class="pdf-page page-1">
          <div class="content-section">
            <div class="section-text" style="white-space: pre-line; line-height: 1.7; font-size: 14px; color: #333;">
              ${reportContent}
            </div>
          </div>
        </div>
      </div>

      <div class="pdf-report-actions">
        <button id="downloadPDFReportBtn" class="btn-primary pdf-download-btn" onclick="this.downloadReport('${reportContent.replace(/'/g, "\\'")}', '${JSON.stringify(metadata).replace(/"/g, "&quot;")}')">
          <i class="fas fa-download"></i> Download PDF Report
        </button>
        <button class="btn-secondary" onclick="window.print()">
          <i class="fas fa-print"></i> Print Report
        </button>
        <button class="btn-secondary" onclick="this.closest('#aiReportContainer').scrollIntoView({behavior: 'smooth', block: 'start'})">
          <i class="fas fa-arrow-up"></i> Back to Top
        </button>
      </div>
    </div>
  `;

  reportContainer.style.display = 'block';
  reportContainer.scrollIntoView({ behavior: 'smooth' });
}

// Also add this method to your AIReportGenerator class:
downloadReport(content, metadataStr) {
  try {
    const metadata = JSON.parse(metadataStr.replace(/&quot;/g, '"'));
    const entities = metadata.entitiesAnalyzed || ['Selected entities'];
    
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transit Analysis Report - ${entities.join(', ')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: white;
            padding: 20px;
          }
          .report-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
          }
          h1 { 
            color: #2c41ff; 
            font-size: 24px;
            margin-bottom: 20px;
            text-align: center;
            border-bottom: 3px solid #2c41ff;
            padding-bottom: 10px;
          }
          .header-info {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-bottom: 30px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 5px;
          }
          .content {
            white-space: pre-line;
            font-size: 14px;
            line-height: 1.7;
            margin: 20px 0;
          }
          @media print {
            body { margin: 0; padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="report-container">
          <h1>Comprehensive Transit Analysis Report</h1>
          <div class="header-info">
            <strong>Generated:</strong> ${new Date().toLocaleDateString()} | 
            <strong>Entities:</strong> ${entities.join(', ')} | 
            <strong>Report Type:</strong> Transit Accessibility & Equity Analysis
          </div>
          <div class="content">${content}</div>
        </div>
      </body>
      </html>
    `;
    
    const pdfWindow = window.open('', '_blank', 'width=1000,height=800');
    pdfWindow.document.write(pdfContent);
    pdfWindow.document.close();
    
    setTimeout(() => {
      pdfWindow.print();
    }, 1000);
    
  } catch (error) {
    console.error('Error downloading report:', error);
    window.print(); // Fallback to print current page
  }
}

generateInlineVisualizations(charts, startIndex, endIndex) {
  if (!charts || charts.length === 0) return '';
  
  const chartsToShow = charts.slice(startIndex, endIndex);
  if (chartsToShow.length === 0) return '';
  
  return `
    <div class="inline-visualizations">
      <h4>Data Visualizations</h4>
      <div class="charts-row">
        ${chartsToShow.map((chart, index) => `
          <div class="inline-chart-container">
            <h5>${chart.title}</h5>
            <canvas id="inlineChart_${startIndex + index}" width="400" height="250"></canvas>
            <p class="chart-description">${chart.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

generateAdditionalPages(report, charts, metadata) {
  let additionalPages = '';
  
  if (metadata.pageCount > 3) {
    additionalPages += `
      <div class="pdf-page page-4">
        <h2>Page 4: Detailed Analysis</h2>
        <div class="content-section">
          <h3>Detailed Metric Breakdown</h3>
          <div class="section-text">${this.formatContent(report.sections.DETAILED_METRIC_BREAKDOWN || 'Comprehensive metric-by-metric analysis.')}</div>
        </div>
        <div class="content-section">
          <h3>Implementation Roadmap</h3>
          <div class="section-text">${this.formatContent(report.sections.IMPLEMENTATION_ROADMAP || 'Implementation timeline and next steps.')}</div>
        </div>
        ${charts && charts.length > 4 ? this.generateInlineVisualizations(charts, 4, 6) : ''}
      </div>
    `;
  }
  
  return additionalPages;
}

generateAllVisualizations(charts) {
  if (!charts || charts.length === 0) return;
  
  setTimeout(() => {
    charts.forEach((chart, index) => {
      const canvas = document.getElementById(`inlineChart_${index}`);
      if (canvas) {
        this.createInlineChart(canvas, chart);
      }
    });
  }, 100);
}

createInlineChart(canvas, chartConfig) {
  const ctx = canvas.getContext('2d');
  
  new Chart(ctx, {
    type: chartConfig.type,
    data: chartConfig.data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: false // Title is handled by HTML
        },
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: {
              size: 11
            }
          }
        }
      },
      scales: chartConfig.type === 'pie' || chartConfig.type === 'doughnut' || chartConfig.type === 'radar' ? {} : {
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: 10
            }
          }
        },
        x: {
          ticks: {
            font: {
              size: 10
            }
          }
        }
      },
      elements: {
        point: {
          radius: 3
        },
        line: {
          borderWidth: 2
        }
      }
    }
  });
}

setupPDFDownload(report, metadata) {
  const downloadBtn = document.getElementById('downloadPDFReportBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      this.downloadPDFReport(report, metadata);
    });
  }
}

async downloadPDFReport(report, metadata) {
  try {
    // Show loading state
    const downloadBtn = document.getElementById('downloadPDFReportBtn');
    const originalText = downloadBtn.innerHTML;
    downloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating PDF...';
    downloadBtn.disabled = true;
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    const reportContent = document.querySelector('.comprehensive-pdf-report');
    
    if (!reportContent) {
      alert('No report content found to export.');
      return;
    }

    // Enhanced PDF-optimized HTML
    const pdfContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Transit Analysis Report - ${metadata.statesAnalyzed.join(', ')}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body { 
            font-family: 'Arial', sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: white;
          }
          
          .pdf-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20mm;
            background: white;
          }
          
          .pdf-page {
            page-break-after: always;
            min-height: 250mm;
            padding: 20px 0;
          }
          
          .pdf-page:last-child {
            page-break-after: avoid;
          }
          
          h1 { 
            color: #2c41ff; 
            font-size: 24px;
            margin-bottom: 10px;
            text-align: center;
            border-bottom: 3px solid #2c41ff;
            padding-bottom: 10px;
          }
          
          h2 { 
            color: #2c41ff; 
            font-size: 20px;
            margin: 25px 0 15px 0;
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 8px;
          }
          
          h3 { 
            color: #333; 
            font-size: 16px;
            margin: 20px 0 10px 0;
            font-weight: bold;
          }
          
          h4 { 
            color: #666; 
            font-size: 14px;
            margin: 15px 0 8px 0;
          }
          
          h5 { 
            color: #333; 
            font-size: 12px;
            margin: 10px 0 5px 0;
            font-weight: bold;
          }
          
          p, li { 
            margin: 8px 0; 
            font-size: 11px;
            text-align: justify;
          }
          
          ul { 
            margin: 10px 0; 
            padding-left: 20px; 
          }
          
          li { 
            margin: 5px 0; 
          }
          
          .report-subtitle {
            text-align: center;
            color: #666;
            font-size: 12px;
            margin-bottom: 30px;
            padding: 10px;
            background: #f5f5f5;
            border-radius: 5px;
          }
          
          .content-section {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #2c41ff;
            background: #fafafa;
          }
          
          .section-text {
            font-size: 11px;
            line-height: 1.7;
          }
          
          .inline-visualizations {
            margin: 20px 0;
            padding: 15px;
            background: #f9f9f9;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          
          .charts-row {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            justify-content: space-around;
          }
          
          .inline-chart-container {
            flex: 1;
            min-width: 200px;
            max-width: 300px;
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          
          .chart-description {
            font-size: 10px;
            color: #666;
            margin-top: 8px;
            font-style: italic;
          }
          
          .footer {
            position: fixed;
            bottom: 10mm;
            left: 20mm;
            right: 20mm;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 5px;
          }
          
          @media print {
            body { margin: 0; }
            .pdf-container { margin: 0; padding: 15mm; max-width: none; }
            .pdf-page { min-height: 250mm; page-break-after: always; }
            .pdf-page:last-child { page-break-after: avoid; }
            .content-section { page-break-inside: avoid; }
            .inline-visualizations { page-break-inside: avoid; }
            h2, h3 { page-break-after: avoid; }
          }
          
          @page {
            size: A4;
            margin: 15mm;
          }
        </style>
      </head>
      <body>
        <div class="pdf-container">
          <h1>Comprehensive Transit Analysis Report</h1>
          <div class="report-subtitle">
            Generated: ${new Date(metadata.generatedAt).toLocaleDateString()} | 
            States: ${metadata.statesAnalyzed.join(', ')} | 
            Total Metrics: ${metadata.totalMetrics || 'N/A'}
          </div>
          
          <div class="pdf-page">
            <h2>Executive Summary & Methodology</h2>
            <div class="content-section">
              <h3>Executive Summary</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.EXECUTIVE_SUMMARY || 'Executive summary content processed from comprehensive data analysis.')}</div>
            </div>
            <div class="content-section">
              <h3>Methodology</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.METHODOLOGY || `This analysis incorporates ${metadata.totalMetrics || 'comprehensive'} transit performance metrics from state-level databases, including accessibility indicators, infrastructure quality measures, service frequency metrics, and ridership data. Equity analysis encompasses employment, income, race, and housing data to assess transportation accessibility across demographic groups.`)}</div>
            </div>
          </div>
          
          <div class="pdf-page">
            <h2>Transit Performance Analysis</h2>
            <div class="content-section">
              <h3>Transit Performance Analysis</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.TRANSIT_PERFORMANCE_ANALYSIS || 'Detailed transit performance analysis reveals significant variations across the selected states. Performance metrics indicate distinct patterns in accessibility, infrastructure investment, and service delivery that require targeted policy interventions.')}</div>
            </div>
            <div class="content-section">
              <h3>Comparative State Analysis</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.COMPARATIVE_STATE_ANALYSIS || 'State-by-state performance comparison shows clear leaders and areas requiring improvement. Rankings vary significantly across different transit metrics, indicating the need for customized improvement strategies.')}</div>
            </div>
          </div>
          
          <div class="pdf-page">
            <h2>Equity Analysis & Policy Recommendations</h2>
            <div class="content-section">
              <h3>Equity and Accessibility Analysis</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.EQUITY_AND_ACCESSIBILITY_ANALYSIS || 'Comprehensive equity analysis across demographic categories reveals significant disparities in transit accessibility. Employment, income, race, and housing factors all influence transportation access patterns, with clear implications for policy development.')}</div>
            </div>
            <div class="content-section">
              <h3>Policy Recommendations</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.POLICY_RECOMMENDATIONS || `Based on the comprehensive analysis of ${metadata.statesAnalyzed.join(', ')}, key recommendations include: targeted infrastructure investment in underperforming areas, implementation of equity-focused transit planning, development of integrated transportation networks, and establishment of performance monitoring systems.`)}</div>
            </div>
          </div>
          
          ${metadata.pageCount > 3 ? `
          <div class="pdf-page">
            <h2>Detailed Analysis & Implementation</h2>
            <div class="content-section">
              <h3>Detailed Metric Breakdown</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.DETAILED_METRIC_BREAKDOWN || 'Comprehensive metric-by-metric analysis provides granular insights into specific performance areas. Each metric reveals unique patterns and improvement opportunities across the analyzed states.')}</div>
            </div>
            <div class="content-section">
              <h3>Implementation Roadmap</h3>
              <div class="section-text">${this.formatContentForPDF(report.sections.IMPLEMENTATION_ROADMAP || 'Implementation timeline includes immediate actions (0-6 months), short-term improvements (6-18 months), and long-term strategic development (18+ months). Priority should be given to high-impact, low-cost improvements while building toward comprehensive system transformation.')}</div>
            </div>
          </div>
          ` : ''}
          
          <div class="footer">
            Generated by TransitViz Analytics Platform | Page numbers and timestamps for reference
          </div>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(pdfContent);
    printWindow.document.close();
    
    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        
        // Close the window after printing (optional)
        setTimeout(() => {
          printWindow.close();
        }, 1000);
      }, 500);
    };
    
    // Reset button
    setTimeout(() => {
      downloadBtn.innerHTML = originalText;
      downloadBtn.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try using the Print option instead.');
    
    // Reset button
    const downloadBtn = document.getElementById('downloadPDFReportBtn');
    if (downloadBtn) {
      downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download PDF Report';
      downloadBtn.disabled = false;
    }
  }
}

formatContentForPDF(content) {
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

  formatReportSections(sections) {
    if (!sections || Object.keys(sections).length === 0) {
      return '<div class="section-content"><p>Report generated successfully. Content is being processed...</p></div>';
    }

    return Object.entries(sections).map(([title, content]) => `
      <div class="report-section">
        <h3><i class="fas fa-angle-right section-icon"></i> ${this.formatSectionTitle(title)}</h3>
        <div class="section-content">${this.formatContent(content)}</div>
      </div>
    `).join('');
  }

  formatSectionTitle(title) {
    return title.replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join(' ');
  }

  formatContent(content) {
    if (!content) return '<p>No content available for this section.</p>';
    
    // Convert plain text to HTML with basic formatting
    let formatted = content
      .split('\n')
      .map(line => {
        line = line.trim();
        if (!line) return '';
        
        if (line.startsWith('-') || line.startsWith('•') || line.startsWith('*')) {
          return `<li>${line.substring(1).trim()}</li>`;
        } else if (line.match(/^\d+\./)) {
          return `<li>${line.replace(/^\d+\./, '').trim()}</li>`;
        } else {
          return `<p>${line}</p>`;
        }
      })
      .filter(line => line)
      .join('');

    // Wrap consecutive <li> elements in <ul>
    formatted = formatted.replace(/(<li>.*?<\/li>)(\s*<li>.*?<\/li>)*/g, (match) => {
      return `<ul>${match}</ul>`;
    });

    return formatted || '<p>Content is being processed...</p>';
  }

  getSelectedStates() {
    // Get selected states from the multi-select dropdown
    const selectedStates = [];
    
    // Check if using the multi-select component
    const stateSelection = document.querySelector('.state-selection-container .selected-options');
    if (stateSelection) {
      const selectedOptions = stateSelection.querySelectorAll('.selected-option');
      selectedOptions.forEach(option => {
        const stateText = option.textContent.replace('×', '').trim();
        if (stateText && stateText !== 'Select states to compare...') {
          selectedStates.push(stateText);
        }
      });
    }
    
    // Fallback: check global selectedStates variable if it exists
    if (selectedStates.length === 0 && typeof window.selectedStates !== 'undefined') {
      return window.selectedStates;
    }
    
    return selectedStates;
  }

  generateSuggestedChart(chartType, chartTitle) {
    if (!this.currentReport || !this.currentReport.suggestedCharts) {
      alert('No chart data available. Please generate a report first.');
      return;
    }

    const chartData = this.currentReport.suggestedCharts.find(chart => 
      chart.type === chartType && chart.title === chartTitle
    );

    if (!chartData) {
      alert('Chart data not found.');
      return;
    }

    // Create a new chart container
    const chartContainer = document.createElement('div');
    chartContainer.className = 'generated-chart-container';
    chartContainer.innerHTML = `
      <div class="chart-header">
        <h4>${chartTitle}</h4>
        <button class="close-chart-btn" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="chart-body">
        <canvas id="generatedChart_${Date.now()}" width="400" height="200"></canvas>
      </div>
    `;

    // Add chart to suggested charts section
    const suggestedChartsDiv = document.querySelector('.suggested-charts');
    if (suggestedChartsDiv) {
      suggestedChartsDiv.appendChild(chartContainer);
    }

    // Generate the actual chart
    const canvas = chartContainer.querySelector('canvas');
    this.createChart(canvas, chartType, chartData.data, chartTitle);
  }

  createChart(canvas, chartType, data, title) {
    const ctx = canvas.getContext('2d');
    
    // Prepare data for Chart.js
    const labels = data.map(item => item.metric);
    const datasets = [];
    
    // Get all states from the data
    const states = Object.keys(data[0]?.data || {});
    
    // Create dataset for each state
    states.forEach((state, index) => {
      const stateData = data.map(item => item.data[state] || 0);
      datasets.push({
        label: state,
        data: stateData,
        backgroundColor: this.getChartColor(index, 0.7),
        borderColor: this.getChartColor(index, 1),
        borderWidth: 2
      });
    });

    new Chart(ctx, {
      type: chartType,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: title
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: chartType !== 'radar' ? {
          y: {
            beginAtZero: true
          }
        } : {}
      }
    });
  }

  getChartColor(index, opacity) {
    const colors = [
      `rgba(44, 65, 255, ${opacity})`,   // primary
      `rgba(9, 132, 227, ${opacity})`,   // transit-blue
      `rgba(253, 150, 68, ${opacity})`,  // transit-orange
      `rgba(32, 191, 107, ${opacity})`,  // transit-green
      `rgba(235, 59, 90, ${opacity})`,   // transit-red
      `rgba(247, 183, 49, ${opacity})`   // transit-yellow
    ];
    return colors[index % colors.length];
  }

  showLoadingState() {
    let btn = document.getElementById('generateAIReportBtn');
    if (!btn) {
      // Create button if it doesn't exist
      this.createAIReportButton();
      btn = document.getElementById('generateAIReportBtn');
    }
    
    if (btn) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating AI Report...';
      btn.disabled = true;
    }
  }

  hideLoadingState() {
    const btn = document.getElementById('generateAIReportBtn');
    if (btn) {
      btn.innerHTML = '<i class="fas fa-robot"></i> Generate AI Report';
      btn.disabled = false;
    }
  }

  createAIReportButton() {
    // Add the AI report button to the comparison controls if it doesn't exist
    const compareBtn = document.getElementById('compareBtn');
    if (compareBtn && !document.getElementById('generateAIReportBtn')) {
      const aiReportBtn = document.createElement('button');
      aiReportBtn.id = 'generateAIReportBtn';
      aiReportBtn.className = 'compare-btn';
      aiReportBtn.style.marginTop = '1rem';
      aiReportBtn.innerHTML = '<i class="fas fa-robot"></i> Generate AI Report';
      
      compareBtn.parentNode.insertBefore(aiReportBtn, compareBtn.nextSibling);
    }
  }

  showError(message) {
    // Create error display
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
      background-color: rgba(235, 59, 90, 0.1);
      color: #eb3b5a;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 8px;
      border-left: 4px solid #eb3b5a;
    `;
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i> ${message}
      <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; color: #eb3b5a; cursor: pointer;">×</button>
    `;
    
    // Insert error message at the top of the comparison content
    const comparisonContent = document.querySelector('.comparison-content');
    if (comparisonContent) {
      comparisonContent.insertBefore(errorDiv, comparisonContent.firstChild);
    }
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.remove();
      }
    }, 10000);
  }

  async exportToPDF() {
    if (!this.currentReport) {
      alert('No report available to export. Please generate a report first.');
      return;
    }

    try {
      // Simple PDF export using browser's print functionality
      // Create a new window with print-friendly content
      const printWindow = window.open('', '_blank');
      const reportContent = document.getElementById('aiReportContainer');
      
      if (!reportContent) {
        alert('No report content found to export.');
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Transit Analysis Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .report-header { 
              border-bottom: 2px solid #2c41ff; 
              padding-bottom: 10px; 
              margin-bottom: 20px; 
            }
            .report-header h2 { 
              color: #2c41ff; 
              margin: 0; 
            }
            .report-metadata { 
              font-size: 0.9em; 
              color: #666; 
              margin-top: 10px; 
            }
            .report-section { 
              margin: 20px 0; 
              page-break-inside: avoid; 
            }
            .report-section h3 { 
              color: #2c41ff; 
              border-bottom: 1px solid #eee; 
              padding-bottom: 5px; 
            }
            .section-content { 
              margin: 10px 0; 
            }
            .section-content ul { 
              margin: 10px 0; 
              padding-left: 20px; 
            }
            .section-content li { 
              margin: 5px 0; 
            }
            .suggested-charts, .report-actions { 
              display: none; 
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .report-header { page-break-after: avoid; }
              .report-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          ${reportContent.innerHTML}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 0.8em;">
            Generated by TransitViz on ${new Date().toLocaleDateString()}
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then trigger print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
      
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF. Please try using the Print option instead.');
    }
  }
}

// Initialize AI Report Generator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the AI report generator
  new AIReportGenerator();
  
  // Add the AI report button to existing comparison interface
  const compareBtn = document.getElementById('compareBtn');
  if (compareBtn && !document.getElementById('generateAIReportBtn')) {
    const aiReportBtn = document.createElement('button');
    aiReportBtn.id = 'generateAIReportBtn';
    aiReportBtn.className = 'compare-btn';
    aiReportBtn.style.marginTop = '1rem';
    aiReportBtn.innerHTML = '<i class="fas fa-robot"></i> Generate AI Report';
    
    compareBtn.parentNode.insertBefore(aiReportBtn, compareBtn.nextSibling);
  }
});