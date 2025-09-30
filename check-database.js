// check-database.js - เครื่องมือตรวจสอบข้อมูล SQLite
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'simple.db'); // ✅ เปลี่ยนจาก analytics.db เป็น simple.db
const db = new sqlite3.Database(dbPath);

console.log('🔍 กำลังตรวจสอบฐานข้อมูล SQLite...\n');

// 1. ตรวจสอบตารางที่มีอยู่
db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('📋 ตารางที่มีในฐานข้อมูล:');
  tables.forEach(table => {
    console.log(`   - ${table.name}`);
  });
  console.log('');
});

// 2. ดู structure ของตาราง logs
db.all("PRAGMA table_info(logs)", (err, columns) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('🗂️  โครงสร้างตาราง logs:');
  columns.forEach(col => {
    console.log(`   ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
  });
  console.log('');
});

// 3. นับจำนวนข้อมูลทั้งหมด
db.get("SELECT COUNT(*) as total FROM logs", (err, row) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  console.log(`📊 จำนวนข้อมูลทั้งหมด: ${row.total} รายการ\n`);
});

// 4. สถิติการใช้งานแต่ละประเภท
db.all(`
  SELECT 
    action,
    COUNT(*) as count,
    MIN(created_at) as first_time,
    MAX(created_at) as last_time
  FROM logs 
  GROUP BY action 
  ORDER BY count DESC
`, (err, stats) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('📈 สถิติการใช้งานแต่ละประเภท:');
  console.table(stats);
});

// 5. ข้อมูล 10 รายการล่าสุด
db.all(`
  SELECT 
    id,
    user_id,
    action,
    details,
    datetime(created_at, 'localtime') as time
  FROM logs 
  ORDER BY created_at DESC 
  LIMIT 10
`, (err, recent) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('\n🕐 กิจกรรม 10 รายการล่าสุด:');
  console.table(recent);
});

// 6. สถิติรายวันในสัปดาห์ที่ผ่านมา
db.all(`
  SELECT 
    DATE(created_at) as date,
    action,
    COUNT(*) as count
  FROM logs 
  WHERE DATE(created_at) >= DATE('now', '-7 days')
  GROUP BY DATE(created_at), action
  ORDER BY date DESC, action
`, (err, daily) => {
  if (err) {
    console.error('❌ Error:', err);
    return;
  }
  
  console.log('\n📅 สถิติรายวัน (7 วันที่ผ่านมา):');
  console.table(daily);
  
  // ปิดการเชื่อมต่อฐานข้อมูล
  db.close((err) => {
    if (err) {
      console.error('❌ Error closing database:', err);
    } else {
      console.log('\n✅ ตรวจสอบฐานข้อมูลเสร็จสิ้น');
    }
  });
});