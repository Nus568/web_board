// 📊 Simple SQLite - แบบง่ายๆ ไม่ซับซ้อน
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'simple.db');

// ✅ สร้างตารางพื้นฐาน
function initDatabase() {
  const db = new sqlite3.Database(DB_PATH);
  
  db.serialize(() => {
    // ตารางสำหรับ log activities
    db.run(`CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      action TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });
  
  db.close();
  console.log('✅ SQLite database initialized');
}

// ✅ บันทึก activity
function saveLog(userId, action, details = '') {
  const db = new sqlite3.Database(DB_PATH);
  
  db.run(
    `INSERT INTO logs (user_id, action, details) VALUES (?, ?, ?)`,
    [userId, action, details],
    function(err) {
      if (err) {
        console.error('❌ Error saving log:', err.message);
      } else {
        console.log(`📝 Log saved: ${action} by user ${userId}`);
      }
    }
  );
  
  db.close();
}

// ✅ ดึงข้อมูล logs ล่าสุด
function getLogs(limit = 10, callback) {
  const db = new sqlite3.Database(DB_PATH);
  
  db.all(
    `SELECT * FROM logs ORDER BY created_at DESC LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        console.error('❌ Error getting logs:', err.message);
        callback([]);
      } else {
        callback(rows);
      }
    }
  );
  
  db.close();
}

// ✅ ลบข้อมูลเก่า (เก็บแค่ 100 รายการล่าสุด)
function cleanOldLogs() {
  const db = new sqlite3.Database(DB_PATH);
  
  db.run(
    `DELETE FROM logs WHERE id NOT IN (
      SELECT id FROM logs ORDER BY created_at DESC LIMIT 100
    )`,
    function(err) {
      if (err) {
        console.error('❌ Error cleaning logs:', err.message);
      } else {
        console.log(`🧹 Cleaned ${this.changes} old logs`);
      }
    }
  );
  
  db.close();
}

// ✅ ดึงสถิติสำหรับ Admin Dashboard (เฉพาะ login/logout)
function getDashboardStats(callback) {
  const db = new sqlite3.Database(DB_PATH);
  
  const stats = {};
  
  db.serialize(() => {
    // จำนวนผู้ใช้ที่เคย login/logout
    db.get(
      `SELECT COUNT(DISTINCT user_id) as total FROM logs WHERE action IN ('login', 'logout')`,
      (err, row) => {
        if (!err) stats.totalUsers = row.total || 0;
      }
    );
    
    // จำนวน login/logout ทั้งหมด
    db.get(
      `SELECT COUNT(*) as total FROM logs WHERE action IN ('login', 'logout')`,
      (err, row) => {
        if (!err) stats.totalActivities = row.total || 0;
      }
    );
    
    // กิจกรรม login/logout ล่าสุด 20 รายการ
    db.all(
      `SELECT * FROM logs WHERE action IN ('login', 'logout') ORDER BY created_at DESC LIMIT 20`,
      (err, rows) => {
        if (!err) stats.recentActivities = rows || [];
        
        db.close();
        callback(stats);
      }
    );
  });
}

module.exports = {
  initDatabase,
  saveLog,
  getLogs,
  cleanOldLogs,
  getDashboardStats
};