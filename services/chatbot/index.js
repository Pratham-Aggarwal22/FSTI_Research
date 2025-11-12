import OpenAI from 'openai';
import { performance } from 'perf_hooks';

const DEFAULT_TRANSIT_DB = process.env.DB_NAME || 'StateWiseComputation';
const STATE_COLLECTION = 'AverageValues';
const COUNTY_COLLECTION = 'Averages';
const STATE_DB_PLACEHOLDER = '__STATE_DB__';
const COUNTY_NAME_SUFFIX = / county$/i;

const EQUITY_DATABASES = [
  { key: 'employment', dbName: 'Employment_Data', displayName: 'Employment', stateCollection: 'State Level', countyCollection: 'County Level' },
  { key: 'income', dbName: 'Income_Data', displayName: 'Income', stateCollection: 'State Level', countyCollection: 'County Level' },
  { key: 'race', dbName: 'Race_Data', displayName: 'Race', stateCollection: 'State Level', countyCollection: 'County Level' },
  { key: 'housing', dbName: 'Housing_Data', displayName: 'Housing', stateCollection: 'State Level', countyCollection: 'County Level' }
];

const STATE_DB_CORRECTIONS = {
  Alabama: 'Albama',
  Michigan: 'MIchigan'
};

function safeGet(obj, pathSegments) {
  if (!obj || !pathSegments) return undefined;
  return pathSegments.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
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

function inferUnitFromTitle(title) {
  if (!title) return null;
  const lower = title.toLowerCase();
  if (lower.includes('%') || lower.includes('percent')) return 'percent';
  if (lower.includes('minutes') || lower.includes('minute')) return 'minutes';
  if (lower.includes('miles') || lower.includes('mile')) return 'miles';
  if (lower.includes('ratio')) return 'ratio';
  if (lower.includes('population') || lower.includes('people')) return 'people';
  if (lower.includes('income')) return 'usd';
  if (lower.includes('household')) return 'people';
  return null;
}

function dedupe(list) {
  const seen = new Set();
  return list.filter(item => {
    const key = JSON.stringify(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

class SchemaCatalog {
  constructor({ mongoClient }) {
    this.mongoClient = mongoClient;
    this.states = [];
    this.stateAliasMap = new Map();
    this.transitMetrics = [];
    this.equityMetrics = [];
    this.metricIndex = new Map();
    this.dictionaryCollections = [];
  }

  async build() {
    await this.loadTransitCatalog();
    await this.loadEquityCatalog();
    await this.findDictionaryCollections();
  }

  async loadTransitCatalog() {
    const db = this.mongoClient.db(DEFAULT_TRANSIT_DB);
    const collection = db.collection(STATE_COLLECTION);
    const docs = await collection.find({}, { projection: { title: 1 } }).toArray();

    if (!docs || docs.length === 0) {
      console.warn('[Chatbot] Unable to load transit catalog; AverageValues empty.');
      return;
    }

    const sample = docs[0];
    this.states = Object.keys(sample || {})
      .filter(key => key && !['_id', 'title'].includes(key))
      .sort();

    this.stateAliasMap.clear();
    this.states.forEach(state => {
      this.stateAliasMap.set(normalizeName(state), state);
      this.stateAliasMap.set(normalizeName(`${state} state`), state);
    });

    this.transitMetrics = docs
      .filter(doc => doc && doc.title)
      .map(doc => {
        const metricId = doc.title;
        return {
          metricId,
          label: metricId,
          category: 'transit',
          geographyLevels: ['state'],
          unit: inferUnitFromTitle(metricId),
          source: {
            db: DEFAULT_TRANSIT_DB,
            collection: STATE_COLLECTION,
            lookup: 'metric_document',
            metricField: 'title'
          }
        };
      });

    this.transitMetrics.forEach(metric => {
      this.metricIndex.set(normalizeName(metric.metricId), metric);
      this.metricIndex.set(normalizeName(metric.label), metric);
    });
  }

  async loadEquityCatalog() {
    for (const equityDb of EQUITY_DATABASES) {
      const db = this.mongoClient.db(equityDb.dbName);
      const collection = db.collection(equityDb.stateCollection);
      const doc = await collection.findOne({});
      if (!doc) continue;

      const metrics = [];
      if (doc.data && typeof doc.data === 'object') {
        Object.keys(doc.data).forEach(key => {
          if (key === 'NAME') return;
          metrics.push({
            metricId: key,
            label: key,
            category: 'equity',
            geographyLevels: ['state'],
            unit: inferUnitFromTitle(key),
            source: {
              db: equityDb.dbName,
              collection: equityDb.stateCollection,
              lookup: 'geography_document',
              geographyField: 'title',
              valuePath: ['data', key]
            }
          });
        });
      } else {
        // fallback: treat direct numeric fields as metrics
        Object.keys(doc)
          .filter(key => !['_id', 'title'].includes(key) && typeof doc[key] === 'number')
          .forEach(key => {
            metrics.push({
              metricId: key,
              label: key,
              category: 'equity',
              geographyLevels: ['state'],
              unit: inferUnitFromTitle(key),
              source: {
                db: equityDb.dbName,
                collection: equityDb.stateCollection,
                lookup: 'geography_document',
                geographyField: 'title',
                valuePath: [key]
              }
            });
          });
      }

      metrics.forEach(metric => {
        const alias = `${equityDb.displayName}::${metric.metricId}`;
        this.metricIndex.set(normalizeName(metric.metricId), metric);
        this.metricIndex.set(normalizeName(alias), metric);
        this.metricIndex.set(normalizeName(`${equityDb.displayName} ${metric.metricId}`), metric);
      });

      this.equityMetrics.push(
        ...metrics.map(metric => ({
          ...metric,
          equityCategory: equityDb.key,
          equityDisplay: equityDb.displayName
        }))
      );
    }
  }

  async findDictionaryCollections() {
    const candidates = [];

    try {
      const db = this.mongoClient.db(DEFAULT_TRANSIT_DB);
      const collections = await db.listCollections().toArray();
      collections.forEach(col => {
        if (/dictionary/i.test(col.name)) {
          candidates.push({ dbName: DEFAULT_TRANSIT_DB, collection: col.name });
        }
      });
    } catch (err) {
      console.warn('[Chatbot] Unable to list collections in transit DB for dictionary lookup:', err.message);
    }

    // Common metadata databases
    const metadataDbs = ['Metadata', 'TransitViz', 'ReferenceData'];
    for (const dbName of metadataDbs) {
      try {
        const db = this.mongoClient.db(dbName);
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
          if (/dictionary/i.test(col.name) || /definitions/i.test(col.name)) {
            candidates.push({ dbName, collection: col.name });
          }
        });
      } catch (err) {
        // Ignore missing db
      }
    }

    // Add default fallback
    candidates.push({ dbName: DEFAULT_TRANSIT_DB, collection: 'DataDictionary' });

    this.dictionaryCollections = dedupe(candidates);
  }

  getPlannerContext() {
    return {
      states: this.states,
      transitMetrics: this.transitMetrics.map(metric => ({
        metricId: metric.metricId,
        unit: metric.unit,
        source: metric.source
      })),
      equityMetrics: this.equityMetrics.map(metric => ({
        metricId: metric.metricId,
        category: metric.equityDisplay,
        unit: metric.unit,
        source: metric.source
      }))
    };
  }

  getMetricByName(value) {
    if (!value) return null;
    return this.metricIndex.get(normalizeName(value)) || null;
  }

  inferUnit(metricId) {
    const metric = this.getMetricByName(metricId);
    return metric ? metric.unit : inferUnitFromTitle(metricId);
  }

  resolveState(value) {
    if (!value) return null;
    const normalized = normalizeName(value);
    if (this.stateAliasMap.has(normalized)) {
      return this.stateAliasMap.get(normalized);
    }
    const match = this.states.find(state => normalizeName(state) === normalized);
    return match || null;
  }

  formatStateDatabaseName(state) {
    if (!state) return null;
    const canonical = this.resolveState(state) || state;
    const corrected = STATE_DB_CORRECTIONS[canonical] || canonical;
    return corrected.replace(/\s+/g, '_');
  }
}

class PlannerService {
  constructor({ openai, catalog, model = process.env.OPENAI_PLANNER_MODEL || 'gpt-4o-mini' }) {
    this.openai = openai;
    this.catalog = catalog;
    this.model = model;
  }

  async plan(userMessage, context = {}) {
    const plannerContext = this.catalog.getPlannerContext();
    const contextSnippet = JSON.stringify(
      {
        states: plannerContext.states,
        transitMetrics: plannerContext.transitMetrics.slice(0, 40),
        equityMetrics: plannerContext.equityMetrics.slice(0, 40)
      },
      null,
      2
    );

    const systemPrompt = `
You are the planning module for the TransitViz chatbot. Produce a structured JSON plan describing how to satisfy the user request using the available MongoDB data. 
Follow these rules:
- Only reference metrics explicitly provided in the context. If something is unknown, do not guess; ask for clarification via followUps.
- All numeric data must come from MongoDB. Plan only the retrieval; the execution layer will perform the queries.
- Supported intents: metric_lookup, compare, rank, trend, definition, multi_geo_report.
- Always include geographies array with resolved type/value pairs.
- For county geographies, include stateContext when known.
- For each metric specify source.db, source.collection, source.lookup (metric_document | geography_document | county_document | collection_metrics), and either metricField or valuePath as appropriate.
- Use source.lookup="collection_metrics" with metricId="__ALL__" when the user requests a broad overview (e.g., "transit accessibility" or "equity metrics") so the executor can retrieve all metrics from that collection for the geography.
- For transit overviews, set { metricId: "__ALL__", category: "transit", source.db: "StateWiseComputation", source.collection: "AverageValues", source.lookup: "collection_metrics" }.
- For equity overviews, include an entry for each equity database (Employment_Data, Income_Data, Race_Data, Housing_Data) using source.lookup="collection_metrics", source.collection="State Level", source.geographyField="title", source.valuePath=["data"].
- When the user mentions both transit and equity, ensure the metrics array covers both domains (transit average values plus all relevant equity categories).
- For county-level overviews use source.db="${STATE_DB_PLACEHOLDER}", source.collection="Averages", source.lookup="collection_metrics".
- Only set chart.suggested=true if the user explicitly asks for a visual or chart; otherwise keep chart.suggested=false.
- Mark needsData=false when responding only with definitions.
- Always populate needsDefinition=true when the user explicitly asks for explanations or meanings of metrics, and include definitionTerms.
- Add followUps when required inputs (metric, geography, time) are missing.
Return JSON only.`;

    const userPrompt = `
User question:
${userMessage}

Page context (may be empty):
${JSON.stringify(context || {}, null, 2)}

Available data dictionary (truncated):
${contextSnippet}

Output requirements:
{
  "intent": "...",
  "needsData": true|false,
  "needsDefinition": true|false,
  "definitionTerms": [],
  "metrics": [
    {
      "metricId": "...",
      "category": "transit|equity|other",
      "unit": "... or null",
      "geographyLevel": "state|county|national",
      "time": { "grain": "year|none", "year": 2022|null, "latest": true|false },
      "source": {
        "db": "...",
        "collection": "...",
        "lookup": "metric_document|geography_document|county_document",
        "metricField": "... optional",
        "geographyField": "... optional",
        "valuePath": ["..."] optional
      }
    }
  ],
  "geographies": [
    { "type": "state|county|national", "value": "...", "stateContext": "... or null" }
  ],
  "comparisons": {
    "targets": ["..."],
    "rank": { "direction": "highest|lowest", "limit": 5, "scope": "states|counties|nation" }
  },
  "chart": { "suggested": false, "type": null, "focusMetric": null, "notes": [] },
  "report": { "requested": false, "sections": [] },
  "followUps": [],
  "notes": []
}`;

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    // Store usage for cost calculation
    this.lastUsage = completion.usage;

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Planner did not return a plan');
    }

    let plan;
    try {
      plan = JSON.parse(content);
    } catch (error) {
      console.error('[Chatbot] Failed to parse planner response:', content);
      throw new Error('Planner returned invalid JSON');
    }

    if (!plan.intent) {
      plan.intent = 'metric_lookup';
    }

    if (!Array.isArray(plan.metrics)) {
      plan.metrics = [];
    }

    if (!Array.isArray(plan.geographies)) {
      plan.geographies = [];
    }

    if (!Array.isArray(plan.definitionTerms)) {
      plan.definitionTerms = [];
    }

    if (!plan.chart) {
      plan.chart = { suggested: false };
    }

    if (!Array.isArray(plan.followUps)) {
      plan.followUps = [];
    }

    const messageLower = userMessage.toLowerCase();
    plan.metrics = plan.metrics || [];

    const hasStateGeo = plan.geographies?.some(geo => geo.type === 'state');
    const hasCountyGeo = plan.geographies?.some(geo => geo.type === 'county');
    const overviewIntents = new Set(['metric_lookup', 'multi_geo_report', 'compare']);

    const hasTransitAll = plan.metrics.some(
      metric =>
        metric.metricId === '__ALL__' &&
        metric.category === 'transit' &&
        metric.source?.collection === STATE_COLLECTION
    );

    if (overviewIntents.has(plan.intent) && hasStateGeo && messageLower.includes('transit')) {
      if (!hasTransitAll) {
        plan.metrics.push({
          metricId: '__ALL__',
          category: 'transit',
          geographyLevel: 'state',
          unit: null,
          source: {
            db: DEFAULT_TRANSIT_DB,
            collection: STATE_COLLECTION,
            lookup: 'collection_metrics',
            metricField: 'title'
          }
        });
      }

      const transitHasAll = plan.metrics.some(
        metric =>
          metric.category === 'transit' &&
          metric.metricId === '__ALL__' &&
          metric.source?.collection === STATE_COLLECTION
      );

      if (transitHasAll) {
        plan.metrics = plan.metrics.filter(
          metric =>
            !(
              metric.category === 'transit' &&
              metric.source?.collection === STATE_COLLECTION &&
              metric.metricId !== '__ALL__'
            )
        );
      }
    }

    if (overviewIntents.has(plan.intent) && hasCountyGeo && messageLower.includes('transit')) {
      const alreadyHasCountyTransit = plan.metrics.some(
        metric =>
          metric.category === 'transit' &&
          metric.metricId === '__ALL__' &&
          metric.geographyLevel === 'county'
      );

      if (!alreadyHasCountyTransit) {
        plan.metrics.push({
          metricId: '__ALL__',
          category: 'transit',
          geographyLevel: 'county',
          unit: null,
          source: {
            db: STATE_DB_PLACEHOLDER,
            collection: COUNTY_COLLECTION,
            lookup: 'collection_metrics',
            metricField: 'title'
          }
        });
      }
    }

    const needsEquity = messageLower.includes('equity');
    const hasEquityMetrics = plan.metrics.some(metric => metric.category === 'equity');

    if (overviewIntents.has(plan.intent) && hasStateGeo && needsEquity && !hasEquityMetrics) {
      for (const equityDb of EQUITY_DATABASES) {
        const alreadyIncluded = plan.metrics.some(
          metric =>
            metric.category === 'equity' &&
            metric.source?.db === equityDb.dbName &&
            metric.source?.collection === equityDb.stateCollection
        );
        if (!alreadyIncluded) {
          plan.metrics.push({
            metricId: '__ALL__',
            category: 'equity',
            geographyLevel: 'state',
            unit: null,
            source: {
              db: equityDb.dbName,
              collection: equityDb.stateCollection,
              lookup: 'collection_metrics',
              geographyField: 'title',
              valuePath: ['data']
            },
            equityCategory: equityDb.key
          });
        }
      }
    }

    if (overviewIntents.has(plan.intent) && hasCountyGeo && needsEquity) {
      for (const equityDb of EQUITY_DATABASES) {
        const alreadyIncludedCounty = plan.metrics.some(
          metric =>
            metric.category === 'equity' &&
            metric.geographyLevel === 'county' &&
            metric.source?.db === equityDb.dbName &&
            metric.source?.collection === equityDb.countyCollection
        );
        if (!alreadyIncludedCounty) {
          plan.metrics.push({
            metricId: '__ALL__',
            category: 'equity',
            geographyLevel: 'county',
            unit: null,
            source: {
              db: equityDb.dbName,
              collection: equityDb.countyCollection,
              lookup: 'collection_metrics',
              geographyField: 'title',
              valuePath: ['data'],
              stateField: ['state', 'State']
            },
            equityCategory: equityDb.key
          });
        }
      }
    }

    if (!plan.chart || plan.chart.suggested !== true || plan.chart.requested !== true) {
      plan.chart = { suggested: false };
    }

    return plan;
  }
}

class DefinitionService {
  constructor({ mongoClient, catalog }) {
    this.mongoClient = mongoClient;
    this.catalog = catalog;
  }

  async lookup(terms = []) {
    if (!terms || terms.length === 0) {
      return [];
    }

    const results = [];
    for (const term of terms) {
      const normalized = normalizeName(term);
      let found = null;

      for (const source of this.catalog.dictionaryCollections) {
        try {
          const coll = this.mongoClient.db(source.dbName).collection(source.collection);
          const cursor = await coll
            .find(
              {
                $or: [
                  { term },
                  { title: term },
                  { metric: term },
                  { synonyms: { $regex: term, $options: 'i' } },
                  { term_normalized: normalized }
                ]
              },
              { limit: 1 }
            )
            .toArray();

          if (cursor.length > 0) {
            const doc = cursor[0];
            found = {
              term: term,
              definition: doc.definition || doc.description || doc.text || null,
              unit: doc.unit || doc.units || null,
              source: {
                db: source.dbName,
                collection: source.collection,
                citation: doc.source || doc.citation || null
              }
            };
            break;
          }
        } catch (error) {
          // ignore missing collections
        }
      }

      if (found) {
        results.push(found);
      } else {
        results.push({
          term,
          definition: null,
          unit: null,
          source: null,
          missing: true
        });
      }
    }

    return results;
  }
}

class ExecutionService {
  constructor({ mongoClient, catalog }) {
    this.mongoClient = mongoClient;
    this.catalog = catalog;
    this.countyStateCache = new Map();
    this.failedCountyLookups = new Set();
  }

  async execute(plan) {
    const started = performance.now();
    const outcome = {
      metrics: [],
      rankings: [],
      comparisons: [],
      trends: [],
      chartData: null,
      notes: [],
      missing: [],
      metadata: {
        queryLog: [],
        executionMs: 0
      }
    };

    if (!plan.needsData) {
      outcome.metadata.executionMs = performance.now() - started;
      return outcome;
    }

    switch (plan.intent) {
      case 'metric_lookup':
      case 'compare':
      case 'multi_geo_report':
        await this.executeMetricLookup(plan, outcome);
        break;
      case 'rank':
        await this.executeRanking(plan, outcome);
        break;
      case 'trend':
        await this.executeTrend(plan, outcome);
        break;
      default:
        await this.executeMetricLookup(plan, outcome);
        break;
    }

    if (plan.chart && plan.chart.suggested) {
      outcome.chartData = this.buildChartData(plan, outcome.metrics);
    }

    outcome.metadata.executionMs = performance.now() - started;
    return outcome;
  }

  async executeMetricLookup(plan, outcome) {
    const geographies = plan.geographies && plan.geographies.length > 0 ? plan.geographies : [];
    if (!plan.metrics || plan.metrics.length === 0) {
      outcome.notes.push('Planner did not specify any metrics to retrieve.');
      return;
    }

    for (const metric of plan.metrics) {
      for (const geography of geographies) {
        const resolvedGeography = await this.resolveGeography(geography);
        if (!resolvedGeography) {
          outcome.missing.push({
            metricId: metric.metricId,
            geography
          });
          continue;
        }

        if (metric.source?.lookup === 'collection_metrics' && metric.metricId === '__ALL__') {
          const collectionResults = await this.fetchCollectionMetrics(metric, resolvedGeography, plan);
          if (collectionResults.length > 0) {
            outcome.metrics.push(...collectionResults);
          } else {
            outcome.missing.push({
              metricId: metric.metricId,
              geography
            });
          }
          continue;
        }

        const result = await this.fetchMetricValue(metric, geography, plan, resolvedGeography);
        if (result) {
          outcome.metrics.push(result);
        } else {
          outcome.missing.push({
            metricId: metric.metricId,
            geography
          });
        }
      }
    }
  }

  async executeRanking(plan, outcome) {
    if (!plan.metrics || plan.metrics.length === 0) {
      outcome.notes.push('Ranking intent missing metric definition.');
      return;
    }
    const metric = plan.metrics[0];
    const source = metric.source || {};
    if (source.lookup !== 'metric_document') {
      outcome.notes.push('Ranking currently supported only for state-level transit metrics.');
      return;
    }

    const dbName = source.db || DEFAULT_TRANSIT_DB;
    const collection = this.mongoClient.db(dbName).collection(source.collection || STATE_COLLECTION);
    const doc = await collection.findOne({ [source.metricField || 'title']: metric.metricId });
    if (!doc) {
      outcome.missing.push({ metricId: metric.metricId, geography: 'rank:states' });
      return;
    }

    const values = [];
    Object.keys(doc).forEach(key => {
      if (['_id', source.metricField || 'title'].includes(key)) return;
      const value = doc[key];
      if (typeof value === 'number') {
        values.push({ geography: key, value });
      }
    });

    const direction = plan.comparisons?.rank?.direction === 'lowest' ? 'asc' : 'desc';
    values.sort((a, b) => (direction === 'desc' ? b.value - a.value : a.value - b.value));
    const limit = plan.comparisons?.rank?.limit || 5;
    outcome.rankings.push({
      metricId: metric.metricId,
      unit: metric.unit || this.catalog.inferUnit(metric.metricId),
      direction,
      limit,
      values: values.slice(0, limit),
      source: {
        db: dbName,
        collection: source.collection || STATE_COLLECTION
      }
    });
  }

  async executeTrend(plan, outcome) {
    // Attempt to fetch temporal series; fall back to latest if structure unavailable
    if (!plan.metrics || plan.metrics.length === 0) {
      outcome.notes.push('Trend intent missing metric definition.');
      return;
    }

    const metric = plan.metrics[0];
    for (const geography of plan.geographies || []) {
      const series = await this.fetchTemporalSeries(metric, geography);
      if (series && series.values && series.values.length > 0) {
        outcome.trends.push(series);
      } else {
        outcome.missing.push({ metricId: metric.metricId, geography, reason: 'no temporal data' });
      }
    }
  }

  async fetchMetricValue(metric, geography, plan, resolvedGeographyOverride = null) {
    const source = metric.source || {};
    const unit = metric.unit || this.catalog.inferUnit(metric.metricId);
    const resolvedGeography = resolvedGeographyOverride || (await this.resolveGeography(geography));
    if (!resolvedGeography) {
      return null;
    }

    const dbName =
      source.db === STATE_DB_PLACEHOLDER
        ? this.catalog.formatStateDatabaseName(resolvedGeography.stateContext || resolvedGeography.value)
        : source.db || DEFAULT_TRANSIT_DB;

    const collectionName = source.collection || (resolvedGeography.type === 'county' ? COUNTY_COLLECTION : STATE_COLLECTION);
    const db = this.mongoClient.db(dbName);
    const collection = db.collection(collectionName);

    let doc = null;
    let fieldUsed = null;

    const queryLogEntry = {
      metricId: metric.metricId,
      geography: resolvedGeography,
      db: dbName,
      collection: collectionName,
      lookup: source.lookup
    };

    if (source.lookup === 'metric_document') {
      doc = await collection.findOne({ [source.metricField || 'title']: metric.metricId });
      fieldUsed = resolvedGeography.value;
    } else if (source.lookup === 'geography_document') {
      doc = await collection.findOne({ [source.geographyField || 'title']: resolvedGeography.value });
      fieldUsed = (source.valuePath && source.valuePath.join('.')) || resolvedGeography.value;
    } else if (source.lookup === 'county_document') {
      const result = await this.findCountyDocument(resolvedGeography, collection, metric);
      doc = result?.doc;
      fieldUsed = result?.field;
      queryLogEntry.countyMatch = result?.match;
    } else {
      doc = await collection.findOne({ [source.metricField || 'title']: metric.metricId });
      fieldUsed = resolvedGeography.value;
    }

    if (!doc) {
      queryLogEntry.missing = true;
      this.recordQueryLog(queryLogEntry, plan);
      return null;
    }

    const valueResult = this.extractValue(doc, source, resolvedGeography, metric);
    if (!valueResult) {
      queryLogEntry.missingValue = true;
      this.recordQueryLog(queryLogEntry, plan);
      return null;
    }

    this.recordQueryLog(
      {
        ...queryLogEntry,
        fieldUsed,
        year: valueResult.year || null
      },
      plan
    );

    return {
      metricId: metric.metricId,
      metricLabel: metric.label || metric.metricId,
      geography: resolvedGeography,
      value: valueResult.value,
      unit,
      year: valueResult.year || metric.time?.year || valueResult.detectedYear || null,
      category: metric.category || null,
      source: {
        db: dbName,
        collection: collectionName,
        field: valueResult.field || fieldUsed,
        lookup: source.lookup
      }
    };
  }

  async fetchCollectionMetrics(metric, resolvedGeography, plan) {
    const source = metric.source || {};
    const dbName =
      source.db === STATE_DB_PLACEHOLDER
        ? this.catalog.formatStateDatabaseName(resolvedGeography.stateContext || resolvedGeography.value)
        : source.db || DEFAULT_TRANSIT_DB;
    const collectionName =
      source.collection ||
      (resolvedGeography.type === 'county' ? COUNTY_COLLECTION : STATE_COLLECTION);

    const db = this.mongoClient.db(dbName);
    const collection = db.collection(collectionName);
    const results = [];
    const queryLogEntry = {
      metricId: metric.metricId,
      geography: resolvedGeography,
      db: dbName,
      collection: collectionName,
      lookup: 'collection_metrics'
    };

    const pushResult = ({
      metricId,
      metricLabel,
      value,
      unit,
      fieldPath,
      year,
      category,
      collectionSource
    }) => {
      if (typeof value !== 'number' || Number.isNaN(value)) return;
      results.push({
        metricId,
        metricLabel,
        geography: resolvedGeography,
        value,
        unit: unit || this.catalog.inferUnit(metricId),
        year: year || null,
        category: category || metric.category || null,
        source: {
          db: dbName,
          collection: collectionSource || collectionName,
          field: fieldPath,
          lookup: 'collection_metrics'
        }
      });
    };

    if (collectionName === STATE_COLLECTION && resolvedGeography.type === 'state') {
      const docs = await collection.find({}).toArray();
      docs.forEach(doc => {
        if (!doc) return;
        const metricLabel = doc[source.metricField || 'title'] || doc.title || doc.name;
        const value = doc[resolvedGeography.value];
        if (typeof value === 'number') {
          pushResult({
            metricId: metricLabel,
            metricLabel,
            value,
            unit: metric.unit,
            fieldPath: resolvedGeography.value,
            year: doc.year || doc.Year,
            category: 'transit'
          });
        }
      });

      // Include additional transit collections (e.g., frequency) for the state.
      const collections = await db.listCollections().toArray();
      const relatedCollections = collections
        .map(col => col.name)
        .filter(name => name && name !== collectionName && !name.startsWith('system.'));

      for (const relatedName of relatedCollections) {
        try {
          const relatedCollection = db.collection(relatedName);
          const doc = await relatedCollection.findOne({ title: resolvedGeography.value });
          if (!doc) continue;
          const flattened = this.flattenNumericFields(doc, {
            skipKeys: ['_id', 'title'],
            separator: ' > '
          });
          flattened.forEach(item => {
            pushResult({
              metricId: `${relatedName}::${item.metricId}`,
              metricLabel: `${relatedName} > ${item.metricLabel}`,
              value: item.value,
              fieldPath: `${relatedName}.${item.path}`,
              year: doc.year || doc.Year,
              category: 'transit',
              collectionSource: relatedName
            });
          });
        } catch (error) {
          // Ignore missing collections or incompatible structures.
        }
      }
    } else if (collectionName === COUNTY_COLLECTION && resolvedGeography.type === 'county') {
      const countyCollection = db.collection(collectionName);
      const countyDocResult = await this.findCountyDocument(resolvedGeography, countyCollection, metric);
      const countyDoc = countyDocResult?.doc;
      if (countyDoc) {
        const flattened = this.flattenNumericFields(countyDoc, {
          skipKeys: ['_id', 'title'],
          separator: ' > '
        });
        flattened.forEach(item => {
          pushResult({
            metricId: item.metricId,
            metricLabel: item.metricLabel,
            value: item.value,
            fieldPath: item.path,
            year: countyDoc.year || countyDoc.Year,
            category: metric.category || null
          });
        });
      }
    } else {
      const geoField = source.geographyField || 'title';
      const query = {
        [geoField]: resolvedGeography.value
      };
      if (resolvedGeography.type === 'county' && resolvedGeography.stateContext && source.stateField) {
        const stateFields = Array.isArray(source.stateField) ? source.stateField : [source.stateField];
        query.$or = stateFields.map(field => ({
          [field]: resolvedGeography.stateContext
        }));
      }
      const doc = await collection.findOne(query);
      if (doc) {
        const target =
          source.valuePath && source.valuePath.length > 0 ? safeGet(doc, source.valuePath) : doc;
        if (target && typeof target === 'object') {
          const flattened = this.flattenNumericFields(target, {
            skipKeys: ['_id', 'title', 'NAME', 'state', 'State'],
            separator: ' > '
          });
          flattened.forEach(item => {
            pushResult({
              metricId: item.metricId,
              metricLabel: item.metricLabel,
              value: item.value,
              fieldPath: item.path,
              year: doc.year || doc.Year,
              category: metric.category || null
            });
          });
        }
      }
    }

    this.recordQueryLog(
      {
        ...queryLogEntry,
        totalMetrics: results.length
      },
      plan
    );

    return results;
  }

  flattenNumericFields(node, options = {}) {
    const results = [];
    if (!node || typeof node !== 'object') {
      return results;
    }
    const skipKeys = new Set(options.skipKeys || []);
    const separator = options.separator || ' > ';
    const maxDepth = options.maxDepth || 8;

    const walk = (current, path = [], depth = 0) => {
      if (depth > maxDepth || current === null || current === undefined) {
        return;
      }

      if (typeof current === 'number') {
        if (path.length === 0) return;
        const metricId = path[path.length - 1];
        const metricLabel = path.join(separator);
        results.push({
          metricId,
          metricLabel,
          value: current,
          path: path.join('.')
        });
        return;
      }

      if (Array.isArray(current)) {
        current.forEach((item, index) => {
          walk(item, path.concat(String(index)), depth + 1);
        });
        return;
      }

      if (typeof current === 'object') {
        Object.entries(current).forEach(([key, value]) => {
          if (skipKeys.has(key)) return;
          walk(value, path.concat(key), depth + 1);
        });
      }
    };

    walk(node, [], 0);
    return results;
  }

  recordQueryLog(entry, plan) {
    if (!plan.executionLog) {
      plan.executionLog = [];
    }
    plan.executionLog.push(entry);
  }

  extractValue(doc, source, geography, metric) {
    if (source.lookup === 'metric_document') {
      const value = doc[geography.value];
      if (typeof value === 'number') {
        return { value, field: geography.value };
      }
      return null;
    }

    if (source.lookup === 'geography_document') {
      const pathSegments = source.valuePath || [metric.metricId];
      const value = safeGet(doc, pathSegments);
      if (typeof value === 'number') {
        const year = doc.year || doc.Year || null;
        return { value, field: pathSegments.join('.'), year };
      }

      // handle nested objects keyed by year
      if (value && typeof value === 'object') {
        const year = metric.time?.year;
        if (year && typeof value[year] === 'number') {
          return { value: value[year], field: `${pathSegments.join('.')}[${year}]`, year };
        }
        const entries = Object.entries(value).filter(([, v]) => typeof v === 'number');
        if (entries.length > 0) {
          const [latestYear, latestValue] = entries.sort((a, b) => Number(a[0]) - Number(b[0])).pop();
          return {
            value: latestValue,
            field: `${pathSegments.join('.')}[${latestYear}]`,
            year: Number(latestYear),
            detectedYear: Number(latestYear)
          };
        }
      }
      return null;
    }

    if (source.lookup === 'county_document') {
      const pathSegments = source.valuePath || [metric.metricId];
      const value = safeGet(doc, pathSegments);
      if (typeof value === 'number') {
        return { value, field: pathSegments.join('.') };
      }
      return null;
    }

    // fallback for unexpected structure
    const value = doc[geography.value];
    if (typeof value === 'number') {
      return { value, field: geography.value };
    }
    return null;
  }

  async fetchTemporalSeries(metric, geography) {
    const source = metric.source || {};
    const resolvedGeography = await this.resolveGeography(geography);
    if (!resolvedGeography) {
      return null;
    }

    const dbName =
      source.db === STATE_DB_PLACEHOLDER
        ? this.catalog.formatStateDatabaseName(resolvedGeography.stateContext || resolvedGeography.value)
        : source.db || DEFAULT_TRANSIT_DB;

    const collectionName = source.collection || STATE_COLLECTION;
    const collection = this.mongoClient.db(dbName).collection(collectionName);

    let doc = null;
    if (source.lookup === 'metric_document') {
      doc = await collection.findOne({ [source.metricField || 'title']: metric.metricId });
    } else if (source.lookup === 'geography_document') {
      doc = await collection.findOne({ [source.geographyField || 'title']: resolvedGeography.value });
    } else {
      doc = await collection.findOne({ [source.metricField || 'title']: metric.metricId });
    }

    if (!doc) return null;

    const pathSegments = source.valuePath || [metric.metricId];
    const candidate = safeGet(doc, pathSegments);
    const values = [];

    if (Array.isArray(candidate)) {
      candidate.forEach(entry => {
        if (entry && typeof entry.value === 'number') {
          values.push({ year: entry.year || entry.date || null, value: entry.value });
        }
      });
    } else if (candidate && typeof candidate === 'object') {
      Object.entries(candidate).forEach(([key, value]) => {
        const year = Number(key);
        if (!Number.isNaN(year) && typeof value === 'number') {
          values.push({ year, value });
        }
      });
    }

    if (values.length === 0) {
      return null;
    }

    values.sort((a, b) => (a.year || 0) - (b.year || 0));

    return {
      metricId: metric.metricId,
      geography: resolvedGeography,
      unit: metric.unit || this.catalog.inferUnit(metric.metricId),
      values
    };
  }

  async resolveGeography(geo) {
    if (!geo || !geo.type || !geo.value) return null;
    if (geo.type === 'state') {
      const state = this.catalog.resolveState(geo.value) || geo.value;
      return { type: 'state', value: state };
    }
    if (geo.type === 'county') {
      let state = this.catalog.resolveState(geo.stateContext) || geo.stateContext;
      if (!state) {
        state = await this.detectCountyState(geo.value);
      }
      if (!state) {
        return null;
      }
      return {
        type: 'county',
        value: geo.value.replace(COUNTY_NAME_SUFFIX, '').trim(),
        stateContext: state
      };
    }
    if (geo.type === 'national') {
      return { type: 'national', value: geo.value };
    }
    return { type: geo.type, value: geo.value };
  }

  async findCountyDocument(resolvedGeography, collection, metric) {
    const countyName = resolvedGeography.value;
    const variations = [
      countyName,
      `${countyName} County`,
      countyName.toUpperCase(),
      countyName.toLowerCase()
    ];

    for (const nameVariant of variations) {
      const doc = await collection.findOne({ title: nameVariant });
      if (doc) {
        return { doc, field: metric.metricId, match: nameVariant };
      }
    }

    const flexiblePattern = countyName
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .replace(/'/g, "['’`]")
      .replace(/ñ/g, '[nñ]')
      .replace(/á/g, '[aá]')
      .replace(/é/g, '[eé]')
      .replace(/í/g, '[ií]')
      .replace(/ó/g, '[oó]')
      .replace(/ú/g, '[uú]');

    const regex = new RegExp(flexiblePattern, 'i');
    const fuzzyDoc = await collection.findOne({ title: regex });
    if (fuzzyDoc) {
      return { doc: fuzzyDoc, field: metric.metricId, match: fuzzyDoc.title };
    }

    return null;
  }

  async detectCountyState(countyName) {
    const normalized = normalizeName(countyName);
    if (this.countyStateCache.has(normalized)) {
      return this.countyStateCache.get(normalized);
    }
    if (this.failedCountyLookups.has(normalized)) {
      return null;
    }

    const base = countyName.replace(/ county$/i, '').trim();
    const variations = Array.from(
      new Set(
        [
          countyName,
          `${base} County`,
          base,
          countyName.toUpperCase(),
          countyName.toLowerCase()
        ]
          .map(name => name && name.trim())
          .filter(Boolean)
      )
    );

    for (const state of this.catalog.states) {
      const dbName = this.catalog.formatStateDatabaseName(state);
      try {
        const collection = this.mongoClient.db(dbName).collection(COUNTY_COLLECTION);
        for (const variant of variations) {
          const doc = await collection.findOne({ title: variant });
          if (doc) {
            this.countyStateCache.set(normalized, state);
            return state;
          }
        }
        const flexiblePattern = base
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/'/g, "['’`]")
          .replace(/ñ/g, '[nñ]')
          .replace(/á/g, '[aá]')
          .replace(/é/g, '[eé]')
          .replace(/í/g, '[ií]')
          .replace(/ó/g, '[oó]')
          .replace(/ú/g, '[uú]');
        const regex = new RegExp(flexiblePattern, 'i');
        const fuzzy = await collection.findOne({ title: regex });
        if (fuzzy) {
          this.countyStateCache.set(normalized, state);
          return state;
        }
      } catch (error) {
        // ignore inaccessible databases
      }
    }

    this.failedCountyLookups.add(normalized);
    return null;
  }

  buildChartData(plan, metrics) {
    if (!metrics || metrics.length === 0) return null;
    const focusMetric = plan.chart?.focusMetric || metrics[0].metricId;
    const filtered = metrics.filter(item => item.metricId === focusMetric);
    if (filtered.length === 0) return null;

    return {
      metricId: focusMetric,
      unit: filtered[0].unit,
      type: plan.chart?.type || 'bar',
      values: filtered.map(item => ({
        geography: `${item.geography.value}${item.geography.stateContext ? `, ${item.geography.stateContext}` : ''}`,
        year: item.year,
        value: item.value
      }))
    };
  }
}

