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