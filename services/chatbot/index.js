import OpenAI from 'openai';
import { spawnSync } from 'child_process';

const DEFAULT_TRANSIT_DB = 'StateWiseComputation2';
const TRANSIT_STATE_COLLECTION = 'AverageValues';
const TRANSIT_COUNTY_COLLECTION = 'Averages';
const FREQUENCY_PREFIX = 'Frequency-';

const EQUITY_DATABASES = [
  { key: 'employment', dbName: 'Employment_Data', displayName: 'Employment', stateCollection: 'State Level', countyCollection: 'County Level' },
  { key: 'income', dbName: 'Income_Data', displayName: 'Income', stateCollection: 'State Level', countyCollection: 'County Level' },
  { key: 'race', dbName: 'Race_Data', displayName: 'Race', stateCollection: 'State Level', countyCollection: 'County Level' },
  { key: 'housing', dbName: 'Housing_Data', displayName: 'Housing', stateCollection: 'State Level', countyCollection: 'County Level' }
];

const STATE_DB_CORRECTIONS = { Alabama: 'Albama', Michigan: 'MIchigan' };

const FALLBACK_MESSAGE =
  'Please ask regarding transit accessibility of the United States.';

function normalize(text) {
  return (text || '').toString().trim().toLowerCase();
}

function normalizeName(name) {
  return (name || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/county$/, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function cleanCountyForTransit(name = '') {
  return name.toString().trim().toUpperCase();
}

// Helper for fuzzy matching metric keys in documents
function normalizeMetricKey(key) {
  return (key || '').toString().toLowerCase()
    .replace(/\s+/g, '') // remove spaces
    .replace(/&/g, ',')  // FIX: Replace ampersand with comma to match DB format
    .replace(/miles/g, 'mi') // standardize on short form
    .replace(/minutes/g, 'min');
}

function findMetricValue(doc, metric) {
  if (!doc) return null;
  // 1. Exact match
  if (doc[metric] !== undefined) return doc[metric];

  // 2. Case-insensitive match
  const lower = metric.toLowerCase();
  const keys = Object.keys(doc);
  let match = keys.find(k => k.toLowerCase() === lower);
  if (match) return doc[match];

  // 3. Normalized match (remove spaces, handle unit variations)
  const normalizedMetric = normalizeMetricKey(metric);
  match = keys.find(k => normalizeMetricKey(k) === normalizedMetric);
  if (match) return doc[match];
  
  return null;
}

// Helper to clean county name for Equity DBs: e.g. "FRESNO" -> "Fresno County"
// Also handles cases where title case is needed.
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}

function cleanCountyForEquity(name = '') {
  let trimmed = name.toString().trim();
  // If it's all uppercase (like from Transit DB), convert to Title Case
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 2) {
    trimmed = toTitleCase(trimmed);
  }
  
  if (/county$/i.test(trimmed)) return trimmed; // Already has suffix
  return `${trimmed} County`;
}

class SchemaCatalog {
  constructor({ mongoClient }) {
    this.mongoClient = mongoClient;
    this.states = [];
    this.stateAliasMap = new Map();
    this.transitMetrics = [];
    this.frequencyMetrics = [];
    this.equityMetrics = [];
    this.equityMetricsByDb = new Map(); // dbName -> metrics[]
    this.frequencyLookup = new Map(); // label -> { metric, bins, collection }
    this.equityLookup = new Map(); // metric -> dbName
  }

  async build() {
    await this.loadStates();
    await this.loadTransitMetrics();
    await this.loadFrequencyMetrics();
    await this.loadEquityMetrics();
  }

  async loadStates() {
    try {
      const collection = this.mongoClient.db(DEFAULT_TRANSIT_DB).collection(TRANSIT_STATE_COLLECTION);
      const sample = await collection.findOne({});
      if (!sample) return;
      this.states = Object.keys(sample)
        .filter(key => key && !['_id', 'title', 'District of Columbia', 'DC', 'Washington DC', 'Washington D.C.'].includes(key))
        .sort();
      this.stateAliasMap.clear();
      this.states.forEach(state => {
        this.stateAliasMap.set(normalizeName(state), state);
        this.stateAliasMap.set(normalizeName(`${state} state`), state);
      });
    } catch (err) {
      // Error handling without console logging
    }
  }

  async loadTransitMetrics() {
    try {
      const titles = await this.mongoClient
        .db(DEFAULT_TRANSIT_DB)
        .collection(TRANSIT_STATE_COLLECTION)
        .distinct('title');
      this.transitMetrics = (titles || [])
        .filter(t => t && !['Washington DC', 'DC', 'District of Columbia'].includes(t))
        .sort();
    } catch (err) {
      // Error handling without console logging
    }
  }

