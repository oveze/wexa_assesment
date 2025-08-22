
import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import AgentService from '../services/AgentService.js';
import AgentSuggestion from '../models/AgentSuggestion.js';

const router = express.Router();


router.post('/triage', auth, requireRole(['admin', 'agent']), async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ error: 'ticketId is required' });
    }
    
    const suggestion = await AgentService.triageTicket(ticketId);
    res.json(suggestion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.get('/suggestion/:ticketId', auth, async (req, res) => {
  try {
    const suggestion = await AgentSuggestion.findOne({ 
      ticketId: req.params.ticketId 
    }).populate('articleIds');
    
    if (!suggestion) {
      return res.status(404).json({ error: 'No suggestion found for this ticket' });
    }
    
    res.json(suggestion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;