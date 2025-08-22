
import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import Config from '../models/Config.js';

const router = express.Router();


router.get('/', auth, async (req, res) => {
  try {
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({});
    }
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


router.put('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { autoCloseEnabled, confidenceThreshold, slaHours } = req.body;
    
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({
        autoCloseEnabled,
        confidenceThreshold,
        slaHours
      });
    } else {
      config.autoCloseEnabled = autoCloseEnabled ?? config.autoCloseEnabled;
      config.confidenceThreshold = confidenceThreshold ?? config.confidenceThreshold;
      config.slaHours = slaHours ?? config.slaHours;
      await config.save();
    }
    
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;