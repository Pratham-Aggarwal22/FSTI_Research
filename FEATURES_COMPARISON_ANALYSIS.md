# Comparison & Analysis Features

## 1. State Comparison (Comparison Dashboard)

### Simple English Explanation
The **State Comparison** tool allows you to look at multiple states side-by-side to see how they stack up against each other. Instead of looking at just one number (the average), this tool gives you a complete picture of transit quality in that state.

Imagine you want to compare New York and California. The average wait time might look similar, but this chart will show you:
*   **The "Average" Person:** Represented by a blue circle.
*   **The "Best Served" People:** Represented by a yellow square (the top 10% of lucky commuters).
*   **The "Worst Served" People:** Represented by a red diamond (the bottom 10% who struggle the most).
*   **The Extremes:** Green and orange triangles showing the absolute best and worst cases.

This helps you understand not just *how good* transit is, but *how consistent* or *fair* it is across the whole state.

### Technical Specifications
This feature is powered by a custom implementation of a **Statistical Dot Plot** using Chart.js.

*   **Data Structure:** The backend aggregates data to calculate specific statistical percentiles (Mean, 10th, 90th, Min, Max) for the selected metric across all counties in the requested states.
*   **Visualization Engine:**
    *   **Chart Type:** Modified `scatter` chart.
    *   **X-Axis:** The metric value (e.g., Minutes).
    *   **Y-Axis:** Categorical (State names).
*   **Custom Plugins:**
    *   **Range Bars:** We wrote a custom Chart.js plugin (`rangeBarPlugin`) that draws a subtle grey bar behind the dots for each state. This visualizes the full spread (Min to Max) of the data, providing context for the individual percentile dots.
    *   **Symbol Mapping:** Different shapes (`rect`, `circle`, `triangle`, `rectRot`) are mapped to specific statistical data points to ensure color-blind friendly distinctness.
*   **Interactivity:** The chart supports tooltips that reveal the exact numerical value for each statistical marker when hovered.

---

## 2. Equity vs. Transit Scatter Plot

### Simple English Explanation
The **Scatter Plot** is a detective tool. It helps you answer the question: *"Is there a relationship between who lives in an area and how good their transit is?"*

*   **How to read it:** Each dot on the chart represents one county.
*   **The X-Axis (Bottom):** Shows a social factor, like "Median Household Income" or "Poverty Rate."
*   **The Y-Axis (Side):** Shows a transit factor, like "Wait Time" or "Access Percentage."

If you see the dots forming a line going up or down, it means there is a pattern. For example, if dots for "Income" go up as "Wait Time" goes down, it tells us that richer areas have shorter wait times. A red line (Trend Line) is drawn through the dots to make this pattern easier to see.

### Technical Specifications
*   **Coordinate Mapping:**
    *   **X-Variable:** User-selected Equity Metric (sourced from `Employment_Data`, `Income_Data`, etc.).
    *   **Y-Variable:** User-selected Transit Metric (sourced from `StateWiseComputation2`).
*   **Data Processing:** The frontend joins two disparate datasets based on the common `FIPS` code or normalized County Name. It filters out null values to ensure data integrity.
*   **Linear Regression (Trend Line):**
    *   **Algorithm:** We calculate the "Line of Best Fit" client-side using the **Least Squares method**.
    *   **Calculation:**
        1.  Calculate mean of X and Y.
        2.  Calculate slope ($m$) using the formula: $m = \frac{\sum(x - \bar{x})(y - \bar{y})}{\sum(x - \bar{x})^2}$.
        3.  Calculate intercept ($b$): $b = \bar{y} - m\bar{x}$.
    *   **Rendering:** The resulting line equation ($y = mx + b$) is plotted as a separate `line` dataset on top of the `scatter` points.
*   **Color Coding:** Points are assigned colors dynamically to differentiate them, often using a cyclic color palette to ensure readability.

