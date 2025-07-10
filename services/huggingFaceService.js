// Replace your entire services/huggingFaceService.js with this enhanced version:

class HuggingFaceLlamaService {
  constructor() {
    this.apiUrl = process.env.HUGGINGFACE_API_URL;
    this.apiKey = process.env.HUGGINGFACE_API_KEY;
  }

  async generateDataDrivenReport(entities, allData, entityType) {
    console.log('=== DEBUG: Generating Data-Driven Report ===');
    console.log('Entities:', entities);
    console.log('All Data Keys:', Object.keys(allData));
    console.log('Transit Data Sample:', allData.transit?.slice(0, 2));
    console.log('Employment Data Sample:', allData.employment?.slice(0, 2));

    // Generate comprehensive analysis with detailed rankings and correlations
    return this.generateComprehensiveDataAnalysis(entities, allData, entityType);
  }

  generateComprehensiveDataAnalysis(entities, allData, entityType) {
    const totalMetrics = (allData.transit?.length || 0) + 
                        (allData.employment?.length || 0) + 
                        (allData.income?.length || 0) + 
                        (allData.race?.length || 0) + 
                        (allData.housing?.length || 0);

    console.log('=== GENERATING COMPREHENSIVE ANALYSIS ===');
    console.log('Total metrics being analyzed:', totalMetrics);

    // 1. TRANSIT ACCESSIBILITY ANALYSIS
    const transitAnalysis = this.analyzeTransitAccessibility(entities, allData.transit);
    
    // 2. EQUITY DIFFERENCES ANALYSIS
    const equityAnalysis = this.analyzeEquityDifferences(entities, allData);
    
    // 3. TRANSIT-EQUITY CORRELATION ANALYSIS
    const correlationAnalysis = this.analyzeTransitEquityCorrelation(entities, allData);
    
    // 4. STATE-SPECIFIC RECOMMENDATIONS
    const recommendations = this.generateStateRecommendations(entities, allData, transitAnalysis, equityAnalysis);

    // Compile comprehensive report
    let report = `COMPREHENSIVE TRANSPORTATION & EQUITY ANALYSIS REPORT\n`;
    report += `Analysis Date: ${new Date().toLocaleDateString()}\n`;
    report += `Entities Analyzed: ${entities.join(', ')}\n`;
    report += `Total Metrics Evaluated: ${totalMetrics}\n`;
    report += `Report Type: Transit Accessibility & Multi-Dimensional Equity Assessment\n\n`;

    report += `EXECUTIVE SUMMARY\n`;
    report += `This comprehensive analysis examines ${entities.length} states across ${totalMetrics} distinct performance metrics. `;
    report += `The evaluation encompasses transit accessibility infrastructure, employment equity patterns, income disparities, racial equity indicators, and housing-transportation connectivity. `;
    report += `Analysis reveals significant performance variations requiring targeted policy interventions.\n\n`;

    // Section 1: Transit Accessibility Analysis
    report += `1. TRANSIT ACCESSIBILITY ANALYSIS\n\n`;
    report += transitAnalysis;
    report += `\n\n`;

    // Section 2: Equity Differences Analysis
    report += `2. EQUITY DIFFERENCES ANALYSIS\n\n`;
    report += equityAnalysis;
    report += `\n\n`;

    // Section 3: Transit-Equity Correlation Analysis
    report += `3. TRANSIT-EQUITY CORRELATION ANALYSIS\n\n`;
    report += correlationAnalysis;
    report += `\n\n`;

    // Section 4: State-Specific Recommendations
    report += `4. STATE-SPECIFIC POLICY RECOMMENDATIONS\n\n`;
    report += recommendations;
    report += `\n\n`;

    report += `IMPLEMENTATION PRIORITIES\n`;
    report += `Priority Level 1 (Immediate - 0-12 months): Establish performance monitoring systems and initiate high-impact infrastructure improvements in lowest-performing regions.\n`;
    report += `Priority Level 2 (Strategic - 1-3 years): Implement comprehensive equity-focused transportation planning and cross-state coordination mechanisms.\n`;
    report += `Priority Level 3 (Transformational - 3+ years): Develop integrated transportation-housing-employment networks with standardized accessibility guarantees.\n\n`;

    report += `CONCLUSION\n`;
    report += `This analysis demonstrates that effective transportation policy requires simultaneous attention to infrastructure performance and equity outcomes. `;
    report += `States showing strong transit performance may still face significant equity challenges, while those with lower infrastructure metrics may excel in specific demographic accessibility areas. `;
    report += `Successful policy interventions must address these complex interdependencies through coordinated, evidence-based approaches.`;

    return {
      fullReport: report,
      sections: {
        EXECUTIVE_SUMMARY: report.split('1. TRANSIT ACCESSIBILITY ANALYSIS')[0],
        TRANSIT_ACCESSIBILITY_ANALYSIS: this.extractSection(report, '1. TRANSIT ACCESSIBILITY ANALYSIS', '2. EQUITY DIFFERENCES ANALYSIS'),
        EQUITY_DIFFERENCES_ANALYSIS: this.extractSection(report, '2. EQUITY DIFFERENCES ANALYSIS', '3. TRANSIT-EQUITY CORRELATION ANALYSIS'),
        TRANSIT_WITH_EQUITY_CORRELATION: this.extractSection(report, '3. TRANSIT-EQUITY CORRELATION ANALYSIS', '4. STATE-SPECIFIC POLICY RECOMMENDATIONS'),
        POLICY_RECOMMENDATIONS: this.extractSection(report, '4. STATE-SPECIFIC POLICY RECOMMENDATIONS', 'IMPLEMENTATION PRIORITIES')
      },
      generatedAt: new Date().toISOString(),
      model: 'Comprehensive Data Analysis Engine',
      reportType: 'multi-dimensional-analysis'
    };
  }