  async loadFrequencyMetrics() {
    try {
      const collections = await this.mongoClient.db(DEFAULT_TRANSIT_DB).listCollections().toArray();
      const freqCollections = collections
        .map(c => c.name)
        .filter(name => name && name.startsWith(FREQUENCY_PREFIX));

      for (const collName of freqCollections) {
        const doc = await this.mongoClient.db(DEFAULT_TRANSIT_DB).collection(collName).findOne({});
        if (!doc) continue;
        const bins = Object.keys(doc).filter(k => k && !['_id', 'title'].includes(k));
        const metricName = collName.replace(/^Frequency-\s*/i, '').trim();
        const label = `${metricName} [Bins: ${bins.join(', ')}]`;
        this.frequencyMetrics.push(label);
        this.frequencyLookup.set(label, { metric: metricName, bins, collection: collName });
      }
    } catch (err) {
      // Error handling without console logging
    }
  }

  async loadEquityMetrics() {
    for (const equityDb of EQUITY_DATABASES) {
      try {
        const doc = await this.mongoClient
          .db(equityDb.dbName)
          .collection(equityDb.stateCollection)
          .findOne({});
        if (!doc || !doc.data || typeof doc.data !== 'object') continue;
        Object.keys(doc.data)
          .filter(k => k !== 'NAME')
          .forEach(metric => {
            if (!this.equityLookup.has(metric)) {
              this.equityMetrics.push(metric);
              this.equityLookup.set(metric, equityDb.dbName);
            }
            if (!this.equityMetricsByDb.has(equityDb.dbName)) {
              this.equityMetricsByDb.set(equityDb.dbName, []);
            }
            const list = this.equityMetricsByDb.get(equityDb.dbName);
            if (!list.includes(metric)) list.push(metric);
          });
      } catch (err) {
        // Error handling without console logging
      }
    }
  }

  resolveState(value) {
    if (!value) return null;
    const normalized = normalizeName(value);
    if (this.stateAliasMap.has(normalized)) return this.stateAliasMap.get(normalized);
    const match = this.states.find(state => normalizeName(state) === normalized);
    return match || null;
  }

  formatStateDatabaseName(state) {
    if (!state) return null;
    const canonical = this.resolveState(state) || state;
    const corrected = STATE_DB_CORRECTIONS[canonical] || canonical;
    return corrected.replace(/\s+/g, '_');
  }

  findFrequencyMetric(label) {
    return this.frequencyLookup.get(label) || null;
  }

  findEquityDb(metric) {
    return this.equityLookup.get(metric) || null;
  }
}

class PlannerService {
  constructor({ openai, catalog, model = process.env.OPENAI_PLANNER_MODEL || 'gpt-4o' }) {
    this.openai = openai;
    this.catalog = catalog;
    this.model = model;
  }