class WriterService {
  constructor({ openai, model = process.env.OPENAI_WRITER_MODEL || 'gpt-4o-mini' }) {
    this.openai = openai;
    this.model = model;
    this.lastUsage = null;
  }

  groupMetricsByGeography(metrics = []) {
    const map = new Map();
    metrics.forEach(item => {
      const geo = item.geography || {};
      const label = geo.type === 'county' && geo.stateContext
        ? `${geo.value}, ${geo.stateContext}`
        : geo.value || 'Requested area';
      if (!map.has(label)) {
        map.set(label, []);
      }
      map.get(label).push(item);
    });
    return Array.from(map.entries()).map(([geography, items]) => ({
      geography,
      metrics: items.map(metric => ({
        metricId: metric.metricId,
        label: metric.metricLabel || metric.metricId,
        value: metric.value,
        unit: metric.unit || null,
        year: metric.year || null,
        category: metric.category || null,
        source: metric.source || {}
      }))
    }));
  }

  prepareWriterPayload(plan, execution, definitions) {
    const chartRequested = plan.chart?.requested === true;
    return {
      intent: plan.intent,
      chartSuggestion: chartRequested
        ? {
            type: plan.chart.type || 'bar',
            focusMetric: plan.chart.focusMetric || execution?.chartData?.metricId || null
          }
        : null,
      metricsByGeography: this.groupMetricsByGeography(execution?.metrics || []),
      rankings: (execution?.rankings || []).map(rank => ({
        metricId: rank.metricId,
        unit: rank.unit || null,
        direction: rank.direction,
        values: rank.values || [],
        source: rank.source || {}
      })),
      trends: execution?.trends || [],
      missing: execution?.missing || [],
      notes: execution?.notes || [],
      definitions: definitions || []
    };
  }

