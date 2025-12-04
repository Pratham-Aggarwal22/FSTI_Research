# TransitHub - Project Specifications & Documentation

## 1. Project Overview
**TransitHub** is a comprehensive web-based platform designed for exploring, visualizing, and analyzing public transit accessibility and equity metrics across the United States. It serves as a bridge between complex transit data and policymakers/researchers, offering interactive maps, advanced statistical comparison tools, clustering analysis, and an AI-powered assistant.

## 2. Metrics & Data Sources

### 2.1. Transit Metrics (Real-Time Data)
These metrics are derived from **real-time data collection** and analysis of transit systems, capturing the actual user experience of public transportation.

*   **Travel Time Efficiency:**
    *   **Transit to Car Travel Time Ratio:** Compares transit duration vs. driving (values closer to 1.0 are better).
    *   **Travel Time by Transit:** Total duration from origin to destination.
    *   **Travel Time by Car:** Driving duration for the same route.
    *   **In-Vehicle Travel Time:** Time spent inside the vehicle.
    *   **Out-of-Vehicle Travel Time:** Time spent walking, waiting, or transferring.
    *   **In-Vehicle to Out-of-Vehicle Ratio:** Efficiency measure of moving vs. waiting/walking.

*   **Accessibility & Comfort:**
    *   **Percent Access:** Percentage of population with initial walk < 4 miles and wait < 60 mins.
    *   **Initial Walk Distance:** Distance to the first stop (Miles).
    *   **Initial Walk Time:** Time to walk to the first stop (Minutes).
    *   **Total Walk Distance:** Aggregate walking distance for the entire trip.
    *   **Total Walk Time:** Aggregate walking time.

*   **Service Quality:**
    *   **Initial Wait Time:** Average wait for the first vehicle.
    *   **Total Wait Time:** Aggregate waiting time including transfers.
    *   **Number of Transfers:** Average vehicle changes required.
    *   **Sample Size:** Number of routes/trips analyzed for reliability context.

### 2.2. Equity Metrics (Census Data)
Socio-economic indicators are sourced directly from **Census data** to contextualize transit access against population demographics.

*   **Employment:** Employment status by gender, education level, and enrollment.
*   **Income:** Poverty levels, Median Household Income, Gini Index (inequality).
*   **Race:** Population breakdowns by racial/ethnic groups.
*   **Housing:** Household composition, occupancy types, and age demographics.

## 3. Charts & Visualizations
The platform employs a diverse suite of visualizations to reveal patterns, correlations, and outliers.

### 3.1. Interactive Map Explorer
*   **Visual:** Choropleth Maps (Color-coded geographic regions).
*   **Function:**
    *   **National View:** Displays state-level averages across the US.
    *   **Drill-Down:** Users can click a state to zoom into county-level data.
    *   **Equity Overlay:** Toggle socio-economic layers on top of transit maps.

### 3.2. Statistical Comparison Dashboard
A dedicated interface for deep-dive comparison between multiple states and counties.
*   **Visual:** **Statistical Dot Plot** with Range Bars.
*   **Components:**
    *   **Mean:** Circle symbol (Blue).
    *   **10th Percentile:** Square symbol (Yellow) - represents the "best served" 10%.
    *   **90th Percentile:** Diamond symbol (Red) - represents the "worst served" 10%.
    *   **Min/Max:** Triangle symbols (Green/Orange) showing the absolute outliers.
    *   **Range Bars:** Subtle background bars visualizing the full spread (Min to Max) of the data.
*   **Features:**
    *   **Multi-State Comparison:** Side-by-side analysis of selected states.
    *   **Smart County Suggestions:** Algorithms suggest "Best Counties" for comparison based on data distinctiveness.
    *   **Hierarchical Selection:** Filter by Category (Transit/Equity) -> Subcategory (Frequency/Income) -> Specific Metric.

### 3.3. Equity vs. Transit Analysis Tools
Advanced analytical tools to find correlations between social factors and transit quality.

*   **Scatter Plot Analysis:**
    *   **Visual:** 2D Scatter Plot.
    *   **X-Axis:** Selected Equity Metric (e.g., Median Household Income).
    *   **Y-Axis:** Selected Transit Metric (e.g., Access Percentage).
    *   **Goal:** Visualizes correlation. For example, "Do lower-income areas have longer wait times?"

