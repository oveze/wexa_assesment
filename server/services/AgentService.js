
import { v4 as uuidv4 } from 'uuid';
import LLMProvider from './LLMProvider.js';
import Article from '../models/Article.js';
import Ticket from '../models/Ticket.js';
import AgentSuggestion from '../models/AgentSuggestion.js';
import AuditLog from '../models/AuditLog.js';
import Config from '../models/Config.js';

class AgentService {
  constructor() {
    this.plannerSteps = [
      'PLAN_EXECUTION',
      'CLASSIFY_TICKET',
      'RETRIEVE_KB_ARTICLES',
      'DRAFT_REPLY',
      'MAKE_DECISION'
    ];
  }

  async triageTicket(ticketId) {
    const traceId = uuidv4();
    const startTime = Date.now();

    try {
      // Step 1: Plan execution
      await this.logAction(ticketId, traceId, 'system', 'AGENT_TRIAGE_STARTED', { 
        traceId,
        plannerSteps: this.plannerSteps
      });

      // Get ticket
      const ticket = await Ticket.findById(ticketId).populate('createdBy', 'name email');
      if (!ticket) {
        throw new Error('Ticket not found');
      }

      // Execute planned steps
      const executionPlan = await this.createExecutionPlan(ticket, traceId);
      
      // Step 2: Classify
      const classificationResult = await this.classifyTicket(ticket, traceId);
      
      // Step 3: Retrieve KB articles
      const retrievalResult = await this.retrieveKBArticles(ticket, classificationResult, traceId);
      
      // Step 4: Draft reply
      const draftResult = await this.draftReply(ticket, retrievalResult.articles, traceId);
      
      // Step 5: Create suggestion
      const suggestion = await AgentSuggestion.create({
        ticketId,
        predictedCategory: classificationResult.predictedCategory,
        articleIds: retrievalResult.articles.map(a => a._id),
        draftReply: draftResult.draftReply,
        confidence: classificationResult.confidence,
        modelInfo: {
          provider: 'stub',
          model: 'deterministic-v1',
          promptVersion: '1.0',
          latencyMs: Date.now() - startTime
        }
      });

      
      await this.makeDecision(ticket, suggestion, traceId);

      await this.logAction(ticketId, traceId, 'system', 'AGENT_TRIAGE_COMPLETED', { 
        suggestionId: suggestion._id,
        totalLatencyMs: Date.now() - startTime,
        finalStatus: ticket.status,
        autoResolved: suggestion.autoClosed
      });

      return suggestion;
    } catch (error) {
      await this.logAction(ticketId, traceId, 'system', 'AGENT_TRIAGE_FAILED', { 
        error: error.message,
        stack: error.stack?.substring(0, 500) 
      });
      throw error;
    }
  }

  async createExecutionPlan(ticket, traceId) {

    const plan = {
      requiresClassification: true,
      requiresKBRetrieval: true,
      requiresDraftGeneration: true,
      requiresDecision: true,
      estimatedSteps: this.plannerSteps.length,
      complexity: this.assessComplexity(ticket)
    };

    await this.logAction(ticket._id, traceId, 'system', 'EXECUTION_PLAN_CREATED', {
      plan,
      ticketLength: ticket.description.length,
      hasAttachments: ticket.attachmentUrls?.length > 0
    });

    return plan;
  }

  assessComplexity(ticket) {
    let complexity = 'low';
    
    if (ticket.description.length > 500) complexity = 'medium';
    if (ticket.description.length > 1000) complexity = 'high';
    if (ticket.attachmentUrls?.length > 0) complexity = 'high';
 
    const complexKeywords = ['integration', 'api', 'database', 'custom', 'enterprise'];
    if (complexKeywords.some(keyword => 
      ticket.description.toLowerCase().includes(keyword) || 
      ticket.title.toLowerCase().includes(keyword)
    )) {
      complexity = 'high';
    }

    return complexity;
  }