  async compose({ plan, execution, definitions }) {
    const writerPayload = this.prepareWriterPayload(plan, execution, definitions);

    const systemPrompt = `
You are the narration module for TransitViz. Write a concise, user-friendly answer grounded ONLY in the provided MongoDB results.

Style and content rules:
- Explain what the metrics mean for transit accessibility; avoid dumping raw lists.
- Each numeric statement must include its value, unit (when available), and the year. If the year is missing, say "latest available year".
- Provide a brief source hint in parentheses using natural language (for example "(AverageValues collection)") without prefacing it with "source:".
- Do not fabricate numbers or perform new calculations.
- Mention when data or definitions are unavailable.
- Reference chart suggestions only if present.
- End with a reminder that users can open “Show details” for metadata.`;

    const userPrompt = `
Planner intent: ${plan.intent}

Payload to narrate:
${JSON.stringify(writerPayload, null, 2)}

Compose the final response following the style rules.`;

    const completion = await this.openai.chat.completions.create({
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    });

    // Store usage for cost calculation
    this.lastUsage = completion.usage;

    return completion.choices[0]?.message?.content?.trim() || 'I could not generate a response.';
  }
}

class ConversationService {
  constructor({ mongoClient }) {
    this.mongoClient = mongoClient;
    this.collection = null;
  }

