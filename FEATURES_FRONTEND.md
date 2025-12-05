# Frontend Architecture & Features

## 1. Frontend Overview

### Simple English Explanation
The frontend is the "face" of the TransitHub application. It is the part of the website you interact with directly in your browser. Think of it as a smart control panel that takes complex data from our servers and turns it into easy-to-understand maps, charts, and reports.

The design focuses on **ease of use**. You start with a big picture view of the entire USA, and with a simple click, you can zoom in to see details about specific states and even individual counties. The colors on the map change automatically to show you where transit is good (green) and where it needs improvement (red).

Key components include:
*   **Interactive Maps:** You can hover over any state or county to see exact numbers.
*   **Dynamic Charts:** Graphs that update instantly when you change your selection.
*   **Smart Menus:** Dropdowns that guide you to the exact data you want to see.
*   **AI Assistant:** A chat window that acts like a helper, answering questions in plain English.

### Technical Specifications
The frontend is built using a **Server-Side Rendering (SSR)** approach mixed with dynamic client-side interactivity. This ensures fast initial load times while allowing for rich, interactive data exploration.

*   **Template Engine:** **EJS (Embedded JavaScript)**. The HTML is generated on the server, allowing us to inject initial data and configuration directly into the page before it reaches the user's browser.
*   **Core Framework:** **Vanilla JavaScript (ES6+)**. We deliberately avoided heavy frameworks like React or Angular to keep the application lightweight and highly optimized for data visualization performance.
*   **Visualization Libraries:**
    *   **D3.js (Data-Driven Documents):** Used for the complex choropleth maps. D3 handles the SVG rendering of geographic paths (GeoJSON) and calculates the color scales based on data domains.
    *   **Chart.js:** Used for all statistical graphs, including the Dot Plots, Scatter Plots, and Bar Charts. We utilize specific plugins for features like zooming and custom annotations (e.g., the range bars in comparison charts).
*   **State Management:** The application uses a centralized `state` object in `app.js` to track the currently selected `view` (national/state/county), `metric` (transit/equity), and `selection` (specific IDs). This state acts as the "single source of truth" for the UI.
*   **CSS Architecture:** Custom CSS using CSS Grid and Flexbox for layout. Variables (CSS Custom Properties) are used for consistent theming (colors, spacing) and to support features like Dark Mode.

---

## 2. User Interface (UI) Components

### Simple English Explanation
The screen is divided into three main areas to help you find information quickly:
1.  **The Map (Center):** The main stage where data is visualized geographically.
2.  **The Control Panel (Left):** Your command center for changing what data is shown (e.g., switching from "Wait Time" to "Income").
3.  **The Detail View (Right/Overlay):** Where detailed charts and the AI assistant appear.

### Technical Specifications
*   **Responsive Layout:** The application uses media queries to adapt the layout for different screen sizes, though it is optimized for desktop viewing due to the complexity of the data visualizations.
*   **Event Delegation:** To maintain performance with thousands of map elements (counties), event listeners are attached to parent containers rather than individual DOM nodes where possible.
*   **Asynchronous Data Loading:** When a user clicks a state, the frontend uses `fetch` API calls to asynchronously load the heavy county-level geometry and data, showing a loading spinner (`.loader`) to provide feedback.

