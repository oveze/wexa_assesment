
import express from 'express';
import { auth } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

router.get('/tickets/:ticketId', auth, async (req, res) => {
  try {
    const logs = await AuditLog.find({ 
      ticketId: req.params.ticketId 
    }).sort({ timestamp: 1 });
    
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;