  async ensureCollection() {
    if (this.collection) return this.collection;
    const db = this.mongoClient.db('BotData');
    this.collection = db.collection('Data');
    return this.collection;
  }

  async saveConversation({ username, question, response, cost, metadata = {} }) {
    try {
      if (!username) {
        console.warn('[Chatbot] Cannot save conversation: username is missing');
        return null;
      }

      const coll = await this.ensureCollection();
      
      // Create conversation entry
      const conversationEntry = {
        question,
        response,
        cost: cost || 0,
        timestamp: new Date(),
        ...metadata
      };

      // Check if document with this username exists
      const existingDoc = await coll.findOne({ title: username });

      if (existingDoc) {
        // Update existing document - append to conversations array
        await coll.updateOne(
          { title: username },
          { 
            $push: { conversations: conversationEntry },
            $set: { lastUpdated: new Date() }
          }
        );
        return existingDoc._id.toString();
      } else {
        // Create new document
        const newDoc = {
          title: username,
          conversations: [conversationEntry],
          createdAt: new Date(),
          lastUpdated: new Date()
        };
        const result = await coll.insertOne(newDoc);
        return result.insertedId?.toString();
      }
    } catch (error) {
      console.warn('[Chatbot] Failed to save conversation:', error.message);
      return null;
    }
  }
}