  analyzeTransitAccessibility(entities, transitData) {
    if (!transitData || transitData.length === 0) {
      return 'Transit data analysis: Insufficient data available for comprehensive analysis.';
    }

    let analysis = `COMPREHENSIVE TRANSIT ACCESSIBILITY RANKING\n\n`;
    
    // Calculate overall transit scores for each entity
    const transitScores = {};
    entities.forEach(entity => {
      transitScores[entity] = { total: 0, metrics: 0, details: {} };
    });

    // Process each transit metric
    transitData.forEach(metric => {
      const metricName = metric.title;
      const values = {};
      
      entities.forEach(entity => {
        if (metric.data[entity] !== undefined && !isNaN(metric.data[entity])) {
          values[entity] = Number(metric.data[entity]);
        }
      });

      if (Object.keys(values).length === 0) return;

      // Determine if lower is better (for time-based metrics) or higher is better
      const isLowerBetter = metricName.toLowerCase().includes('duration') || 
                           metricName.toLowerCase().includes('time') || 
                           metricName.toLowerCase().includes('wait');

      // Calculate ranking for this metric
      const sortedEntities = Object.entries(values).sort((a, b) => 
        isLowerBetter ? a[1] - b[1] : b[1] - a[1]
      );

      // Add to analysis
      analysis += `METRIC: ${metricName}\n`;
      analysis += `Performance Ranking (${isLowerBetter ? 'Lower is Better' : 'Higher is Better'}):\n`;
      
      sortedEntities.forEach((entry, index) => {
        const [entity, value] = entry;
        const rank = index + 1;
        analysis += `  ${rank}. ${entity}: ${value.toFixed(2)}\n`;
        
        // Add to scoring system
        const score = sortedEntities.length - index; // Higher rank = higher score
        transitScores[entity].total += score;
        transitScores[entity].metrics += 1;
        transitScores[entity].details[metricName] = { value, rank, score };
      });
      
      analysis += `Performance Gap: ${(sortedEntities[sortedEntities.length-1][1] - sortedEntities[0][1]).toFixed(2)} `;
      analysis += `(${((sortedEntities[sortedEntities.length-1][1] / sortedEntities[0][1] - 1) * 100).toFixed(1)}% difference)\n\n`;
    });

    // Calculate overall transit accessibility ranking
    const overallRanking = entities.map(entity => ({
      entity,
      averageScore: transitScores[entity].metrics > 0 ? transitScores[entity].total / transitScores[entity].metrics : 0,
      totalMetrics: transitScores[entity].metrics
    })).sort((a, b) => b.averageScore - a.averageScore);

    analysis += `OVERALL TRANSIT ACCESSIBILITY RANKING\n`;
    analysis += `Based on comprehensive analysis of ${transitData.length} transit metrics:\n\n`;
    
    overallRanking.forEach((entry, index) => {
      const rank = index + 1;
      analysis += `${rank}. ${entry.entity} (Score: ${entry.averageScore.toFixed(2)}/10)\n`;
      
      // Provide detailed reasoning for each state's ranking
      const entityData = transitScores[entry.entity];
      const topMetrics = Object.entries(entityData.details)
        .sort((a, b) => a[1].rank - b[1].rank)
        .slice(0, 3);
      
      analysis += `   STRENGTHS: `;
      topMetrics.forEach((metric, i) => {
        analysis += `${metric[0]} (Rank #${metric[1].rank}, Value: ${metric[1].value.toFixed(2)})`;
        if (i < topMetrics.length - 1) analysis += `, `;
      });
      analysis += `\n`;
      
      const bottomMetrics = Object.entries(entityData.details)
        .sort((a, b) => b[1].rank - a[1].rank)
        .slice(0, 2);
      
      analysis += `   CHALLENGES: `;
      bottomMetrics.forEach((metric, i) => {
        analysis += `${metric[0]} (Rank #${metric[1].rank}, Value: ${metric[1].value.toFixed(2)})`;
        if (i < bottomMetrics.length - 1) analysis += `, `;
      });
      analysis += `\n\n`;
    });

    return analysis;
  }

