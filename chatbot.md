# Chatbot Documentation

## Overview
The Chatbot is an intelligent AI assistant designed to help users query the vast transit and equity database using natural language. It acts as a bridge between complex database schemas and simple user questions.

## Architecture
The chatbot operates using a multi-stage pipeline pattern:

1.  **User Query:** The user asks a question (e.g., "What is the average wait time in Texas?").
2.  **Planner Service (Brain):** An AI model analyzes the request and creates a structured execution plan.
3.  **Execution Layer:** The system executes the plan, fetching real data from the MongoDB database and performing necessary calculations (using Python logic).
4.  **Writer Service (Voice):** A second AI model takes the raw data "facts" and generates a natural, helpful response.

## Technical Implementation

### 1. Prompt Engineering (The "Planner")
We use a specialized system prompt for the Planner model (`gpt-4o`).
*   **Goal:** To convert vague natural language into a strict JSON action plan.
*   **Catalog Awareness:** The prompt is dynamically injected with the list of available metrics (Transit, Frequency, Equity) so it knows exactly what data exists.
*   **Strict Rules:** The prompt forbids the model from hallucinating data. It enforces a specific JSON schema that defines:
    *   Which states/counties to fetch.
    *   Which specific metric keys to query (handling fuzzy matching).
    *   What Python code to run for aggregation (e.g., calculating an average of a list).

### 2. The Model
*   **Model Used:** `gpt-4o` (or `gpt-4`).
*   **Why?** The reasoning required to map natural language to complex database queries and handle multi-step logic (like "compare Texas and California") requires the high-level reasoning capabilities of a frontier model. Smaller models often fail to adhere to the strict JSON schema or misinterpret complex data relationships.

### 3. Optimization & Flow
*   **Schema Caching:** The database schema (available metrics and states) is cached at startup. This prevents the bot from needing to scan the entire database for every query, significantly reducing latency.
*   **Targeted Fetching:** The Planner outputs a plan that fetches *only* the specific fields requested. If a user asks about "Texas," we do not fetch data for all 50 states.
*   **Python Sandbox:** For questions involving math (e.g., "What is the difference between X and Y?"), the Planner generates a safe, restricted Python snippet to perform the calculation on the fetched data. This ensures mathematical accuracy, which LLMs often struggle with.

### 4. Staying on Topic
*   **Validation:** The Planner prompt includes a "Status Check". If a user asks a question unrelated to transit or equity (e.g., "Who is the president?"), the model returns a status of `"invalid"`, and the system immediately returns a fallback message without wasting resources on database lookups.
*   **Context Injection:** The Writer model is strictly instructed to answer using *only* the provided "Facts from Database." It is explicitly told not to invent numbers or use external knowledge.
