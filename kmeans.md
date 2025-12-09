# K-means Clustering Documentation

## Overview
The K-means clustering analysis groups geographical areas (states or counties) into distinct categories based on the relationship between **Transit Service** (Supply) and **Equity Needs** (Demand). This helps policymakers identify areas that require different intervention strategies.

## Methodology

### 1. Algorithm: K-Means
We use the K-Means clustering algorithm with a fixed number of clusters (**K=4**).
*   **Why K=4?** The interaction between two variables (Transit Quality and Equity Need) naturally forms four logical quadrants (High/Low Transit vs. High/Low Need).

### 2. Semantic Initialization (Fixed Centroids)
To ensure the clusters always have consistent, meaningful definitions, we initialize the algorithm with "Semantic Corners" rather than random points. This anchors the clusters to specific real-world concepts.

The axes are normalized from 0 to 1:
*   **X-Axis (Equity/Need):** 0 = Low Need (High Income), 1 = High Need (Low Income/Poverty).
*   **Y-Axis (Transit/Service):** 0 = Good Service (High Access), 1 = Poor Service (Low Access).

**The 4 Anchors:**
1.  **High Access (0, 0):** Low Need, Good Service.
    *   *Meaning:* Affluent areas that already have excellent transit.
2.  **Service Gap (0, 1):** Low Need, Poor Service.
    *   *Meaning:* Affluent areas with poor transit (often suburban/rural where cars are dominant).
3.  **Synergy (1, 0):** High Need, Good Service.
    *   *Meaning:* Areas where the population needs transit (e.g., low income) and the service is actually good. This is the ideal equitable outcome.
4.  **Critical (1, 1):** High Need, Poor Service.
    *   *Meaning:* Areas with high poverty/need but very poor transit access. These are the top priority for investment.

### 3. Normalization (Rank-Based)
Before clustering, raw data values (e.g., "25 minutes" or "$45,000") are converted into a normalized 0-1 scale.
*   **Method:** Percentile Ranking.
*   **Why?** Real-world data often has extreme outliers that distort linear normalization. Ranking ensures that the "median" county is always at 0.5, regardless of the absolute values.
*   **Handling Direction:**
    *   For **Income** (High is "Good", Low is "Need"), we invert the rank so that Low Income = 1 (High Need).
    *   For **Access %** (High is "Good"), we invert so that Low Access = 1 (Poor Service).
    *   For **Wait Time** (Low is "Good"), we keep the rank so that High Wait Time = 1 (Poor Service).

### 4. Finding Clusters (Post-Normalization)
Once the data points are normalized to the [0, 1] space, the algorithm proceeds as follows:

**Step 1: Initialization**
*   The system uses the 4 Fixed Anchors (0,0), (0,1), (1,0), (1,1) as the initial "Centroids". This makes the clustering deterministic (repeatable) and semantically meaningful.

**Step 2: Assignment**
*   For every data point (geographic area), we calculate the **Euclidean Distance** to each of the 4 centroids.
    $$ \text{Distance} = \sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2} $$
*   The point is assigned to the cluster with the nearest centroid.

**Step 3: Update Centroids**
*   After all points are assigned, the centroids are moved to the **mean position** (average X and average Y) of all points currently assigned to that cluster.
*   *Note:* If a cluster becomes empty, its centroid remains at the fixed anchor position to preserve the semantic category.

**Step 4: Iteration**
*   Steps 2 and 3 are repeated until the centroids stop moving or a maximum limit of **30 iterations** is reached.

**Step 5: Intensity Calculation**
*   Once the final clusters are set, we calculate an "Intensity Score" for each point.
*   This score represents how "typical" the point is for its cluster.
*   It is calculated based on the distance from the cluster's anchor point. Points closer to the semantic corner (e.g., exactly 1,1 for "Critical") get a higher intensity score (closer to 1.0), while boundary points get a lower score (closer to 0.35).

### 5. Levels of Analysis
The clustering can be performed at two geographic levels:
*   **State Level:** Compares all 50 states against each other to see national trends.
*   **County Level:** Compares all counties *within* a single state (or across selected states) to find local disparities.
