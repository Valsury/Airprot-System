const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const clientsRoutes = require('./routes/clients');
const ticketsRoutes = require('./routes/tickets');
const mockDataRoutes = require('./routes/mock-data');
const { authenticateToken } = require('./middleware/auth');
const { initDatabase } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for Render (important for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Database status check (no auth required for troubleshooting)
app.get('/api/db-status', async (req, res) => {
  try {
    const { pool } = require('./db/init');
    
    // Check if users table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    const tablesExist = tableCheck.rows[0].exists;
    
    if (!tablesExist) {
      return res.json({ 
        status: 'not_initialized',
        message: 'Database tables do not exist. Server needs to initialize them.',
        tablesExist: false,
        adminExists: false
      });
    }
    
    // Check if admin user exists
    const adminCheck = await pool.query('SELECT id, username, email, role FROM users WHERE username = $1', ['admin']);
    const adminExists = adminCheck.rows.length > 0;
    
    res.json({
      status: 'ok',
      message: 'Database is initialized',
      tablesExist: true,
      adminExists: adminExists,
      adminUser: adminExists ? adminCheck.rows[0] : null
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error',
      message: error.message,
      tablesExist: false,
      adminExists: false
    });
  }
});

// Create admin user manually (no auth required for initial setup)
app.post('/api/create-admin', async (req, res) => {
  try {
    const { pool } = require('./db/init');
    const bcrypt = require('bcryptjs');
    
    // Check if admin already exists
    const existingAdmin = await pool.query('SELECT id FROM users WHERE username = $1', ['admin']);
    
    if (existingAdmin.rows.length > 0) {
      return res.status(400).json({ 
        message: 'Admin user already exists',
        username: 'admin'
      });
    }
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      ['admin', 'admin@airport.com', hashedPassword, 'admin']
    );
    
    res.json({
      message: 'Admin user created successfully',
      user: result.rows[0],
      credentials: {
        username: 'admin',
        password: 'admin123'
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      message: 'Error creating admin user',
      error: error.message
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', authenticateToken, clientsRoutes);
app.use('/api/tickets', authenticateToken, ticketsRoutes);
app.use('/api/mock-data', mockDataRoutes); // No auth required for convenience

// Only serve static files if deploying as monolith (when FRONTEND_URL is not set)
// If frontend is separate static site, skip this
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  const staticPath = path.join(__dirname, '../client/build');
  const indexPath = path.join(staticPath, 'index.html');
  
  // Check if static files exist before serving them
  const fs = require('fs');
  if (fs.existsSync(staticPath) && fs.existsSync(indexPath)) {
    app.use(express.static(staticPath));
    
    // All other routes return the React app
    app.get('*', (req, res) => {
      res.sendFile(indexPath);
    });
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