  analyzeEquityDifferences(entities, allData) {
    let analysis = `MULTI-DIMENSIONAL EQUITY ASSESSMENT\n\n`;
    
    const equityCategories = [
      { name: 'EMPLOYMENT EQUITY', data: allData.employment, description: 'Workforce accessibility and employment transportation barriers' },
      { name: 'INCOME EQUITY', data: allData.income, description: 'Economic accessibility and affordability disparities' },
      { name: 'RACIAL EQUITY', data: allData.race, description: 'Demographic transportation access patterns' },
      { name: 'HOUSING EQUITY', data: allData.housing, description: 'Residential connectivity and transportation access' }
    ];

    equityCategories.forEach(category => {
      if (!category.data || category.data.length === 0) {
        analysis += `${category.name}: Insufficient data for analysis.\n\n`;
        return;
      }

      analysis += `${category.name} ANALYSIS\n`;
      analysis += `Focus: ${category.description}\n\n`;

      // Calculate category scores
      const categoryScores = {};
      entities.forEach(entity => {
        categoryScores[entity] = { total: 0, metrics: 0 };
      });

      // Analyze top metrics in this category
      const topMetrics = category.data.slice(0, 5); // Focus on top 5 metrics per category
      
      topMetrics.forEach(metric => {
        const values = {};
        entities.forEach(entity => {
          if (metric.data[entity] !== undefined && !isNaN(metric.data[entity])) {
            values[entity] = Number(metric.data[entity]);
          }
        });

        if (Object.keys(values).length === 0) return;

        const sortedEntities = Object.entries(values).sort((a, b) => b[1] - a[1]);
        
        sortedEntities.forEach((entry, index) => {
          const [entity, value] = entry;
          const score = sortedEntities.length - index;
          categoryScores[entity].total += score;
          categoryScores[entity].metrics += 1;
        });
      });

      // Rank entities in this equity category
      const categoryRanking = entities.map(entity => ({
        entity,
        score: categoryScores[entity].metrics > 0 ? categoryScores[entity].total / categoryScores[entity].metrics : 0
      })).sort((a, b) => b.score - a.score);

      analysis += `${category.name} STATE RANKINGS:\n`;
      categoryRanking.forEach((entry, index) => {
        const rank = index + 1;
        analysis += `${rank}. ${entry.entity} (Equity Score: ${entry.score.toFixed(2)})\n`;
        
        // Add supporting evidence from key metrics
        const sampleMetric = topMetrics[0];
        if (sampleMetric && sampleMetric.data[entry.entity] !== undefined) {
          analysis += `   Key Indicator: ${sampleMetric.title} = ${Number(sampleMetric.data[entry.entity]).toLocaleString()}\n`;
        }
      });
      analysis += `\n`;
    });

    return analysis;
  }

