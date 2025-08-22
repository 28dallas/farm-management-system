require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const multer = require('multer');
const db = require('./database');

// Logger setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console()
  ]
});

// In-memory login activity log (for demo)
let loginActivity = [];

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-change-this-in-production-2024';

const app = express();
const PORT = 5001;
const upload = multer({ dest: 'uploads/' });

// Security middleware
app.use(helmet());
app.use(cors({
  origin: true,
  credentials: true
}));

// Enhanced JSON parsing error handling
app.use((req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type']?.includes('application/json')) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        // Clean the body by removing any non-JSON content before parsing
        const cleanedBody = body.trim();
        
        // Check if body is empty
        if (!cleanedBody) {
          logger.warn('Empty JSON body received', { url: req.url });
          return res.status(400).json({ 
            error: 'Empty request body', 
            message: 'Request body cannot be empty' 
          });
        }
        
        // Try to parse JSON
        req.body = JSON.parse(cleanedBody);
        next();
      } catch (error) {
        logger.warn('Invalid JSON received', { 
          url: req.url, 
          body: body.substring(0, 200),
          error: error.message,
          ip: req.ip
        });
        
        // Provide more specific error messages
        let errorMessage = 'Invalid JSON format';
        if (error.message.includes('Unexpected token')) {
          errorMessage = 'Malformed JSON data. Please check your request format.';
        } else if (error.message.includes('Unexpected end of JSON input')) {
          errorMessage = 'Incomplete JSON data. Please check your request.';
        }
        
        return res.status(400).json({ 
          error: errorMessage, 
          message: 'Please ensure your request contains valid JSON data' 
        });
      }
    });
  } else {
    bodyParser.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf.toString());
        } catch (error) {
          logger.warn('BodyParser JSON validation failed', {
            url: req.url,
            error: error.message,
            ip: req.ip
          });
          throw new Error('Invalid JSON format');
        }
      }
    })(req, res, next);
  }
});

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: { error: 'Too many login attempts, please try again later' }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100 // 100 requests per window
});

app.use('/api/login', authLimiter);
app.use('/api/signup', authLimiter);
app.use('/api', generalLimiter);

// JWT middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Invalid token attempt', { ip: req.ip, token: token.substring(0, 10) });
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Password validation
const passwordValidation = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character')
];

// Input validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};