class ChatbotService {
  constructor({ mongoClient }) {
    this.mongoClient = mongoClient;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY
    });
    if (!this.openai.apiKey) {
      throw new Error('OpenAI API key is missing. Set OPENAI_API_KEY or OPEN_AI_KEY.');
    }
    this.catalog = new SchemaCatalog({ mongoClient });
    this.planner = new PlannerService({ openai: this.openai, catalog: this.catalog });
    this.executor = new ExecutionService({ mongoClient, catalog: this.catalog });
    this.definitionService = new DefinitionService({ mongoClient, catalog: this.catalog });
    this.writer = new WriterService({ openai: this.openai });
    this.conversationService = new ConversationService({ mongoClient });
    this.initialized = false;
    this.initializing = null;
    this.lastPlannerUsage = null;
    this.lastWriterUsage = null;
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

  async handleChat({ user, message, context = {} }) {
    if (!message || !message.trim()) {
      return {
        success: false,
        narrative: 'Please provide a question for the chatbot.',
        showDetails: null
      };
    }

    await this.initialize();

    const started = performance.now();
    let plan;
    let execution = null;
    let definitions = [];
    let narrative = '';
    let error = null;

    try {
      plan = await this.planner.plan(message, context);

      execution = await this.executor.execute(plan);

      if (plan.needsDefinition) {
        definitions = await this.definitionService.lookup(plan.definitionTerms || []);
      }

      narrative = await this.writer.compose({
        userMessage: message,
        plan,
        execution,
        definitions
      });
    } catch (err) {
      error = err;
      console.error('[Chatbot] Error handling chat:', err);
      narrative = 'Sorry, I encountered an error while processing your request. The team has been notified.';
    }

    const showDetails = {
      intent: plan?.intent,
      geographies: plan?.geographies || [],
      metrics: plan?.metrics?.map(m => ({
        metricId: m.metricId,
        unit: m.unit || this.catalog.inferUnit(m.metricId),
        source: m.source
      })),
      execution: {
        durationMs: execution?.metadata?.executionMs || 0,
        missing: execution?.missing || [],
        notes: execution?.notes || []
      },
      definitions: definitions?.map(def => ({
        term: def.term,
        source: def.source
      }))
    };

    // Calculate cost from OpenAI API usage
    const plannerUsage = this.planner.lastUsage;
    const writerUsage = this.writer.lastUsage;
    const totalCost = this.calculateCost(plannerUsage, writerUsage);

    // Save conversation to BotData.Data collection
    const username = user?.username || null;
    if (username) {
      await this.conversationService.saveConversation({
        username,
        question: message,
        response: narrative,
        cost: totalCost,
        metadata: {
          intent: plan?.intent,
          durationMs: performance.now() - started,
          plannerUsage,
          writerUsage,
          error: error ? { message: error.message } : null
        }
      });
    }

    return {
      success: !error,
      narrative,
      plan,
      data: execution,
      definitions,
      showDetails
    };
  }

  // Calculate cost from OpenAI API usage
  calculateCost(plannerUsage, writerUsage) {
    // Pricing for gpt-4o-mini (as of 2024)
    // Input: $0.15 per 1M tokens
    // Output: $0.60 per 1M tokens
    const INPUT_COST_PER_MILLION = 0.15;
    const OUTPUT_COST_PER_MILLION = 0.60;

    let totalCost = 0;

    if (plannerUsage) {
      const plannerInputCost = (plannerUsage.prompt_tokens / 1000000) * INPUT_COST_PER_MILLION;
      const plannerOutputCost = (plannerUsage.completion_tokens / 1000000) * OUTPUT_COST_PER_MILLION;
      totalCost += plannerInputCost + plannerOutputCost;
    }

    if (writerUsage) {
      const writerInputCost = (writerUsage.prompt_tokens / 1000000) * INPUT_COST_PER_MILLION;
      const writerOutputCost = (writerUsage.completion_tokens / 1000000) * OUTPUT_COST_PER_MILLION;
      totalCost += writerInputCost + writerOutputCost;
    }

    return totalCost;
  }

  async cleanup() {
    // No persistent resources beyond shared Mongo client.
    this.initialized = false;
  }
}

export default ChatbotService;
export const STATE_DB_TOKEN = STATE_DB_PLACEHOLDER;