  async classifyTicket(ticket, traceId) {
    const startTime = Date.now();
    const text = `${ticket.title} ${ticket.description}`;
    
    await this.logAction(ticket._id, traceId, 'system', 'CLASSIFICATION_STARTED', {
      textLength: text.length,
      originalCategory: ticket.category
    });

    const result = await LLMProvider.classify(text);
    
    await this.logAction(ticket._id, traceId, 'system', 'AGENT_CLASSIFIED', {
      predictedCategory: result.predictedCategory,
      confidence: result.confidence,
      originalCategory: ticket.category,
      categoryChanged: ticket.category !== result.predictedCategory,
      latencyMs: Date.now() - startTime
    });

    return result;
  }

  async retrieveKBArticles(ticket, classificationResult, traceId) {
    const startTime = Date.now();
    const searchText = `${ticket.title} ${ticket.description}`;
    
    await this.logAction(ticket._id, traceId, 'system', 'KB_RETRIEVAL_STARTED', {
      searchQuery: searchText.substring(0, 100) + '...',
      predictedCategory: classificationResult.predictedCategory
    });

   
    let articles = await Article.find({
      status: 'published',
      $text: { $search: searchText }
    })
    .select('title body tags score')
    .sort({ score: { $meta: 'textScore' } })
    .limit(3);

    
    if (articles.length === 0) {
      articles = await Article.find({
        status: 'published',
        tags: { $in: [classificationResult.predictedCategory, 'general'] }
      })
      .select('title body tags')
      .limit(3);
    }

    if (articles.length === 0) {
      articles = await Article.find({ status: 'published' })
        .select('title body tags')
        .sort({ createdAt: -1 })
        .limit(3);
    }


    const scoredArticles = this.scoreArticles(articles, ticket, classificationResult);

    await this.logAction(ticket._id, traceId, 'system', 'KB_RETRIEVED', {
      articlesFound: articles.length,
      articleIds: articles.map(a => a._id),
      searchMethod: articles.length > 0 ? 'text_search' : 'category_fallback',
      latencyMs: Date.now() - startTime,
      averageScore: scoredArticles.reduce((acc, a) => acc + a.relevanceScore, 0) / scoredArticles.length
    });

    return { articles: scoredArticles };
  }

