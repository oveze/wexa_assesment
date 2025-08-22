
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';


import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import agentRoutes from './routes/agent.js';
import kbRoutes from './routes/kb.js';
import configRoutes from './routes/config.js';
import auditRoutes from './routes/audit.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Smart Helpdesk API Server Running!',
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/kb', kbRoutes);
app.use('/api/config', configRoutes);
app.use('/api/audit', auditRoutes);

// Seed data endpoint for development
app.post('/api/seed', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Seeding not allowed in production' });
  }

  try {
    const User = (await import('./models/User.js')).default;
    const Article = (await import('./models/Article.js')).default;
    const Config = (await import('./models/Config.js')).default;

    // Create default admin user
    const adminExists = await User.findOne({ email: 'admin@smarthelpdesk.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@smarthelpdesk.com',
        passwordHash: 'admin123',
        role: 'admin'
      });
    }

    // Create sample agent
    const agentExists = await User.findOne({ email: 'agent@smarthelpdesk.com' });
    if (!agentExists) {
      await User.create({
        name: 'Support Agent',
        email: 'agent@smarthelpdesk.com',
        passwordHash: 'agent123',
        role: 'agent'
      });
    }

    // Create sample user
    const userExists = await User.findOne({ email: 'user@example.com' });
    if (!userExists) {
      await User.create({
        name: 'Test User',
        email: 'user@example.com',
        passwordHash: 'user123',
        role: 'user'
      });
    }

    // Create sample KB articles
    const sampleArticles = [
      {
        title: 'How to Request a Refund',
        body: 'To request a refund, please follow these steps:\n\n1. Log into your account dashboard\n2. Navigate to "Order History" section\n3. Find the order you want to refund\n4. Click "Request Refund" button\n5. Select a reason for the refund\n6. Submit your request\n\nRefunds are typically processed within 5-7 business days. You will receive an email confirmation once the refund has been initiated.',
        tags: ['billing', 'refund', 'orders', 'payment'],
        status: 'published'
      },
      {
        title: 'Troubleshooting Login Issues',
        body: 'If you\'re experiencing problems logging into your account, try these solutions:\n\n1. **Clear Browser Data**: Clear your browser\'s cache and cookies\n2. **Try Incognito Mode**: Use a private/incognito window\n3. **Check Email**: Ensure your email address is spelled correctly\n4. **Reset Password**: Use the "Forgot Password" link if needed\n5. **Disable Extensions**: Temporarily disable browser extensions\n6. **Try Different Browser**: Test with another web browser\n\nIf none of these solutions work, please contact our technical support team.',
        tags: ['tech', 'login', 'authentication', 'troubleshooting'],
        status: 'published'
      },
      {
        title: 'Shipping and Delivery Information',
        body: 'We offer several shipping options to meet your needs:\n\n**Shipping Options:**\n- Standard Shipping (5-7 business days): Free on orders over $50\n- Express Shipping (2-3 business days): $9.99\n- Overnight Shipping (1 business day): $19.99\n\n**Tracking Your Order:**\n- You\'ll receive a tracking number via email once your order ships\n- Use the tracking number on our website or the carrier\'s site\n- Updates are provided in real-time\n\n**Delivery Notes:**\n- Delivery times may vary during peak seasons\n- Someone must be available to receive the package\n- We offer delivery notifications via SMS (optional)',
        tags: ['shipping', 'delivery', 'tracking', 'orders'],
        status: 'published'
      },
      {
        title: 'Account Security Best Practices',
        body: 'Keep your account secure by following these guidelines:\n\n**Password Security:**\n- Use a unique, strong password\n- Include uppercase, lowercase, numbers, and special characters\n- Change your password regularly\n- Never share your password with others\n\n**Two-Factor Authentication:**\n- Enable 2FA in your account settings\n- Use an authenticator app for best security\n- Keep backup codes in a safe place\n\n**Account Monitoring:**\n- Review account activity regularly\n- Report suspicious activity immediately\n- Log out from shared devices\n- Keep your email address updated',
        tags: ['security', 'account', 'password', 'two-factor'],
        status: 'published'
      },
      {
        title: 'Product Return Policy',
        body: 'Our return policy is designed to ensure customer satisfaction:\n\n**Return Window:**\n- 30 days from delivery date\n- Items must be in original condition\n- Original packaging required\n\n**Return Process:**\n1. Initiate return request in your account\n2. Print the prepaid return label\n3. Package the item securely\n4. Drop off at any authorized location\n\n**Refund Processing:**\n- Refunds processed within 3-5 business days after we receive the item\n- Original payment method will be credited\n- Shipping costs are non-refundable (unless item was defective)\n\n**Non-Returnable Items:**\n- Personalized or custom items\n- Digital downloads\n- Perishable goods',
        tags: ['returns', 'policy', 'refund', 'shipping'],
        status: 'published'
      }
    ];

    for (const article of sampleArticles) {
      const exists = await Article.findOne({ title: article.title });
      if (!exists) {
        await Article.create(article);
      }
    }

 
    let config = await Config.findOne();
    if (!config) {
      config = await Config.create({
        autoCloseEnabled: false,
        confidenceThreshold: 0.8,
        slaHours: 24
      });
    }

    res.json({
      message: 'Database seeded successfully',
      users: await User.countDocuments(),
      articles: await Article.countDocuments(),
      config: !!config
    });
  } catch (error) {
    console.error('Seeding error:', error);
    res.status(500).json({ error: 'Failed to seed database', details: error.message });
  }
});

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-helpdesk';

mongoose.set('strictQuery', false);

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📦 Database: ${MONGODB_URI}`);
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  console.log('ℹ️  Make sure MongoDB is running on your system');
  process.exit(1);
});


process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});


app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Smart Helpdesk Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Login endpoint: http://localhost:${PORT}/api/auth/login`);
  console.log(`📝 Register endpoint: http://localhost:${PORT}/api/auth/register`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`🌱 Seed data: POST http://localhost:${PORT}/api/seed`);
  }
});

export default app;