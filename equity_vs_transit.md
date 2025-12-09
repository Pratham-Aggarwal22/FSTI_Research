# Equity vs. Transit Scatter Plot Documentation

## Overview
This visualization plots the relationship between **Social Equity** (x-axis) and **Transit Accessibility** (y-axis). It serves as the visual interface for the K-Means clustering analysis, allowing users to intuitively see the trade-offs and correlations between demographics and infrastructure.

## What it Shows

### The Axes
*   **X-Axis (Equity Need):** Represents the demographic "need" for transit.
    *   *Left:* Lower Need (e.g., Higher Income, Lower Unemployment).
    *   *Right:* Higher Need (e.g., Lower Income, Higher Poverty).
*   **Y-Axis (Transit Service):** Represents the quality of transit infrastructure.
    *   *Bottom:* Better Service (e.g., High Percent Access, Low Wait Times).
    *   *Top:* Worse Service (e.g., Low Percent Access, High Wait Times).

### Trends and Quadrants
The plot reveals four distinct "types" of communities, corresponding to the K-Means clusters:

1.  **Synergy (Bottom-Right):**
    *   *Description:* These points represent communities with **High Need** (e.g., low income) that enjoy **Good Service**.
    *   *Trend:* This is the "success zone" for equitable transit planning. It means resources are correctly allocated to those who rely on them most.

2.  **Critical (Top-Right):**
    *   *Description:* These points represent communities with **High Need** but **Poor Service**.
    *   *Trend:* These are "transit deserts" for vulnerable populations. The visual gap here highlights urgent areas for policy intervention.

3.  **High Access (Bottom-Left):**
    *   *Description:* Communities with **Low Need** (e.g., wealthy) that have **Good Service**.
    *   *Trend:* Often dense urban centers that are gentrified or historically wealthy. While good for ridership, it may indicate resource concentration in areas with high car ownership rates.

4.  **Service Gap (Top-Left):**
    *   *Description:* Communities with **Low Need** and **Poor Service**.
    *   *Trend:* Typically wealthy suburbs or rural areas where public transit is sparse, but the population likely relies on private vehicles, so the social impact is lower.

## Visual Encoding
*   **Color:** Points are colored according to their assigned cluster (e.g., Red for Critical, Green for Synergy).
*   **Position:** Determined by the **Rank-Based Normalization** of the selected metrics. This ensures that the visual spread is uniform and not clumped by outliers.

