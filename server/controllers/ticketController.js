

import Ticket from '../models/Ticket.js';
import AgentService from '../services/AgentService.js';
import { Queue, Worker } from 'bullmq';
import Redis from 'redis';


let triageQueue;
try {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  triageQueue = new Queue('triage', { connection: redis });
  
  new Worker('triage', async (job) => {
    await AgentService.triageTicket(job.data.ticketId);
  }, { connection: redis });
} catch (error) {
  console.log('Redis not available, using immediate processing');
}

export const createTicket = async (req, res) => {
  try {
    const { title, description, category, attachmentUrls } = req.body;
    
    const ticket = await Ticket.create({
      title,
      description,
      category,
      attachmentUrls: attachmentUrls || [],
      createdBy: req.user._id
    });

    // Trigger triage
    if (triageQueue) {
      await triageQueue.add('triage', { ticketId: ticket._id });
    } else {
      // Immediate processing fallback
      setTimeout(() => AgentService.triageTicket(ticket._id), 100);
    }

    res.status(201).json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTickets = async (req, res) => {
  try {
    const { status, my } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (my === 'true') query.createdBy = req.user._id;
    
    const tickets = await Ticket.find(query)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(tickets);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignee', 'name email')
      .populate('agentSuggestionId')
      .populate('replies.author', 'name email');
    
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const addReply = async (req, res) => {
  try {
    const { content } = req.body;
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: {
          replies: {
            author: req.user._id,
            content,
            isAgent: req.user.role === 'agent' || req.user.role === 'admin'
          }
        },
        status: 'resolved'
      },
      { new: true }
    ).populate('replies.author', 'name email');
    
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const assignTicket = async (req, res) => {
  try {
    const { assigneeId } = req.body;
    
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { assignee: assigneeId },
      { new: true }
    ).populate('assignee', 'name email');
    
    res.json(ticket);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