// Signup endpoint
app.post('/api/signup', [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('email').optional().isEmail().normalizeEmail(),
  ...passwordValidation,
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, password, email, displayName } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 12);
    const result = await db.run(
      'INSERT INTO users (username, password, role, email, displayName) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, 'user', email || '', displayName || username]
    );
    
    const token = jwt.sign(
      { id: result.id, username, role: 'user' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logger.info('User registered', { username, id: result.id });
    res.json({ 
      id: result.id, 
      username, 
      role: 'user',
      token 
    });
  } catch (error) {
    logger.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2FA setup endpoint
app.post('/api/2fa/setup', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    const secret = speakeasy.generateSecret({ name: `FarmApp (${username})` });
    await db.run('UPDATE users SET twoFASecret = ? WHERE username = ?', [secret.base32, username]);
    
    qrcode.toDataURL(secret.otpauth_url, (err, imageUrl) => {
      if (err) return res.status(500).json({ message: 'QR code error' });
      res.json({ otpauth_url: secret.otpauth_url, qr: imageUrl, secret: secret.base32 });
    });
  } catch (error) {
    logger.error('2FA setup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// 2FA verify endpoint
app.post('/api/2fa/verify', async (req, res) => {
  try {
    const { username, token } = req.body;
    const user = await db.get('SELECT twoFASecret FROM users WHERE username = ?', [username]);
    if (!user || !user.twoFASecret) return res.status(400).json({ message: '2FA not setup' });
    
    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token
    });
    res.json({ verified });
  } catch (error) {
    logger.error('2FA verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Log login activity
function logLogin(username, status) {
  loginActivity.push({ username, status, time: new Date().toISOString() });
  if (loginActivity.length > 100) loginActivity.shift();
}

// Reset database
app.post('/api/reset', async (req, res) => {
  try {
    await db.run('DELETE FROM income');
    await db.run('DELETE FROM expenses');
    await db.run('DELETE FROM projects');
    await db.run('DELETE FROM crops');
    await db.run('DELETE FROM inventory');
    await db.run('DELETE FROM users');
    
    // Re-insert default users
    const users = [
      { username: 'admin', password: bcrypt.hashSync('adminpass', 12), role: 'admin' },
      { username: 'user1', password: bcrypt.hashSync('user1pass', 12), role: 'user' },
      { username: 'user2', password: bcrypt.hashSync('user2pass', 12), role: 'user' }
    ];
    
    for (const user of users) {
      await db.run(
        'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
        [user.username, user.password, user.role]
      );
    }
    
    res.json({ message: 'Database reset successfully' });
  } catch (error) {
    logger.error('Reset error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// Login endpoint
app.post('/api/login', [
  body('username').trim().escape(),
  body('password').notEmpty(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      logLogin(username, 'fail');
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
      logLogin(username, 'fail');
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    logLogin(username, 'success');
    
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    logger.info('User logged in', { username, id: user.id });
    res.json({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      twoFA: !!user.twoFASecret,
      token 
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get login activity
app.get('/api/login-activity', (req, res) => {
  res.json(loginActivity.slice().reverse());
});





// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Income endpoints
app.get('/api/income', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM income WHERE 1=1';
    const params = [];
    
    const { project, fromDate, toDate } = req.query;
    
    if (project && project !== 'All Projects') {
      sql += ' AND project = ?';
      params.push(project);
    }
    
    if (fromDate) {
      sql += ' AND date >= ?';
      params.push(fromDate);
    }
    
    if (toDate) {
      sql += ' AND date <= ?';
      params.push(toDate);
    }
    
    sql += ' ORDER BY date DESC';
    const income = await db.all(sql, params);
    res.json(income);
  } catch (error) {
    logger.error('Get income error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/income', [
  authenticateToken,
  body('date').isISO8601().toDate(),
  body('project').trim().escape(),
  body('crop').trim().escape(),
  body('yield').optional().isNumeric(),
  body('priceUnit').optional().isNumeric(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { date, project, crop, yield: yieldValue, priceUnit, totalIncome, amount } = req.body;
    const result = await db.run(
      'INSERT INTO income (date, project, crop, yield, priceUnit, totalIncome, amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [date, project, crop, yieldValue, priceUnit, totalIncome, amount]
    );
    
    const newIncome = await db.get('SELECT * FROM income WHERE id = ?', [result.id]);
    res.json(newIncome);
  } catch (error) {
    logger.error('Add income error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Expenses endpoints
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    
    const { project, fromDate, toDate } = req.query;
    
    if (project && project !== 'All Projects') {
      sql += ' AND project = ?';
      params.push(project);
    }
    
    if (fromDate) {
      sql += ' AND date >= ?';
      params.push(fromDate);
    }
    
    if (toDate) {
      sql += ' AND date <= ?';
      params.push(toDate);
    }
    
    sql += ' ORDER BY date DESC';
    const expenses = await db.all(sql, params);
    res.json(expenses);
  } catch (error) {
    logger.error('Get expenses error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/expenses', [
  authenticateToken,
  body('date').isISO8601().toDate(),
  body('description').trim().escape(),
  body('category').trim().escape(),
  body('units').optional().isNumeric(),
  body('costPerUnit').optional().isNumeric(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { date, description, category, project, units, costPerUnit, totalCost, amount } = req.body;
    const result = await db.run(
      'INSERT INTO expenses (date, description, category, project, units, costPerUnit, totalCost, amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [date, description, category, project, units, costPerUnit, totalCost, amount]
    );
    
    const newExpense = await db.get('SELECT * FROM expenses WHERE id = ?', [result.id]);
    res.json(newExpense);
  } catch (error) {
    logger.error('Add expense error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Projects endpoints
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    let sql = 'SELECT * FROM projects WHERE 1=1';
    const params = [];
    
    const { project, fromDate, toDate } = req.query;
    
    if (project && project !== 'All Projects') {
      sql += ' AND name = ?';
      params.push(project);
    }
    
    if (fromDate) {
      sql += ' AND startDate >= ?';
      params.push(fromDate);
    }
    
    if (toDate) {
      sql += ' AND startDate <= ?';
      params.push(toDate);
    }
    
    sql += ' ORDER BY createdAt DESC';
    const projects = await db.all(sql, params);
    res.json(projects);
  } catch (error) {
    logger.error('Get projects error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/projects', [
  authenticateToken,
  body('name').trim().escape(),
  body('crop').trim().escape(),
  body('acreage').optional().isNumeric(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { name, crop, acreage, startDate, status } = req.body;
    const result = await db.run(
      'INSERT INTO projects (name, crop, acreage, startDate, status) VALUES (?, ?, ?, ?, ?)',
      [name, crop, acreage, startDate, status || 'active']
    );
    
    const newProject = await db.get('SELECT * FROM projects WHERE id = ?', [result.id]);
    res.json(newProject);
  } catch (error) {
    logger.error('Add project error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// Inventory endpoints
app.get('/api/inventory', authenticateToken, async (req, res) => {
  try {
    const inventory = await db.all('SELECT * FROM inventory ORDER BY createdAt DESC');
    res.json(inventory);
  } catch (error) {
    logger.error('Get inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Crops endpoints
app.get('/api/crops', authenticateToken, async (req, res) => {
  try {
    const crops = await db.all('SELECT * FROM crops ORDER BY createdAt DESC');
    res.json(crops);
  } catch (error) {
    logger.error('Get crops error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Revenue by crop endpoint
app.get('/api/revenue-by-crop', authenticateToken, async (req, res) => {
  try {
    const revenue = await db.all(`
      SELECT crop, SUM(totalIncome) as totalRevenue, SUM(amount) as totalAmount
      FROM income 
      GROUP BY crop
      ORDER BY totalRevenue DESC
    `);
    res.json(revenue);
  } catch (error) {
    logger.error('Get revenue by crop error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Monthly financials endpoint
app.get('/api/monthly-financials', authenticateToken, async (req, res) => {
  try {
    const financials = await db.all(`
      SELECT 
        strftime('%Y-%m', date) as month,
        SUM(CASE WHEN totalIncome IS NOT NULL THEN totalIncome ELSE amount END) as income,
        0 as expenses
      FROM income
      GROUP BY strftime('%Y-%m', date)
      UNION ALL
      SELECT 
        strftime('%Y-%m', date) as month,
        0 as income,
        SUM(CASE WHEN totalCost IS NOT NULL THEN totalCost ELSE amount END) as expenses
      FROM expenses
      GROUP BY strftime('%Y-%m', date)
      ORDER BY month DESC
    `);
    res.json(financials);
  } catch (error) {
    logger.error('Get monthly financials error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Summary endpoint
app.get('/api/summary', authenticateToken, async (req, res) => {
  try {
    const { project, fromDate, toDate } = req.query;
    
    let incomeWhere = '1=1';
    let expenseWhere = '1=1';
    const incomeParams = [];
    const expenseParams = [];
    
    if (project && project !== 'All Projects') {
      incomeWhere += ' AND project = ?';
      expenseWhere += ' AND project = ?';
      incomeParams.push(project);
      expenseParams.push(project);
    }
    
    if (fromDate) {
      incomeWhere += ' AND date >= ?';
      expenseWhere += ' AND date >= ?';
      incomeParams.push(fromDate);
      expenseParams.push(fromDate);
    }
    
    if (toDate) {
      incomeWhere += ' AND date <= ?';
      expenseWhere += ' AND date <= ?';
      incomeParams.push(toDate);
      expenseParams.push(toDate);
    }
    
    const incomeResult = await db.get(
      `SELECT SUM(CASE WHEN totalIncome IS NOT NULL THEN totalIncome ELSE amount END) as total FROM income WHERE ${incomeWhere}`,
      incomeParams
    );
    
    const expenseResult = await db.get(
      `SELECT SUM(CASE WHEN totalCost IS NOT NULL THEN totalCost ELSE amount END) as total FROM expenses WHERE ${expenseWhere}`,
      expenseParams
    );
    
    const totalRevenue = incomeResult.total || 0;
    const totalExpenses = expenseResult.total || 0;
    const netProfit = totalRevenue - totalExpenses;
    
    res.json({
      totalRevenue,
      totalExpenses,
      netProfit
    });
  } catch (error) {
    logger.error('Get summary error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});





// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
