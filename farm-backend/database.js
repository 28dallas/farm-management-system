const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'farm.db');

class Database {
  constructor() {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.serialize(() => {
      // Users table
      this.db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        email TEXT,
        displayName TEXT,
        twoFASecret TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Income table
      this.db.run(`CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        project TEXT NOT NULL,
        crop TEXT NOT NULL,
        yield REAL,
        priceUnit REAL,
        totalIncome REAL,
        amount REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Expenses table
      this.db.run(`CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        project TEXT,
        units REAL,
        costPerUnit REAL,
        totalCost REAL,
        amount REAL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Projects table
      this.db.run(`CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        crop TEXT NOT NULL,
        acreage REAL,
        startDate TEXT,
        status TEXT DEFAULT 'active',
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Crops table
      this.db.run(`CREATE TABLE IF NOT EXISTS crops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        variety TEXT,
        plantingDate TEXT,
        harvestDate TEXT,
        project TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Inventory table
      this.db.run(`CREATE TABLE IF NOT EXISTS inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT,
        category TEXT,
        location TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Insert default users if they don't exist
      this.db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
        if (!err && row.count === 0) {
          const users = [
            { username: 'admin', password: bcrypt.hashSync('adminpass', 12), role: 'admin' },
            { username: 'user1', password: bcrypt.hashSync('user1pass', 12), role: 'user' },
            { username: 'user2', password: bcrypt.hashSync('user2pass', 12), role: 'user' }
          ];

          users.forEach(user => {
            this.db.run(
              "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
              [user.username, user.password, user.role]
            );
          });
        }
      });
    });
  }

  // Generic query methods
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  }

  close() {
    this.db.close();
  }
}

module.exports = new Database();