  scoreArticles(articles, ticket, classificationResult) {
    return articles.map(article => {
      let relevanceScore = 0;
  
      const matchingTags = article.tags.filter(tag => 
        ticket.description.toLowerCase().includes(tag) ||
        ticket.title.toLowerCase().includes(tag) ||
        tag === classificationResult.predictedCategory
      );
      relevanceScore += matchingTags.length * 0.3;

     
      const titleWords = article.title.toLowerCase().split(' ');
      const ticketWords = `${ticket.title} ${ticket.description}`.toLowerCase().split(' ');
      const titleMatches = titleWords.filter(word => 
        word.length > 3 && ticketWords.includes(word)
      ).length;
      relevanceScore += titleMatches * 0.2;

      
      if (article.tags.includes(classificationResult.predictedCategory)) {
        relevanceScore += 0.5;
      }

      return {
        ...article.toObject(),
        relevanceScore: Math.min(relevanceScore, 1.0)
      };
    }).sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  async draftReply(ticket, articles, traceId) {
    const startTime = Date.now();
    const text = `${ticket.title} ${ticket.description}`;
    
    await this.logAction(ticket._id, traceId, 'system', 'DRAFT_GENERATION_STARTED', {
      articleCount: articles.length,
      ticketComplexity: this.assessComplexity(ticket)
    });

    const result = await LLMProvider.draft(text, articles);
    
    const enhancedResult = {
      ...result,
      metadata: {
        articleReferences: articles.length,
        draftLength: result.draftReply.length,
        citationCount: result.citations.length,
        estimatedReadingTime: Math.ceil(result.draftReply.length / 200) // ~200 words per minute
      }
    };
    
    await this.logAction(ticket._id, traceId, 'system', 'DRAFT_GENERATED', {
      draftLength: result.draftReply.length,
      citationsCount: result.citations.length,
      latencyMs: Date.now() - startTime,
      readabilityScore: this.calculateReadabilityScore(result.draftReply)
    });

    return enhancedResult;
  }

  calculateReadabilityScore(text) {

    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    
    
    return Math.min(avgWordsPerSentence / 25, 1.0);
  }

  async makeDecision(ticket, suggestion, traceId) {
    const config = await this.getConfig();
    
    await this.logAction(ticket._id, traceId, 'system', 'DECISION_EVALUATION_STARTED', {
      confidence: suggestion.confidence,
      threshold: config.confidenceThreshold,
      autoCloseEnabled: config.autoCloseEnabled
    });

    if (config.autoCloseEnabled && suggestion.confidence >= config.confidenceThreshold) {
      // Auto-resolve the ticket
      await Ticket.findByIdAndUpdate(ticket._id, {
        status: 'resolved',
        agentSuggestionId: suggestion._id,
        $push: {
          replies: {
            author: null, // System reply
            content: suggestion.draftReply,
            isAgent: true,
            createdAt: new Date()
          }
        }
      });

      await AgentSuggestion.findByIdAndUpdate(suggestion._id, {
        autoClosed: true
      });

      await this.logAction(ticket._id, traceId, 'system', 'AUTO_CLOSED', {
        confidence: suggestion.confidence,
        threshold: config.confidenceThreshold,
        replyLength: suggestion.draftReply.length
      });

      
      this.scheduleFollowUp(ticket._id, 24); 

    } else {
   
      await Ticket.findByIdAndUpdate(ticket._id, {
        status: 'waiting_human',
        agentSuggestionId: suggestion._id
      });

      const reason = !config.autoCloseEnabled ? 'auto_close_disabled' : 'low_confidence';
      
      await this.logAction(ticket._id, traceId, 'system', 'ASSIGNED_TO_HUMAN', {
        reason,
        confidence: suggestion.confidence,
        threshold: config.confidenceThreshold,
        requiresHumanReview: true
      });
    }
  }

  scheduleFollowUp(ticketId, hoursDelay) {
    
    console.log(`📅 Follow-up scheduled for ticket ${ticketId} in ${hoursDelay} hours`);
    
    
    if (process.env.NODE_ENV !== 'test') {
      setTimeout(async () => {
        try {
          await this.checkTicketSatisfaction(ticketId);
        } catch (error) {
          console.error('Follow-up check failed:', error);
        }
      }, hoursDelay * 60 * 60 * 1000); 
    }
  }

  async checkTicketSatisfaction(ticketId) {
    const traceId = uuidv4();
    
    try {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket || ticket.status !== 'resolved') {
        return; 
      }

      await this.logAction(ticketId, traceId, 'system', 'SATISFACTION_CHECK', {
        ticketStatus: ticket.status,
        hoursOpen: Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / (1000 * 60 * 60))
      });

      console.log(`📧 Satisfaction survey sent for ticket ${ticketId}`);
      
    } catch (error) {
      await this.logAction(ticketId, traceId, 'system', 'SATISFACTION_CHECK_FAILED', {
        error: error.message
      });
    }
  }

  async getConfig() {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({
        autoCloseEnabled: false,
        confidenceThreshold: 0.8,
        slaHours: 24
      });
    }
    return config;
  }

  async logAction(ticketId, traceId, actor, action, meta = {}) {
    try {
      await AuditLog.create({
        ticketId,
        traceId,
        actor,
        action,
        meta,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log action:', error);
      
    }
  }

  
  async getTriageStats() {
    const stats = await AgentSuggestion.aggregate([
      {
        $group: {
          _id: null,
          totalSuggestions: { $sum: 1 },
          autoClosedCount: { $sum: { $cond: ['$autoClosed', 1, 0] } },
          averageConfidence: { $avg: '$confidence' },
          averageLatency: { $avg: '$modelInfo.latencyMs' }
        }
      }
    ]);

    return stats[0] || {
      totalSuggestions: 0,
      autoClosedCount: 0,
      averageConfidence: 0,
      averageLatency: 0
    };
  }

  async getCategoryStats() {
    return await AgentSuggestion.aggregate([
      {
        $group: {
          _id: '$predictedCategory',
          count: { $sum: 1 },
          averageConfidence: { $avg: '$confidence' },
          autoClosedRate: { 
            $avg: { $cond: ['$autoClosed', 1, 0] }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);
  }
}

export default new AgentService();