  async plan(userMessage) {
    const transitList = JSON.stringify(this.catalog.transitMetrics, null, 0);
    const frequencyList = JSON.stringify(this.catalog.frequencyMetrics, null, 0);
    const equityLines = EQUITY_DATABASES.map(db => {
      const metrics = this.catalog.equityMetricsByDb.get(db.dbName) || [];
      return `- Equity Metrics (${db.displayName}): ${JSON.stringify(metrics, null, 0)}`;
    }).join('\n');

    const systemPrompt = `
You are the first-stage planner for a transit & equity chatbot.

User Question:
${userMessage}

AVAILABLE CATALOGS (choose only from these):
- Transit Metrics: ${transitList}
  (Transit accessibility data and its metrics define the transit access in a state/county. These metrics are computed from sampled addresses to the courthouse, where "Sample Size" is the number of addresses sampled. This refers to public transport (transit). These metrics were derived after running Google address services. Percent Access is the percentage of that sample when multiplied by 100.)
- Frequency Metrics: ${frequencyList}
  (Frequency metrics are the percentage of addresses for that metric lying in each bin.)
- Equity Metrics grouped by source database (Employment, Income, Race, Housing):
${equityLines}
  (Pick equity metrics from the relevant category—e.g., income-related requests pick from Income, employment-related from Employment, etc.)

STATUS RULES:
- "valid": the user asks for transit/equity data comparisons or values.
- "invalid": unrelated to transit/equity.
- "definition": asking how metrics are calculated or data sources.

If status is "invalid" or "definition", return only {"status":"invalid"}.

If status is "valid", output JSON as follows. This is an EXAMPLE STRUCTURE ONLY; replace states/counties/metrics with what the user actually asked for.

JSON OUTPUT FORMAT (example structure):
{
  "status": "valid",
  "states": [ {"name": "ExampleState1", "var": "s1"}, {"name": "ExampleState2", "var": "s2"} ],
  "counties": [
      {"state": "ExampleState1", "name": "ExampleCounty", "var": "c1"},
      {"state": "ExampleState2", "name": "__ALL__", "var": "c2"} // c2 will be a list of county names
  ],
  "transit_state": [ {"state": "ExampleState1", "metric": "Some Transit Metric", "var": "v1"} ],
  "transit_county": [
      {"state": "ExampleState1", "county": "ExampleCounty", "metric": "Some Transit Metric", "var": "v2"},
      {"state": "ExampleState2", "county": "__ALL__", "metric": "Some Transit Metric", "var": "v3"} // v3 will be a list of numbers aligned with c2
  ],
  "frequency_state": [ {"state": "ExampleState1", "metric": "Some Frequency Metric [Bins: ...]", "bin": "a-bin", "var": "v4"} ],
  "frequency_county": [ {"state": "ExampleState1", "county": "ExampleCounty", "metric": "Some Frequency Metric [Bins: ...]", "bin": "another-bin", "var": "v5"} ],
  "equity_state": [ {"state": "ExampleState1", "metric": "Some Equity Metric", "var": "v6"} ],
  "equity_county": [ {"state": "ExampleState2", "county": "__ALL__", "metric": "Some Equity Metric", "var": "v7"} ],
  "code_snippet": "if v2 is not None: print(f'ExampleCounty Wait Time: {v2}');\\nif isinstance(v3, list) and v3:\\n    nums = [x for x in v3 if isinstance(x, (int, float))]\\n    if nums:\\n        avg = sum(nums)/len(nums)\\n        print(f'Average wait in {s2} counties: {avg}')"
}

ADDITIONAL RULES:
- Do NOT include DC in states. The input list may say "DC" or "District of Columbia", but you MUST NOT include it in your plan.
  - If the user explicitly asks for DC/District of Columbia, set "status": "definition" and return.
  - If the user implies all states, use "name": "__ALL__" instead of listing them.
  - "__ALL__" counties means fetch every county in that state; metrics become lists aligned to that county list.
- NAME FORMATTING: When adding a county/state name in the JSON (states/counties arrays), use ONLY the name. Do NOT append "County" or "State" suffixes (e.g., use "Fresno", not "Fresno County").
- Variables (v1, v2...) are preloaded with numbers or None; always check for None before printing.
- Frequency and percent access metrics are already scaled to 0-100 percentages. Do NOT multiply by 100 in the python code.
  - Lists may contain None for missing data. Filter None values first (e.g., nums = [x for x in v1 if x is not None]). Check if the filtered list is empty before calling max(), min(), or calculating averages to avoid errors.
  - When printing, include exact county/state names and metric names; if asked, include county names with their values.
  - DATA PAIRING RULE: When the user asks to identify specific locations (e.g., "which county", "which state", "highest", "lowest", "worst", "best"), you MUST pair the name list (e.g., c1, s1) with the value list (e.g., v1, v2) in your Python code.
    - Use zip() to combine them: pairs = zip(name_list, value_list)
    - Filter out None values.
    - Sort or filter the paired list to find the answer.
    - Print BOTH the name and the value in the final output.
  - List all selected metrics sections (transit_state, transit_county, frequency_state, frequency_county, equity_state, equity_county) before "code_snippet". The code_snippet should use the metrics you selected.
  - Be permissive in selecting needed metrics (transit, frequency, equity) so the answer has all required data for the user’s question.
  - COMBINED QUERIES: If the user's question combines Equity and Transit (e.g., "transit access for low income areas"), you MUST select metrics from BOTH categories. Your code snippet should be smart enough to filter or compute considering all of them.
  - If the question mentions a specific demographic (e.g. 'low income', 'poverty', 'African American'), YOU MUST select a relevant Equity Metric for that group so we can see the context, even if the user asks about transit.

  DATA UNDERSTANDING & METRIC SELECTION:
  - This database contains transit accessibility and equity data for US states and counties.
  - "Transit Metrics" (e.g., Percent Access, Wait Time, Walk Distance) directly measure transit accessibility. High access %, low wait times, and low walk distances indicate GOOD accessibility.
  - "Frequency Metrics" show the distribution of service quality (e.g. % of people waiting < 5 mins vs > 30 mins).
  - "Equity Metrics" describe the population demographics (Poverty, Race, Employment).
  - If a user asks about "accessibility" generally, you MUST select key Transit Metrics like "Percent Access", "Initial Wait Time", and "Initial Walk Distance" to form a complete picture.
  - If a user asks about "commute", select "Travel Duration".
  - OVERALL/COMPREHENSIVE QUERIES:
    - If the user asks about "overall transit accessibility" or broad performance, select ALL available Transit Metrics.
    - If the user asks about "overall" equity or a specific category (e.g. "overall employment"), select ALL metrics from that respective category (or all Equity categories for general equity).

  CODING RULES (Python):
  1. **Handle Lists vs Scalars**:
     - Variables like v1, s1 might be lists (if "__ALL__" used) or scalars (if specific name used).
     - ALWAYS check types: \`if isinstance(v1, list):\` vs \`else:\`.
  2. **Aggregation for National/Statewide Questions**:
     - If the user asks for a total/average (e.g. "What is the US average?"), and you have a list:
       - Filter None: \`valid = [x for x in v1 if x is not None]\`
       - Calculate Average: \`if valid: avg = sum(valid) / len(valid)\`
       - Print the average.
  3. **Ranking for "Which" Questions**:
     - Use the DATA PAIRING RULE (zip names and values) to find max/min.
  4. **Missing Data Handling**:
     - If a variable (scalar) is None, you MUST print a message saying: "Data not found for [Metric] in [Location]".
     - If a list variable contains only None values or is empty, print that no data was found for that group.
  5. **Keep it Simple**:
     - Use basic math. Do not loop excessively. Print clear, labeled results.
     - **Formatting**: Do NOT use semicolons or one-line \`if-else\` statements. Use standard Python indentation with \`\\n\` characters for line breaks.
  `;

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [{ role: 'system', content: systemPrompt }]
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('Planner returned empty response');
    let plan;
    try {
      plan = JSON.parse(content);
    } catch (err) {
      throw new Error(`Failed to parse planner JSON: ${err.message}`);
    }

    plan.status = plan.status || 'invalid';
    plan.states = Array.isArray(plan.states) ? plan.states : [];
    plan.counties = Array.isArray(plan.counties) ? plan.counties : [];
    plan.transit_state = Array.isArray(plan.transit_state) ? plan.transit_state : [];
    plan.transit_county = Array.isArray(plan.transit_county) ? plan.transit_county : [];
    plan.frequency_state = Array.isArray(plan.frequency_state) ? plan.frequency_state : [];
    plan.frequency_county = Array.isArray(plan.frequency_county) ? plan.frequency_county : [];
    plan.equity_state = Array.isArray(plan.equity_state) ? plan.equity_state : [];
    plan.equity_county = Array.isArray(plan.equity_county) ? plan.equity_county : [];
    plan.code_snippet = plan.code_snippet || '';

    // Heuristic: if the user mentions income/poverty but no equity metrics were selected, add defaults.
    const lowerMsg = (userMessage || '').toLowerCase();
    const needsEquity =
      lowerMsg.includes('income') ||
      lowerMsg.includes('low income') ||
      lowerMsg.includes('poverty') ||
      lowerMsg.includes('equity');
    // Do not auto-add equity metrics; LLM must pick explicitly based on the question.

    return plan;
  }
}

