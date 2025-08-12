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
const PORT = 5000;
const upload = multer({ dest: 'uploads/' });
const dbPath = path.join(__dirname, 'db.json');

// Security middleware
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

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
], (req, res) => {
  const { username, password, email, displayName } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  const data = readDB();
  if (data.users.find(u => u.username === username)) {
    return res.status(409).json({ message: 'Username already exists' });
  }
  const newUser = {
    id: Date.now(),
    username,
    password: bcrypt.hashSync(password, 12),
    role: 'user',
    email: email || '',
    displayName: displayName || username,
    createdAt: new Date().toISOString()
  };
  data.users.push(newUser);
  writeDB(data);
  
  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  logger.info('User registered', { username, id: newUser.id });
  res.json({ 
    id: newUser.id, 
    username: newUser.username, 
    role: newUser.role,
    token 
  });
});

// 2FA setup endpoint
app.post('/api/2fa/setup', (req, res) => {
  const { username } = req.body;
  const data = readDB();
  const user = data.users.find(u => u.username === username);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const secret = speakeasy.generateSecret({ name: `FarmApp (${username})` });
  user.twoFASecret = secret.base32;
  writeDB(data);
  qrcode.toDataURL(secret.otpauth_url, (err, imageUrl) => {
    if (err) return res.status(500).json({ message: 'QR code error' });
    res.json({ otpauth_url: secret.otpauth_url, qr: imageUrl, secret: secret.base32 });
  });
});

// 2FA verify endpoint
app.post('/api/2fa/verify', (req, res) => {
  const { username, token } = req.body;
  const data = readDB();
  const user = data.users.find(u => u.username === username);
  if (!user || !user.twoFASecret) return res.status(400).json({ message: '2FA not setup' });
  const verified = speakeasy.totp.verify({
    secret: user.twoFASecret,
    encoding: 'base32',
    token
  });
  res.json({ verified });
});

// Log login activity
function logLogin(username, status) {
  loginActivity.push({ username, status, time: new Date().toISOString() });
  if (loginActivity.length > 100) loginActivity.shift();
}

// Export db.json
app.get('/api/export', (req, res) => {
  res.download(dbPath, 'db.json');
});

// Import db.json
app.post('/api/import', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ message: 'No file uploaded' });
  fs.copyFileSync(file.path, dbPath);
  fs.unlinkSync(file.path);
  res.json({ message: 'Data imported successfully' });
});

// Reset db.json
app.post('/api/reset', (req, res) => {
  const initialData = {
    income: [],
    expenses: [],
    projects: [],
    revenueByCrop: [],
    users: [
      {
        id: 1,
        username: 'admin',
        password: bcrypt.hashSync('adminpass', 12),
        role: 'admin'
      },
      {
        id: 2,
        username: 'user1',
        password: bcrypt.hashSync('user1pass', 12),
        role: 'user'
      },
      {
        id: 3,
        username: 'user2',
        password: bcrypt.hashSync('user2pass', 12),
        role: 'user'
      }
    ]
  };
  fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  res.json({ message: 'Data reset successfully' });
});




// Initialize database with users
const initDB = () => {
  if (!fs.existsSync(dbPath)) {
    // Pre-hash passwords for demo users
    const users = [
      {
        id: 1,
        username: 'admin',
        password: bcrypt.hashSync('adminpass', 12),
        role: 'admin'
      },
      {
        id: 2,
        username: 'user1',
        password: bcrypt.hashSync('user1pass', 12),
        role: 'user'
      },
      {
        id: 3,
        username: 'user2',
        password: bcrypt.hashSync('user2pass', 12),
        role: 'user'
      }
    ];
    const initialData = {
      income: [],
      expenses: [],
      projects: [],
      revenueByCrop: [],
      users
    };
    fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
  }
};
// Login endpoint
app.post('/api/login', [
  body('username').trim().escape(),
  body('password').notEmpty(),
  handleValidationErrors
], (req, res) => {
  const { username, password } = req.body;
  const data = readDB();
  const user = data.users && data.users.find(u => u.username === username);
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
});

// Get login activity
app.get('/api/login-activity', (req, res) => {
  res.json(loginActivity.slice().reverse());
});

const readDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const writeDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));



// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Income endpoints
app.get('/api/income', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.income);
});

app.post('/api/income', [
  authenticateToken,
  body('date').isISO8601().toDate(),
  body('project').trim().escape(),
  body('crop').trim().escape(),
  body('yield').optional().isNumeric(),
  body('priceUnit').optional().isNumeric(),
  handleValidationErrors
], (req, res) => {
  const data = readDB();
  const newIncome = { id: Date.now(), ...req.body };
  data.income.push(newIncome);
  writeDB(data);
  res.json(newIncome);
});



// Expenses endpoints
app.get('/api/expenses', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.expenses);
});

app.post('/api/expenses', [
  authenticateToken,
  body('date').isISO8601().toDate(),
  body('description').trim().escape(),
  body('category').trim().escape(),
  body('units').optional().isNumeric(),
  body('costPerUnit').optional().isNumeric(),
  handleValidationErrors
], (req, res) => {
  const data = readDB();
  const newExpense = { id: Date.now(), ...req.body };
  data.expenses.push(newExpense);
  writeDB(data);
  res.json(newExpense);
});



// Projects endpoints
app.get('/api/projects', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.projects);
});

app.post('/api/projects', [
  authenticateToken,
  body('name').trim().escape(),
  body('crop').trim().escape(),
  body('acreage').optional().isNumeric(),
  handleValidationErrors
], (req, res) => {
  const data = readDB();
  const newProject = { id: Date.now(), ...req.body };
  data.projects.push(newProject);
  writeDB(data);
  res.json(newProject);
});



// Revenue by crop endpoint
app.get('/api/revenue-by-crop', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.revenueByCrop);
});



// Monthly financials endpoint
app.get('/api/monthly-financials', authenticateToken, (req, res) => {
  const data = readDB();
  res.json(data.monthlyFinancials);
});



// Summary endpoint
app.get('/api/summary', authenticateToken, (req, res) => {
  const data = readDB();
  const totalRevenue = data.income.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalExpenses = data.expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netProfit = totalRevenue - totalExpenses;
  res.json({
    totalRevenue,
    totalExpenses,
    netProfit
  });
});



initDB();

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack, url: req.url });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on http://localhost:${PORT}`);
});
