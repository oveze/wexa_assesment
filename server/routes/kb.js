import express from 'express';
import mongoose from 'mongoose';
import { auth, requireRole } from '../middleware/auth.js';
import Article from '../models/Article.js';

const router = express.Router();

// Get articles
router.get('/', auth, async (req, res) => {
  console.log('📖 GET /api/kb called');
  console.log('User:', req.user?.email, 'Role:', req.user?.role);
  console.log('Query params:', req.query);

  try {
    const { query, status = 'published' } = req.query;
    let searchQuery = {};

    // Only filter by status if not "all"
    if (status !== 'all') {
      searchQuery.status = status;
    }

    // Apply text search if query exists
    if (query) {
      try {
        await Article.collection.getIndexes();
        searchQuery.$text = { $search: query };
      } catch (indexError) {
        console.log('⚠️  Text index not available, falling back to regex search');
        searchQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { body: { $regex: query, $options: 'i' } }
        ];
      }
    }

    console.log('Search query:', JSON.stringify(searchQuery, null, 2));

    const articles = await Article.find(searchQuery)
      .select('title body tags status createdAt updatedAt')
      .sort(query && searchQuery.$text ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .limit(10);

    console.log(`✅ Found ${articles.length} articles`);
    res.json(articles);
  } catch (error) {
    console.error('❌ GET articles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single article
router.get('/:id', auth, async (req, res) => {
  console.log('📄 GET /api/kb/:id called with ID:', req.params.id);
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
  console.log('\n🚀 POST /api/kb - Creating article');
  try {
    const { title, body, tags, status } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Title is required and cannot be empty' });
    }
    if (!body?.trim()) {
      return res.status(400).json({ error: 'Body is required and cannot be empty' });
    }

    const articleData = {
      title: title.trim(),
      body: body.trim(),
      tags: tags || [],
      status: status || 'draft'
    };

    const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState];
    if (dbState !== 'connected') {
      return res.status(500).json({ error: 'Database not connected' });
    }

    const article = await Article.create(articleData);
    res.status(201).json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article (admin only)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  console.log('✏️  PUT /api/kb/:id called with ID:', req.params.id);
  try {
    const { title, body, tags, status } = req.body;
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (body !== undefined) updateData.body = body;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;

    const article = await Article.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
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
  console.log('🗑️  DELETE /api/kb/:id called with ID:', req.params.id);
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
