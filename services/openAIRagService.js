import OpenAI from "openai";
import { MongoClient } from 'mongodb';

/**
 * OpenAI-based RAG (Retrieval Augmented Generation) Service for TransitViz
 * 
 * This service:
 * 1. Queries MongoDB directly using vector search for relevant documents
 * 2. Uses OpenAI to provide analysis and insights, not raw data
 * 3. Logs conversations to MongoDB
 */
class OpenAIRagService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY;
    
    if (!this.apiKey) {
      console.error('❌ CRITICAL: OpenAI API key is missing!');
      console.error('Please set OPENAI_API_KEY or OPEN_AI_KEY in your .env file');
      throw new Error('OpenAI API key is required');
    }
    
    console.log('✅ OpenAI API key found');
    this.client = new OpenAI({ apiKey: this.apiKey });
    
    // MongoDB connections for embeddings
    this.mongoUri1 = process.env.MONGODB_URI;
    this.mongoUri2 = process.env.MONGODB_URI_2;
    this.mongoClient1 = null;
    this.mongoClient2 = null;
    
    // MongoDB connection for conversation logging
    this.loggingMongoClient = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the RAG system by connecting to MongoDB instances
   */
  async initialize() {
    if (this.isInitialized) {
      console.log('✅ RAG system already initialized');
      return;
    }

    console.log('🔄 Initializing RAG system from both MongoDB instances...');
    
    try {
      // Connect to both MongoDB instances with timeout
      this.mongoClient1 = new MongoClient(this.mongoUri1, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      this.mongoClient2 = new MongoClient(this.mongoUri2, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      
      // Set connection timeout
      const connectWithTimeout = (client, name, timeout = 10000) => {
        return Promise.race([
          client.connect(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Connection timeout for ${name}`)), timeout)
          )
        ]);
      };
      
      await connectWithTimeout(this.mongoClient1, 'MongoDB 1');
      console.log('✅ Connected to MongoDB 1 for RAG');
      
      await connectWithTimeout(this.mongoClient2, 'MongoDB 2');
      console.log('✅ Connected to MongoDB 2 for RAG');

      // Connect to logging MongoDB (using MONGODB_URI_2)
      this.loggingMongoClient = new MongoClient(this.mongoUri2, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      await connectWithTimeout(this.loggingMongoClient, 'Logging MongoDB');
      console.log('✅ Connected to MongoDB for conversation logging');
      
      this.isInitialized = true;
      console.log('✅ RAG system initialized - will query MongoDB directly');
    } catch (error) {
      console.error('❌ Failed to initialize RAG system:', error);
      throw error;
    }
  }

  /**
   * Query MongoDB directly for relevant documents using cosine similarity
   */
  async queryRelevantDocuments(query, limit = 5) {
    try {
      console.log('🔍 Querying MongoDB for relevant documents using cosine similarity...');
      
      // Get query embedding from OpenAI
      const queryEmbedding = await this.getQueryEmbedding(query);
      
      let allRelevantDocs = [];
      
      // Query MongoDB 1 - Load documents and calculate cosine similarity
      try {
        const db1 = this.mongoClient1.db('VectorEmbeddings');
        const collection1 = db1.collection('TransitVizEmbeddings');
        
        const count1 = await collection1.countDocuments({});
        console.log(`📊 MongoDB 1 collection has ${count1} total documents`);
        
        // Load a sample of documents for similarity calculation
        const sampleSize = Math.min(1000, count1); // Limit to 1000 docs for performance
        const docs1 = await collection1.aggregate([
          { $sample: { size: sampleSize } }
        ]).toArray();
        
        // Calculate cosine similarity for each document
        const scoredDocs1 = docs1.map(doc => ({
          ...doc,
          score: this.cosineSimilarity(queryEmbedding, doc.embedding)
        }));
        
        // Sort by similarity and take top results
        scoredDocs1.sort((a, b) => b.score - a.score);
        const topDocs1 = scoredDocs1.slice(0, limit);
        
        allRelevantDocs = [...allRelevantDocs, ...topDocs1];
        console.log(`📊 Found ${topDocs1.length} documents in MongoDB 1 (cosine similarity)`);
        
      } catch (error) {
        console.error('❌ Error querying MongoDB 1:', error.message);
      }
      
      // Query MongoDB 2 - Load documents and calculate cosine similarity
      try {
        const db2 = this.mongoClient2.db('VectorEmbeddings');
        const collection2 = db2.collection('TransitVizEmbeddings');
        
        const count2 = await collection2.countDocuments({});
        console.log(`📊 MongoDB 2 collection has ${count2} total documents`);
        
        // Load a sample of documents for similarity calculation
        const sampleSize = Math.min(1000, count2); // Limit to 1000 docs for performance
        const docs2 = await collection2.aggregate([
          { $sample: { size: sampleSize } }
        ]).toArray();
        
        // Calculate cosine similarity for each document
        const scoredDocs2 = docs2.map(doc => ({
          ...doc,
          score: this.cosineSimilarity(queryEmbedding, doc.embedding)
        }));
        
        // Sort by similarity and take top results
        scoredDocs2.sort((a, b) => b.score - a.score);
        const topDocs2 = scoredDocs2.slice(0, limit);
        
        allRelevantDocs = [...allRelevantDocs, ...topDocs2];
        console.log(`📊 Found ${topDocs2.length} documents in MongoDB 2 (cosine similarity)`);
        
      } catch (error) {
        console.error('❌ Error querying MongoDB 2:', error.message);
      }
      
      // Sort all results by similarity and take top results
      allRelevantDocs.sort((a, b) => b.score - a.score);
      const topDocs = allRelevantDocs.slice(0, limit);
      
      console.log(`🔍 Found ${topDocs.length} relevant documents (scores: ${topDocs.map(d => d.score?.toFixed(3)).join(', ')})`);
      
      return topDocs;
      
    } catch (error) {
      console.error('❌ Error querying relevant documents:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || !Array.isArray(vecA) || !Array.isArray(vecB)) {
      return 0;
    }
    
    if (vecA.length !== vecB.length) {
      return 0;
    }
    
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Get embedding for a query using OpenAI
   */
  async getQueryEmbedding(query) {
    try {
      const response = await this.client.embeddings.create({
        model: 'text-embedding-3-small',
        input: query
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Error getting query embedding:', error);
      throw error;
    }
  }

  /**
   * Create context string from documents and website context
   */
  createContextString(documents, context) {
    let contextString = '';
    
    // Add document context
    if (documents && documents.length > 0) {
      contextString += 'Relevant transit data:\n';
      documents.forEach((doc, index) => {
        contextString += `${index + 1}. ${doc.type}`;
        if (doc.state) contextString += ` - ${doc.state}`;
        if (doc.county) contextString += ` - ${doc.county}`;
        if (doc.category) contextString += ` - ${doc.category}`;
        contextString += '\n';
        
        // Add key metrics from the document
        if (doc.content) {
          const content = typeof doc.content === 'string' ? doc.content : JSON.stringify(doc.content);
          contextString += `   Data: ${content.substring(0, 200)}...\n`;
        }
      });
    }
    
    // Add current context from the website
    if (context) {
      contextString += '\nCurrent website context:\n';
      if (context.currentView) contextString += `- Current view: ${context.currentView}\n`;
      if (context.selectedState) contextString += `- Selected state: ${context.selectedState}\n`;
      if (context.selectedCounty) contextString += `- Selected county: ${context.selectedCounty}\n`;
      if (context.selectedMetric) contextString += `- Selected metric: ${context.selectedMetric}\n`;
    }
    
    return contextString;
  }

  /**
   * Create context from website data when MongoDB search fails
   */
  createContextFromWebsiteData(relevantData, query) {
    let contextString = 'Transit accessibility data from the website:\n\n';
    
    relevantData.forEach((metric, index) => {
      contextString += `${index + 1}. ${metric.title}:\n`;
      
      // Find states mentioned in the query
      const queryLower = query.toLowerCase();
      const statesToShow = [];
      
      if (queryLower.includes('new york')) {
        if (metric['New York'] !== undefined) {
          statesToShow.push(`New York: ${metric['New York']}`);
        }
      }
      if (queryLower.includes('california')) {
        if (metric.California !== undefined) {
          statesToShow.push(`California: ${metric.California}`);
        }
      }
      if (queryLower.includes('texas')) {
        if (metric.Texas !== undefined) {
          statesToShow.push(`Texas: ${metric.Texas}`);
        }
      }
      
      // If no specific states mentioned, show top 5 states
      if (statesToShow.length === 0) {
        const stateEntries = Object.entries(metric)
          .filter(([key, value]) => key !== '_id' && key !== 'title' && typeof value === 'number')
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);
        
        statesToShow.push(...stateEntries.map(([state, value]) => `${state}: ${value}`));
      }
      
      contextString += statesToShow.join(', ') + '\n\n';
    });
    
    return contextString;
  }

  /**
   * Log conversation to MongoDB
   */
  async logConversation(username, question, answer, tokens, price) {
    try {
      if (!this.loggingMongoClient) {
        console.log('⚠️ Logging MongoDB client not available');
        return;
      }

      const db = this.loggingMongoClient.db('BotData');
      const collection = db.collection('Data');

      // Check if user document exists
      const existingUser = await collection.findOne({ title: username });

      const conversationEntry = {
        Question: question,
        Answer: answer,
        Tokens: tokens,
        Price: price,
        timestamp: new Date()
      };

      if (existingUser) {
        // Add to existing user document
        await collection.updateOne(
          { title: username },
          { $push: { conversations: conversationEntry } }
        );
        console.log(`✅ Added conversation to existing user: ${username}`);
      } else {
        // Create new user document
        await collection.insertOne({
          title: username,
          conversations: [conversationEntry],
          createdAt: new Date()
        });
        console.log(`✅ Created new user document: ${username}`);
      }
    } catch (error) {
      console.error('❌ Error logging conversation:', error);
    }
  }

  /**
   * Calculate token count and price for OpenAI response
   */
  calculateTokensAndPrice(usage) {
    if (!usage) {
      return { tokens: 0, price: 0 };
    }
    
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = promptTokens + completionTokens;
    
    // GPT-4o-mini pricing (as of 2024)
    const promptPrice = promptTokens * 0.00015 / 1000; // $0.15 per 1M tokens
    const completionPrice = completionTokens * 0.0006 / 1000; // $0.60 per 1M tokens
    const totalPrice = promptPrice + completionPrice;
    
    return {
      tokens: totalTokens,
      price: totalPrice
    };
  }

  /**
   * Generate a response using RAG with analysis focus
   */
  async generateResponse(userQuery, context = {}, username = null) {
    console.log('=== OpenAI RAG GENERATE RESPONSE ===');
    console.log('User query:', userQuery);
    console.log('Username:', username);

    try {
      // Ensure RAG system is initialized
      if (!this.isInitialized) {
        await this.initialize();
      }

      // Query MongoDB directly for relevant documents
      const relevantDocs = await this.queryRelevantDocuments(userQuery, 5);

      if (relevantDocs.length === 0) {
        return {
          success: true,
          message: "I couldn't find specific information about that topic in our transit data. Could you please rephrase your question or ask about a different aspect of transit accessibility?",
          timestamp: new Date().toISOString(),
          model: 'OpenAI RAG (gpt-4o-mini)',
          sources: []
        };
      }

      // Create context for OpenAI
      const contextString = this.createContextString(relevantDocs, context);

      // Generate response using OpenAI with analysis focus
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a transit accessibility analyst. Your role is to provide insights, analysis, and explanations about transit data, not to simply repeat raw values that users can see on the website.

IMPORTANT GUIDELINES:
- Focus on ANALYSIS and INSIGHTS, not raw data
- Explain what the data means and its implications
- Provide context about transit accessibility patterns
- Use specific examples only to illustrate broader trends
- Help users understand the "why" behind the numbers
- Compare different regions or metrics when relevant
- Suggest what the data indicates about transit quality

The user can see the raw values on the website - they need your expertise to understand what those values mean.`
          },
          {
            role: 'user',
            content: `Based on the following transit data, please analyze: "${userQuery}"

Context: ${contextString}

Please provide analysis and insights, not just raw data.`
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      });

      const answer = response.choices[0].message.content;
      
      // Calculate tokens and price
      const tokenInfo = this.calculateTokensAndPrice(response.usage);
      
      // Log conversation
      if (username) {
        await this.logConversation(username, userQuery, answer, tokenInfo.tokens, tokenInfo.price);
      }

      return {
        success: true,
        message: answer,
        timestamp: new Date().toISOString(),
        model: 'OpenAI RAG (gpt-4o-mini)',
        sources: relevantDocs.map(doc => ({
          type: doc.type,
          state: doc.state,
          county: doc.county,
          category: doc.category,
          score: doc.score?.toFixed(3)
        }))
      };

    } catch (error) {
      console.error('❌ OpenAI RAG error:', error);
      return {
        success: false,
        message: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString(),
        model: 'OpenAI RAG (gpt-4o-mini)',
        sources: []
      };
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    if (this.mongoClient1) {
      await this.mongoClient1.close();
      console.log('✅ MongoDB 1 connection closed');
    }
    if (this.mongoClient2) {
      await this.mongoClient2.close();
      console.log('✅ MongoDB 2 connection closed');
    }
    if (this.loggingMongoClient) {
      await this.loggingMongoClient.close();
      console.log('✅ Logging MongoDB connection closed');
    }
  }
}

export { OpenAIRagService };