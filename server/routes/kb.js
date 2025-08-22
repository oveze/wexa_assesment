
import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import Article from '../models/Article.js';

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const { query, status = 'published' } = req.query;
    let searchQuery = { status };
    
    if (query) {
      searchQuery.$text = { $search: query };
    }
    
    const articles = await Article.find(searchQuery)
      .select('title body tags createdAt updatedAt')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10);
    
    res.json(articles);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single article
router.get('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Create article (admin only)
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { title, body, tags, status } = req.body;
    const article = await Article.create({
      title,
      body,
      tags: tags || [],
      status: status || 'draft'
    });
    res.status(201).json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update article (admin only)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { title, body, tags, status } = req.body;
    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { title, body, tags, status },
      { new: true }
    );
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete article (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;