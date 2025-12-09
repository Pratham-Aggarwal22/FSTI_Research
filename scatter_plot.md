# Scatter Plot Comparison Documentation

## Overview
The Scatter Plot Comparison feature allows users to analyze and compare transit and equity metrics across different states. It moves beyond simple averages to show the *distribution* and *variability* of data within each region.

## Features

### 1. Hierarchical Filtering
Users can drill down into the data using a three-level selector:
*   **Category:** Choose between "Transit" (service quality) and "Equity" (demographics).
*   **Subcategory:**
    *   For Transit: Grouped by type (e.g., "Travel Times", "Access", "Transfers").
    *   For Equity: Grouped by database (e.g., "Income Data", "Employment Data").
*   **Metric:** The specific data point to visualize (e.g., "Average Initial Wait Time", "Median Household Income").

### 2. Statistical Visualization
For each selected state, the chart displays five key statistical markers, derived from the county-level data within that state:
*   **Mean (Circle):** The average value.
*   **Min (Triangle):** The best performing county (or lowest value).
*   **Max (Inverted Triangle):** The worst performing county (or highest value).
*   **10th Percentile (Rectangle):** The value below which 10% of counties fall (better than 90% of counties).
*   **90th Percentile (Rotated Rectangle):** The value below which 90% of counties fall (worse than 90% of counties).

### 3. Range Bars
Behind the statistical points, a grey "Range Bar" is drawn for each state. This visualizes the full spread of the data, from the minimum to the maximum value, allowing for an immediate visual assessment of disparity within a state.

## Technical Implementation & Formulas

### Data Source
The statistics are calculated dynamically on the backend. The input data is the set of **county-level average values** for the selected state.

### Formulas
Let $S$ be the sorted list of valid numeric values for all counties in a state.
Let $N$ be the total number of valid counties (sample size).

1.  **Mean:**
    $$ \text{Mean} = \frac{\sum S}{N} $$
    *Simple English:* The sum of all county values divided by the number of counties.

2.  **Minimum:**
    $$ \text{Min} = S[0] $$
    *Simple English:* The lowest value observed in any county.

3.  **Maximum:**
    $$ \text{Max} = S[N-1] $$
    *Simple English:* The highest value observed in any county.

4.  **Percentiles (10th and 90th):**
    We use linear interpolation to find the value at a specific rank.
    *   **Rank Calculation:** $R = \frac{P}{100} \times (N - 1)$
        *   Where $P$ is the percentile (10 or 90).
    *   **Interpolation:**
        *   Let $L = \lfloor R \rfloor$ (lower index)
        *   Let $U = \lceil R \rceil$ (upper index)
        *   Let $W = R - L$ (weight)
        *   $\text{Value} = S[L] \times (1 - W) + S[U] \times W$
    *   *Simple English:* If we lined up all counties from lowest to highest, the 10th percentile is the value that is 10% of the way up the list. It represents a "better than average" performance (for metrics where lower is better).

### Zero Access Handling
Counties with **0% Access** are treated as "No Data" for the purpose of calculating travel time statistics (like wait time or duration) because no valid trips exist. However, they are tracked separately and displayed in the chart tooltip as a "Zero Access Count" to inform the user that some counties have no service at all.