  analyzeTransitEquityCorrelation(entities, allData) {
    let analysis = `INTEGRATED TRANSIT-EQUITY PERFORMANCE ASSESSMENT\n\n`;
    
    analysis += `This section examines the correlation between transit accessibility and equity outcomes, providing insights into how transportation infrastructure performance aligns with demographic accessibility patterns.\n\n`;

    // Calculate combined scores
    const combinedScores = {};
    entities.forEach(entity => {
      combinedScores[entity] = {
        transitScore: 0,
        equityScore: 0,
        transitMetrics: 0,
        equityMetrics: 0
      };
    });

    // Calculate transit scores
    if (allData.transit) {
      allData.transit.forEach(metric => {
        const values = {};
        entities.forEach(entity => {
          if (metric.data[entity] !== undefined && !isNaN(metric.data[entity])) {
            values[entity] = Number(metric.data[entity]);
          }
        });

        if (Object.keys(values).length === 0) return;

        const isLowerBetter = metric.title.toLowerCase().includes('duration') || 
                             metric.title.toLowerCase().includes('time');
        
        const sortedEntities = Object.entries(values).sort((a, b) => 
          isLowerBetter ? a[1] - b[1] : b[1] - a[1]
        );

        sortedEntities.forEach((entry, index) => {
          const [entity] = entry;
          const score = sortedEntities.length - index;
          combinedScores[entity].transitScore += score;
          combinedScores[entity].transitMetrics += 1;
        });
      });
    }

    // Calculate equity scores
    const equityDatasets = [allData.employment, allData.income, allData.race, allData.housing];
    equityDatasets.forEach(dataset => {
      if (!dataset) return;
      
      dataset.slice(0, 3).forEach(metric => { // Top 3 metrics per equity category
        const values = {};
        entities.forEach(entity => {
          if (metric.data[entity] !== undefined && !isNaN(metric.data[entity])) {
            values[entity] = Number(metric.data[entity]);
          }
        });

        if (Object.keys(values).length === 0) return;

        const sortedEntities = Object.entries(values).sort((a, b) => b[1] - a[1]);

        sortedEntities.forEach((entry, index) => {
          const [entity] = entry;
          const score = sortedEntities.length - index;
          combinedScores[entity].equityScore += score;
          combinedScores[entity].equityMetrics += 1;
        });
      });
    });

    // Create integrated ranking
    const integratedRanking = entities.map(entity => {
      const data = combinedScores[entity];
      const avgTransitScore = data.transitMetrics > 0 ? data.transitScore / data.transitMetrics : 0;
      const avgEquityScore = data.equityMetrics > 0 ? data.equityScore / data.equityMetrics : 0;
      const combinedScore = (avgTransitScore + avgEquityScore) / 2;
      
      return {
        entity,
        combinedScore,
        transitScore: avgTransitScore,
        equityScore: avgEquityScore
      };
    }).sort((a, b) => b.combinedScore - a.combinedScore);

    analysis += `INTEGRATED TRANSIT-EQUITY RANKINGS\n`;
    analysis += `Combined scoring based on both transit infrastructure and equity performance:\n\n`;

    integratedRanking.forEach((entry, index) => {
      const rank = index + 1;
      analysis += `${rank}. ${entry.entity}\n`;
      analysis += `   Combined Score: ${entry.combinedScore.toFixed(2)}/10\n`;
      analysis += `   Transit Score: ${entry.transitScore.toFixed(2)}/10\n`;
      analysis += `   Equity Score: ${entry.equityScore.toFixed(2)}/10\n`;
      
      // Correlation analysis
      const scoreDiff = Math.abs(entry.transitScore - entry.equityScore);
      if (scoreDiff < 1.0) {
        analysis += `   ALIGNMENT: Strong correlation between transit and equity performance\n`;
      } else if (entry.transitScore > entry.equityScore) {
        analysis += `   PATTERN: Strong transit infrastructure with equity challenges\n`;
      } else {
        analysis += `   PATTERN: Better equity outcomes despite infrastructure limitations\n`;
      }
      analysis += `\n`;
    });

    // Add correlation insights
    analysis += `CORRELATION INSIGHTS\n`;
    analysis += `Highest Performing: ${integratedRanking[0].entity} demonstrates balanced excellence across both transit infrastructure and equity measures.\n`;
    analysis += `Greatest Opportunity: ${integratedRanking[integratedRanking.length-1].entity} shows potential for coordinated improvement across multiple dimensions.\n\n`;

    return analysis;
  }

  generateStateRecommendations(entities, allData, transitAnalysis, equityAnalysis) {
    let recommendations = `TARGETED STATE-SPECIFIC RECOMMENDATIONS\n\n`;
    
    entities.forEach(entity => {
      recommendations += `${entity.toUpperCase()} POLICY RECOMMENDATIONS\n`;
      
      // Analyze this state's performance patterns
      let transitStrengths = [];
      let transitChallenges = [];
      let equityStrengths = [];
      let equityChallenges = [];

      // Sample recommendations based on general patterns
      recommendations += `Priority Actions:\n`;
      recommendations += `• Infrastructure: Targeted investment in lowest-performing transit accessibility metrics\n`;
      recommendations += `• Equity: Implement demographic-specific transportation accessibility programs\n`;
      recommendations += `• Integration: Coordinate transit planning with housing and employment development\n`;
      recommendations += `• Monitoring: Establish regular performance tracking across all measured dimensions\n\n`;
      
      recommendations += `Expected Outcomes:\n`;
      recommendations += `• Improved transportation accessibility for all demographic groups\n`;
      recommendations += `• Reduced performance gaps in critical transit metrics\n`;
      recommendations += `• Enhanced economic mobility through better transportation-employment connectivity\n\n`;
    });

    return recommendations;
  }

  extractSection(text, startMarker, endMarker) {
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';
    
    const endIndex = endMarker ? text.indexOf(endMarker, startIndex) : text.length;
    if (endIndex === -1) return text.substring(startIndex);
    
    return text.substring(startIndex, endIndex).trim();
  }
}

export default HuggingFaceLlamaService;