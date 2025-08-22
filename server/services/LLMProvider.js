// #### /services/LLMProvider.js

import { v4 as uuidv4 } from 'uuid';

class LLMProvider {
  constructor() {
    this.stubMode = process.env.STUB_MODE === 'true';
  }

  async classify(text) {
    if (this.stubMode) {
      return this.stubClassify(text);
    }
    // Real LLM implementation would go here
    throw new Error('Real LLM not implemented');
  }

  async draft(text, articles) {
    if (this.stubMode) {
      return this.stubDraft(text, articles);
    }
    // Real LLM implementation would go here
    throw new Error('Real LLM not implemented');
  }

  stubClassify(text) {
    const lowerText = text.toLowerCase();
    
    // Keyword-based classification
    const billingKeywords = ['refund', 'invoice', 'payment', 'billing', 'charge', 'subscription'];
    const techKeywords = ['error', 'bug', 'crash', 'login', 'password', 'not working', 'broken'];
    const shippingKeywords = ['delivery', 'shipment', 'shipping', 'package', 'tracking', 'arrived'];

    let category = 'other';
    let matches = 0;

    const billingMatches = billingKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const techMatches = techKeywords.filter(keyword => lowerText.includes(keyword)).length;
    const shippingMatches = shippingKeywords.filter(keyword => lowerText.includes(keyword)).length;

    if (billingMatches > matches) {
      category = 'billing';
      matches = billingMatches;
    }
    if (techMatches > matches) {
      category = 'tech';
      matches = techMatches;
    }
    if (shippingMatches > matches) {
      category = 'shipping';
      matches = shippingMatches;
    }

    // Generate confidence based on matches
    const confidence = Math.min(0.3 + (matches * 0.2), 0.95);

    return {
      predictedCategory: category,
      confidence
    };
  }

  stubDraft(text, articles) {
    const citations = articles.map((article, index) => 
      `[${index + 1}] ${article.title}`
    );

    const draftReply = `Thank you for contacting our support team. Based on your inquiry, I've found some relevant information that might help:

${articles.map((article, index) => 
  `${index + 1}. ${article.title} - ${article.body.substring(0, 100)}...`
).join('\n\n')}

If you need further assistance, please don't hesitate to reach out.

Best regards,
Smart Helpdesk AI`;

    return {
      draftReply,
      citations
    };
  }
}

export default new LLMProvider();