class WriterService {
  constructor({ openai, model = process.env.OPENAI_WRITER_MODEL || 'gpt-4o' }) {
    this.openai = openai;
    this.model = model;
  }

  async compose({ userMessage, statements }) {
    const systemPrompt = `
You are a helpful Transit & Equity Chatbot.
Answer the user's question using ONLY the statements provided below.
- Combine them into a natural, conversational answer.
- Interpret the data to explain what it means (e.g., is the accessibility good or bad?) rather than just listing numbers.
- Do NOT invent numbers or external facts.
- DATA MISSING RULES:
  - Generally, if statements mention "Data not found", explicitly state we do not have data for that metric/location.
  - EXCEPTION: If "Percent Access" is reported as missing/None, interpret this as meaning there is **no transit access** for that location.`;

    const userPrompt = `
User Question:
${userMessage}

Facts from Database:
${statements.join('\n')}
`;

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    return completion.choices[0]?.message?.content?.trim() || FALLBACK_MESSAGE;
  }
}

export default class ChatbotService {
  constructor({ mongoClient }) {
    this.mongoClient = mongoClient;
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY });
    if (!this.openai.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY or OPEN_AI_KEY.');
    }
    this.catalog = new SchemaCatalog({ mongoClient });
    this.planner = new PlannerService({ openai: this.openai, catalog: this.catalog });
    this.writer = new WriterService({ openai: this.openai });
    this.initialized = false;
    this.initializing = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initializing) {
      await this.initializing;
      return;
    }
    this.initializing = (async () => {
      await this.catalog.build();
      this.initialized = true;
      this.initializing = null;
    })();
    await this.initializing;
  }

  async handleChat({ message }) {
    if (!message || !message.trim()) {
      return { success: false, narrative: 'Please provide a question for the chatbot.' };
    }

    await this.initialize();

    try {
      const plan = await this.planner.plan(message);

      if (plan.status !== 'valid') {
        return { success: true, narrative: FALLBACK_MESSAGE };
      }

      const { assignments, errors } = await this.buildAssignments(plan);

      const statements = await this.runPython(plan.code_snippet, assignments);

      if (statements.error) {
        return { success: false, narrative: FALLBACK_MESSAGE };
      }

      const narrative = await this.writer.compose({ userMessage: message, statements: statements.lines });

      return {
        success: true,
        narrative,
        showDetails: {
          plan,
          assignments,
          pythonOutput: statements.lines
        }
      };
    } catch (err) {
      return { success: false, narrative: FALLBACK_MESSAGE };
    }
  }

  async buildAssignments(plan) {
    const assignments = {};
    const errors = [];

    const setVar = (key, value) => {
      if (!key) return;
      assignments[key] = value;
    };

    const resolveState = state => this.catalog.resolveState(state) || state;

    // States
    for (const st of plan.states) {
      if (!st?.var || !st.name) continue;
      if (st.name === '__ALL__') {
        setVar(st.var, this.catalog.states);
      } else {
        const resolved = resolveState(st.name);
        setVar(st.var, resolved);
      }
    }

    // Counties
    for (const ct of plan.counties) {
      if (!ct?.var || !ct.state || !ct.name) continue;
      const stateName = resolveState(ct.state);
      if (!stateName) {
        errors.push({ type: 'state_not_found', entry: ct });
        continue;
      }

      if (ct.name === '__ALL__') {
        const counties = await this.listCounties(stateName);
        setVar(ct.var, counties);
      } else {
        setVar(ct.var, cleanCountyForTransit(ct.name));
      }
    }

    // Transit - state
    for (const m of plan.transit_state) {
      if (!m?.var || !m.state || !m.metric) continue;
      
      if (m.state === '__ALL__') {
         const values = await this.fetchTransitStateAll(m.metric);
         setVar(m.var, values);
      } else {
         const stateName = resolveState(m.state);
         if (!stateName) {
           errors.push({ type: 'state_not_found', entry: m });
           continue;
         }
         const value = await this.fetchTransitState(stateName, m.metric);
         setVar(m.var, value);
      }
    }

    // Transit - county
    for (const m of plan.transit_county) {
      if (!m?.var || !m.state || !m.county || !m.metric) continue;
      const stateName = resolveState(m.state);
      if (!stateName) {
        errors.push({ type: 'state_not_found', entry: m });
        continue;
      }
      if (m.county === '__ALL__') {
        const counties = assignments[plan.counties.find(c => c.state === m.state && c.name === '__ALL__')?.var] || [];
        const values = await this.fetchTransitCountyAll(stateName, counties, m.metric);
        setVar(m.var, values);
      } else {
        const value = await this.fetchTransitCounty(stateName, m.county, m.metric);
        setVar(m.var, value);
      }
    }

    // Frequency - state
    for (const m of plan.frequency_state) {
      if (!m?.var || !m.state || !m.metric || !m.bin) continue;
      
      if (m.state === '__ALL__') {
        const values = await this.fetchFrequencyStateAll(m.metric, m.bin);
        setVar(m.var, values);
      } else {
        const stateName = resolveState(m.state);
        const value = await this.fetchFrequencyState(stateName, m.metric, m.bin);
        setVar(m.var, value);
      }
    }

    // Frequency - county
    for (const m of plan.frequency_county) {
      if (!m?.var || !m.state || !m.county || !m.metric || !m.bin) continue;
      const stateName = resolveState(m.state);
      if (m.county === '__ALL__') {
        const counties = assignments[plan.counties.find(c => c.state === m.state && c.name === '__ALL__')?.var] || [];
        const values = await this.fetchFrequencyCountyAll(stateName, counties, m.metric, m.bin);
        setVar(m.var, values);
      } else {
        const value = await this.fetchFrequencyCounty(stateName, m.county, m.metric, m.bin);
        setVar(m.var, value);
      }
    }

    // Equity - state
    for (const m of plan.equity_state) {
      if (!m?.var || !m.state || !m.metric) continue;
      
      if (m.state === '__ALL__') {
        const values = await this.fetchEquityStateAll(m.metric);
        setVar(m.var, values);
      } else {
        const stateName = resolveState(m.state);
        const value = await this.fetchEquityState(stateName, m.metric);
        setVar(m.var, value);
      }
    }

    // Equity - county
    for (const m of plan.equity_county) {
      if (!m?.var || !m.state || !m.county || !m.metric) continue;
      const stateName = resolveState(m.state);
      if (m.county === '__ALL__') {
        const counties = assignments[plan.counties.find(c => c.state === m.state && c.name === '__ALL__')?.var] || [];
        const values = await this.fetchEquityCountyAll(stateName, counties, m.metric);
        setVar(m.var, values);
      } else {
        const value = await this.fetchEquityCounty(stateName, m.county, m.metric);
        setVar(m.var, value);
      }
    }

    return { assignments, errors };
  }

  async listCounties(state) {
    const dbName = this.catalog.formatStateDatabaseName(state);
    if (!dbName) return [];
    try {
      const docs = await this.mongoClient
        .db(dbName)
        .collection(TRANSIT_COUNTY_COLLECTION)
        .find({}, { projection: { title: 1 }, limit: 1000 })
        .toArray();
      const list = docs.map(d => d?.title).filter(Boolean).map(cleanCountyForTransit);
      return list;
    } catch (err) {
      return [];
    }
  }

  async fetchTransitStateAll(metric) {
    const db = this.mongoClient.db(DEFAULT_TRANSIT_DB);
    
    // Fetch the document for this metric
    // Document structure: { title: "Initial Wait Time", "Texas": 12.5, "California": 15.2, ... }
    let doc = await db.collection(TRANSIT_STATE_COLLECTION).findOne({ title: metric });
    
    if (!doc) {
      doc = await db.collection(TRANSIT_STATE_COLLECTION).findOne({ title: { $regex: `^${metric}$`, $options: 'i' } });
    }

    if (!doc) return this.catalog.states.map(() => null);

    // Map states to values using findMetricValue logic
    const values = this.catalog.states.map(state => {
      const val = findMetricValue(doc, state);
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return typeof num === 'number' && !isNaN(num) ? num : null;
    });
    
    return values;
  }

  async fetchTransitState(state, metric) {
    const db = this.mongoClient.db(DEFAULT_TRANSIT_DB);
    
    // SCHEMA CORRECTION: In AverageValues, 'title' is the METRIC name, not the state name.
    // The document looks like: { title: "Initial Wait Time...", "Texas": 12.5, "California": 15.2, ... }
    
    // Try exact metric name first
    let doc = await db.collection(TRANSIT_STATE_COLLECTION).findOne({ title: metric });
    
    // If not found, try fuzzy match on title
    if (!doc) {
      doc = await db.collection(TRANSIT_STATE_COLLECTION).findOne({ title: { $regex: `^${metric}$`, $options: 'i' } });
    }

    if (!doc) {
      return null;
    }

    // Now look for the state value inside that document
    // We need to match the state name key (e.g. "Texas", "Alabama", etc.)
    const val = findMetricValue(doc, state);
    
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return typeof num === 'number' && !isNaN(num) ? num : null;
  }

  async fetchTransitCounty(state, county, metric) {
    const dbName = this.catalog.formatStateDatabaseName(state);
    if (!dbName) return null;
    const db = this.mongoClient.db(dbName);
    const doc = await db.collection(TRANSIT_COUNTY_COLLECTION).findOne({ title: cleanCountyForTransit(county) });
    if (!doc) {
      return null;
    }

    // SCHEMA CORRECTION: Handle "Average " prefix
    const NO_PREFIX_METRICS = [
      'Transfers',
      'Transit:Driving', 
      'Transit: Driving', // Handle potential spacing diffs
      'In-Vehicle:Out-of-Vehicle',
      'Sample Size',
      'Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)'
    ];

    // Determine the key to look for
    let searchKey = metric;
    
    // If it's NOT in the exception list, prepend "Average "
    // (Check loosely to avoid double prefixing if the prompt already had it)
    const isException = NO_PREFIX_METRICS.some(m => m.toLowerCase() === metric.toLowerCase());
    if (!isException && !metric.toLowerCase().startsWith('average ')) {
      searchKey = `Average ${metric}`;
    }

    let val = findMetricValue(doc, searchKey);
    
    // Fallback: if Average prefix didn't work, try raw metric
    if (val === null && searchKey !== metric) {
       val = findMetricValue(doc, metric);
    }
    
    // SCALING FIX: County DBs store Percent Access as 0-1.
    if (val !== null && metric.toLowerCase().includes('percent access')) {
       const num = typeof val === 'string' ? parseFloat(val) : val;
       if (typeof num === 'number' && !isNaN(num)) {
         // If it's clearly a ratio (<= 1.0), multiply by 100.
         // (Safe guard against double scaling if DB changes)
         if (Math.abs(num) <= 1.0) return num * 100;
         return num;
       }
    }

    const num = typeof val === 'string' ? parseFloat(val) : val;
    return typeof num === 'number' && !isNaN(num) ? num : null;
  }

  async fetchTransitCountyAll(state, counties, metric) {
    const dbName = this.catalog.formatStateDatabaseName(state);
    if (!dbName) return [];
    const db = this.mongoClient.db(dbName);
    const docs = await db.collection(TRANSIT_COUNTY_COLLECTION).find({ title: { $in: counties } }).toArray();
    
    // Determine the key (same logic as single fetch)
    const NO_PREFIX_METRICS = [
      'Transfers',
      'Transit:Driving',
      'Transit: Driving',
      'In-Vehicle:Out-of-Vehicle',
      'Sample Size',
      'Percent Access (Initial walk distance < 4 miles, Initial wait time <60 minutes)'
    ];
    let searchKey = metric;
    const isException = NO_PREFIX_METRICS.some(m => m.toLowerCase() === metric.toLowerCase());
    if (!isException && !metric.toLowerCase().startsWith('average ')) {
      searchKey = `Average ${metric}`;
    }

    const map = new Map();
    docs.forEach(d => {
      if (d?.title) {
        let val = findMetricValue(d, searchKey);
        if (val === null && searchKey !== metric) {
          val = findMetricValue(d, metric);
        }
        
        const num = typeof val === 'string' ? parseFloat(val) : val;
        
        // SCALING FIX: County DBs store Percent Access as 0-1.
        if (metric.toLowerCase().includes('percent access')) {
           if (typeof num === 'number' && !isNaN(num)) {
             if (Math.abs(num) <= 1.0) map.set(d.title, num * 100);
             else map.set(d.title, num);
             return;
           }
        }

        if (typeof num === 'number' && !isNaN(num)) map.set(d.title, num);
      }
    });
    return counties.map(c => (map.has(c) ? map.get(c) : null));
  }

  async fetchFrequencyStateAll(metricLabel, bin) {
    const freq = this.catalog.findFrequencyMetric(metricLabel);
    if (!freq) return this.catalog.states.map(() => null);
    
    const db = this.mongoClient.db(DEFAULT_TRANSIT_DB);
    // Fetch all docs for known states
    // The collection has docs { title: "StateName", bin: val }
    const docs = await db.collection(freq.collection).find({ 
      title: { $in: this.catalog.states.map(s => new RegExp(`^${s}$`, 'i')) } 
    }).toArray();
    
    const map = new Map();
    docs.forEach(d => {
      if (d?.title) {
        const val = d[bin];
        const num = typeof val === 'string' ? parseFloat(val) : val;
        // Use normalized state name for mapping
        const normalized = normalizeName(d.title);
        if (typeof num === 'number' && !isNaN(num)) map.set(normalized, num);
      }
    });

    return this.catalog.states.map(state => {
      const key = normalizeName(state);
      return map.has(key) ? map.get(key) : null;
    });
  }

  async fetchFrequencyState(state, metricLabel, bin) {
    const freq = this.catalog.findFrequencyMetric(metricLabel);
    if (!freq) return null;
    const db = this.mongoClient.db(DEFAULT_TRANSIT_DB);
    const doc = await db.collection(freq.collection).findOne({ title: { $regex: `^${state}$`, $options: 'i' } });
    if (!doc) return null;
    const val = doc[bin];
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return typeof num === 'number' && !isNaN(num) ? num : null;
  }

  async fetchFrequencyCounty(state, county, metricLabel, bin) {
    const freq = this.catalog.findFrequencyMetric(metricLabel);
    const dbName = this.catalog.formatStateDatabaseName(state);
    if (!freq || !dbName) return null;
    const db = this.mongoClient.db(dbName);
    const doc = await db.collection(freq.collection).findOne({ title: cleanCountyForTransit(county) });
    if (!doc) return null;

    // FIX: Map '30-60' bin to '> 30 < 60' for state databases where naming differs
    let val = doc[bin];
    if (val === undefined && bin === '30-60') {
      val = doc['> 30 < 60'];
    }

    const num = typeof val === 'string' ? parseFloat(val) : val;
    // Frequency in County DB is 0-1 ratio, scale to percentage
    if (typeof num === 'number' && !isNaN(num)) {
       if (Math.abs(num) <= 1.0) return num * 100;
       return num;
    }
    return null;
  }

  async fetchFrequencyCountyAll(state, counties, metricLabel, bin) {
    const freq = this.catalog.findFrequencyMetric(metricLabel);
    const dbName = this.catalog.formatStateDatabaseName(state);
    if (!freq || !dbName) return [];
    const db = this.mongoClient.db(dbName);
    const docs = await db.collection(freq.collection).find({ title: { $in: counties } }).toArray();
    const map = new Map();
    docs.forEach(d => {
      if (d?.title) {
        // FIX: Map '30-60' bin to '> 30 < 60'
        let val = d[bin];
        if (val === undefined && bin === '30-60') {
          val = d['> 30 < 60'];
        }

        const num = typeof val === 'string' ? parseFloat(val) : val;
        // Frequency in County DB is 0-1 ratio, scale to percentage
        if (typeof num === 'number' && !isNaN(num)) {
          if (Math.abs(num) <= 1.0) map.set(d.title, num * 100);
          else map.set(d.title, num);
        }
      }
    });
    return counties.map(c => (map.has(c) ? map.get(c) : null));
  }

  async fetchEquityStateAll(metric) {
    const dbName = this.catalog.findEquityDb(metric);
    if (!dbName) return this.catalog.states.map(() => null);
    
    // State Level collection uses 'NAME' or 'title' for State Name
    const query = { 
      $or: [
        { title: { $in: this.catalog.states } },
        { NAME: { $in: this.catalog.states } }
      ]
    };

    const docs = await this.mongoClient.db(dbName).collection('State Level').find(query).toArray();
    
    const map = new Map();
    docs.forEach(d => {
      const name = d.title || d.NAME;
      if (name && d.data) {
        const val = d.data[metric];
        const num = typeof val === 'string' ? parseFloat(val) : val;
        const normalized = normalizeName(name);
        if (typeof num === 'number' && !isNaN(num)) map.set(normalized, num);
      }
    });

    return this.catalog.states.map(state => {
      const key = normalizeName(state);
      return map.has(key) ? map.get(key) : null;
    });
  }

  async fetchEquityState(state, metric) {
    const dbName = this.catalog.findEquityDb(metric);
    if (!dbName) return null;
    
    // SCHEMA CORRECTION: Use 'title' field for State Name
    const doc = await this.mongoClient.db(dbName).collection('State Level').findOne({ title: state });
    
    if (!doc || !doc.data) {
      // Try fuzzy match if exact fail
      const fuzzyDoc = await this.mongoClient.db(dbName).collection('State Level').findOne({ title: { $regex: `^${state}$`, $options: 'i' } });
       if (!fuzzyDoc || !fuzzyDoc.data) {
          return null;
       }
       // use fuzzy doc
       const val = fuzzyDoc.data[metric];
       const num = typeof val === 'string' ? parseFloat(val) : val;
       return typeof num === 'number' && !isNaN(num) ? num : null;
    }
    
    const val = doc.data[metric];
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return typeof num === 'number' && !isNaN(num) ? num : null;
  }

  async fetchEquityCounty(state, county, metric) {
    const dbName = this.catalog.findEquityDb(metric);
    if (!dbName) return null;
    
    // SCHEMA CORRECTION: 
    // 1. Match 'State' field for state name
    // 2. Match 'title' field for county name (which has "County" suffix)
    
    const countyTitle = cleanCountyForEquity(county); // "Anderson County"
    const normalizedState = (state || '').replace(/\s+/g, '_');
    const stateRegex = new RegExp(`^${normalizedState.replace(/_/g, '[ _]')}$`, 'i');
    
    const query = {
      title: countyTitle,
      $or: [
        { State: normalizedState },
        { state: normalizedState },
        { State: stateRegex },
        { state: stateRegex }
      ]
    };

    const doc = await this.mongoClient
      .db(dbName)
      .collection('County Level')
      .findOne(query);

    if (!doc || !doc.data) {
      return null;
    }
    const val = doc.data[metric];
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return typeof num === 'number' && !isNaN(num) ? num : null;
  }

  async fetchEquityCountyAll(state, counties, metric) {
    const dbName = this.catalog.findEquityDb(metric);
    if (!dbName) return [];
    
    const cleanedCounties = counties.map(cleanCountyForEquity);
    const normalizedState = (state || '').replace(/\s+/g, '_');
    const stateRegex = new RegExp(`^${normalizedState.replace(/_/g, '[ _]')}$`, 'i');
    
    // Use the same schema corrections for bulk fetch
    const query = {
      title: { $in: cleanedCounties },
      $or: [
        { State: normalizedState },
        { state: normalizedState },
        { State: stateRegex },
        { state: stateRegex }
      ]
    };

    const docs = await this.mongoClient
      .db(dbName)
      .collection('County Level')
      .find(query)
      .toArray();
      
    const map = new Map();
    docs.forEach(d => {
      if (d?.title && d.data) {
        const val = d.data[metric];
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (typeof num === 'number' && !isNaN(num)) {
          // Store by uppercase key WITHOUT " County" suffix to match input list
          // "Anderson County" -> "ANDERSON"
          const key = d.title.replace(/ county$/i, '').trim().toUpperCase();
          map.set(key, num);
        }
      }
    });
    
    // Match using cleanCountyForTransit (uppercase) logic since that's our base list format
    return counties.map(c => {
      const key = c.toUpperCase();
      return map.has(key) ? map.get(key) : null;
    });
  }

  async runPython(codeSnippet, assignments) {
    if (!codeSnippet || !codeSnippet.trim()) {
      return { lines: ['No code_snippet provided'], error: false };
    }

    const forbidden = ['import ', '__', 'exec', 'eval', 'open(', 'subprocess', 'os.', 'sys.', 'socket', 'requests', 'http'];
    const lower = codeSnippet.toLowerCase();
    if (forbidden.some(w => lower.includes(w))) {
      return { lines: ['Code execution skipped: disallowed content'], error: true };
    }

    const assigns = Object.entries(assignments).map(([k, v]) => {
      if (Array.isArray(v)) {
        const sanitized = v.map(item => {
          if (item === null || item === undefined) return 'None';
          if (typeof item === 'number') return item;
          if (typeof item === 'string') return `'${item.replace(/'/g, "\\'")}'`;
          return 'None';
        });
        return `${k} = [${sanitized.join(', ')}]`;
      }
      if (v && typeof v === 'object') {
        const literalObj = JSON.stringify(v).replace(/\bnull\b/g, 'None');
        return `${k} = ${literalObj}`;
      }
      if (typeof v === 'string') {
        return `${k} = '${v.replace(/'/g, "\\'")}'`;
      }
      if (v === null || v === undefined) {
        return `${k} = None`;
      }
      return `${k} = ${v}`;
    });

    const script = [...assigns, codeSnippet].join('\n');
    const execResult = spawnSync('python', ['-c', script], {
      encoding: 'utf-8',
      timeout: 3000,
      killSignal: 'SIGKILL'
    });

    if (execResult.error || execResult.status !== 0) {
      return {
        lines: ['Code execution failed', execResult.stderr?.trim()].filter(Boolean),
        error: true
      };
    }

    const lines = (execResult.stdout || '').split('\n').map(l => l.trim()).filter(Boolean);
    return { lines, error: false };
  }
}

export const STATE_DB_TOKEN = '__STATE_DB__';