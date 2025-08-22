
import express from 'express';
import { auth } from '../middleware/auth.js';
import { 
  createTicket, 
  getTickets, 
  getTicket, 
  addReply, 
  assignTicket 
} from '../controllers/ticketController.js';

const router = express.Router();

router.use(auth);
router.post('/', createTicket);
router.get('/', getTickets);
router.get('/:id', getTicket);
router.post('/:id/reply', addReply);
router.post('/:id/assign', assignTicket);

export default router;