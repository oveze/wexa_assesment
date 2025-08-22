


import mongoose from 'mongoose';

const agentSuggestionSchema = new mongoose.Schema({
  ticketId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Ticket', 
    required: true 
  },
  predictedCategory: { 
    type: String, 
    enum: ['billing', 'tech', 'shipping', 'other'],
    required: true
  },
  articleIds: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Article' 
  }],
  draftReply: { type: String, required: true },
  confidence: { type: Number, min: 0, max: 1, required: true },
  autoClosed: { type: Boolean, default: false },
  modelInfo: {
    provider: { type: String, default: 'stub' },
    model: { type: String, default: 'deterministic-v1' },
    promptVersion: { type: String, default: '1.0' },
    latencyMs: { type: Number }
  }
}, { timestamps: true });

export default mongoose.model('AgentSuggestion', agentSuggestionSchema);
