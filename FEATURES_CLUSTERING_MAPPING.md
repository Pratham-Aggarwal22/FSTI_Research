# Clustering & Mapping Features

## 1. Cluster Analysis (K-Means)

### Simple English Explanation
**Cluster Analysis** is an advanced tool that automatically groups geographic areas (like counties) that are similar to each other. Instead of you having to guess which areas are "similar," the computer uses math to find these groups for you.

We look at two things at once: **Equity** (who lives there) and **Transit** (how good the service is). The system sorts every area into one of four groups:
1.  **Critical (Red):** Areas with high social needs (e.g., low income) but poor transit. These areas need help the most.
2.  **Synergy (Yellow):** Areas with high social needs that actually have good transit. This is a success story!
3.  **Service Gap (Blue):** Areas that don't have high social needs but have surprisingly poor transit.
4.  **High Access (Green):** Areas with lower needs and great transit.

This creates a "Smart Map" that tells a story about fairness and efficiency instantly.

### Technical Specifications
This feature implements the **K-Means Clustering Algorithm** entirely on the client-side (in the browser) to allow for real-time analysis without server round-trips.

*   **Algorithm:** Standard K-Means Clustering.
    *   **$k$ (Number of Clusters):** Fixed at 4 for consistency (Critical, Synergy, Service Gap, High Access).
    *   **Dimensions:** 2D space ($x$: Equity Score, $y$: Transit Score).
*   **Normalization:** Before clustering, all data is normalized to a 0-1 scale. This prevents a metric with large numbers (like Income: $50,000) from overpowering a metric with small numbers (like Wait Time: 15 mins).
    *   Formula: $x_{norm} = \frac{x - min}{max - min}$.
*   **Centroid Initialization:** We use specific "Reference Points" to seed the clusters to ensure the resulting groups match our semantic definitions (e.g., "Critical" is always initialized near the "High Need / Poor Service" corner of the graph).
    *   Critical: (1, 1) [assuming normalized 'bad' is 1]
    *   High Access: (0, 0)
*   **Iteration:** The algorithm iterates (assigns points to nearest centroid -> recalculates centroid) until convergence or a maximum of 30 iterations to prevent browser freezing.

---

## 2. Natural Breaks (Jenks) Map Coloring

### Simple English Explanation
When you look at our colored maps, we don't just chop the data into even pieces (like 0-33, 34-66, 67-100). That can be misleading if most of the data is clumped together.

Instead, we use a smart method called **Natural Breaks (or Jenks)**. Imagine you have a handful of sand and you drop it on a table. It will naturally form little piles. The Jenks method looks for these "natural piles" in the data.

*   **Why we use it:** It makes the map more accurate. It ensures that red areas are genuinely different from green areas, grouping similar values together and making the differences between groups stand out.

### Technical Specifications
**Jenks Natural Breaks Optimization** is a data clustering method designed to determine the best arrangement of values into different classes.

*   **Objective:** Minimize the variance *within* classes and maximize the variance *between* classes.
*   **Algorithm:**
    1.  **Input:** A sorted array of metric values from all counties/states.
    2.  **Process:** We use a dynamic programming approach (calculating matrices of variance) to test different "break points" in the sorted data.
    3.  **Complexity:** $O(n^2)$, where $n$ is the number of data points. Because we are processing potentially 3,000+ counties, we implement optimizations (like sampling or falling back to Quantiles) if the dataset is too large for instant rendering.
*   **Implementation Details:**
    *   Found in `Public/js/app.js` under `naturalBreaks()`.
    *   It returns an array of break values (e.g., `[15.2, 28.4, 45.1]`).
    *   These values are passed to the D3.js color scale (`d3.scaleThreshold`) to determine which color bucket a geographic feature falls into.