*   **Cluster Analysis (K-Means):**
    *   **Algorithm:** Client-side **K-Means Clustering**.
    *   **Function:** Automatically segments geographies into groups based on their performance in both Equity and Transit dimensions.
    *   **Cluster Types:** Groups are classified and color-coded (e.g., "Critical" for high poverty + poor transit, "Best" for high income + good transit).
    *   **Visual:** Map regions are colored by their assigned cluster, revealing spatial patterns of inequality.

### 3.4. Frequency Distribution Charts
Histograms showing the distribution of travel experiences across the population (e.g., "How many people wait 0-5 mins vs 15-20 mins?").
*   **Available Charts:**
    *   Travel Time Distribution (Transit vs. Car).
    *   Walk Time & Distance Distributions (Initial & Total).
    *   Wait Time Distributions.
    *   Number of Transfers Distribution.

## 4. AI Chatbot ("TransitViz")

### 4.1. Feature Description (Simple English)
The **TransitViz Chatbot** is like a smart assistant for the dashboard. Instead of clicking through menus and charts to find a specific number, you can just type a question in plain English.

For example, you can ask: *"How does transit wait time in New York compare to California?"* or *"Show me the poverty levels in Cook County."*

The chatbot understands what you are looking for, searches through the massive database of transit and census records for you, and writes back a clear, natural answer. It can even suggest the right charts to look at. It remembers your conversation, so you can ask follow-up questions naturally.

### 4.2. Technical Specifications
The chatbot operates on a **Planner-Executor-Writer** architecture to ensure accuracy and reliability.

1.  **Planner (Brain):**
    *   **Model:** OpenAI GPT-4o-mini.
    *   **Role:** Analyzes the user's natural language query.
    *   **Output:** Generates a structured JSON execution plan containing the **Intent** (e.g., `compare`, `metric_lookup`), **Metrics** (specific database keys), and **Geographies** (State/County resolution).

2.  **Executor (Action):**
    *   **Role:** Interacts with the MongoDB database layer.
    *   **Logic:**
        *   Parses the JSON plan.
        *   Resolves fuzzy geographic names (e.g., "St. Louis" -> "Saint Louis County").
        *   Aggregates data across multiple databases (`StateWiseComputation2` for transit, `Employment_Data`/`Income_Data` etc. for equity).
        *   Returns raw numeric data and metadata.

3.  **Writer (Voice):**
    *   **Model:** OpenAI GPT-4o-mini.
    *   **Role:** Takes the raw JSON data from the Executor and synthesizes it into a human-readable narrative.
    *   **Constraint:** Strictly grounded in the provided data to prevent hallucinations. Cites sources and years for every data point.

## 5. System Architecture

### Backend
*   **Runtime:** Node.js & Express.js
*   **Database:** MongoDB (Atlas)
    *   **Transit Data:** `StateWiseComputation2` (AverageValues, Frequency distributions).
    *   **Equity Data:** `Employment_Data`, `Income_Data`, `Race_Data`, `Housing_Data`.
    *   **User Data:** `Users` (Auth), `BotData` (Chat logs).
*   **Authentication:** JWT (JSON Web Tokens) with secure cookie sessions.

### Frontend
*   **Framework:** EJS Templates with Vanilla JavaScript.
*   **Libraries:**
    *   **D3.js:** For map rendering and geographic interactions.
    *   **Chart.js:** For rendering Statistical Dot Plots, Scatter Plots, and Frequency Bar Charts.
    *   **Markdown:** For rendering chatbot responses.
*   **Algorithms:** Custom client-side implementation of **K-Means** for real-time cluster analysis.

## 6. API Endpoints Overview
*   **Auth:** `/auth/login`, `/auth/signup`
*   **Comparison:**
    *   `/comparison/api/statistical-data`: Fetches data for Dot Plots.
    *   `/comparison/api/comparison-dotplot`: Config data for metrics.
    *   `/comparison/api/best-counties`: Algorithm to suggest relevant counties.
*   **Chatbot:** Internal service handling via `handleChat` function.
