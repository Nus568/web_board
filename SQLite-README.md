# 📊 Simple SQLite - คู่มือการใช้งาน

## วิธีใช้งาน

### 1. Import functions
```javascript
const { initDatabase, saveLog, getLogs, cleanOldLogs } = require('./simple-sqlite');
```

### 2. เริ่มต้นฐานข้อมูล (รันครั้งเดียว)
```javascript
initDatabase();
```

### 3. บันทึก log
```javascript
// saveLog(userId, action, details)
saveLog('user123', 'login', 'Logged in from Chrome');
saveLog('user456', 'logout', 'Logged out');
saveLog('user789', 'create_post', 'Created: Hello World');
```

### 4. ดึงข้อมูล logs
```javascript
// getLogs(จำนวนที่ต้องการ, callback)
getLogs(10, (logs) => {
  console.log('Recent logs:', logs);
});
```

### 5. ทำความสะอาดข้อมูลเก่า (ถ้าต้องการ)
```javascript
cleanOldLogs(); // เก็บแค่ 100 รายการล่าสุด
```

## ตัวอย่างใน Express.js

```javascript
const express = require('express');
const { initDatabase, saveLog } = require('./simple-sqlite');

const app = express();

// เริ่มต้นฐานข้อมูล
initDatabase();

// ใช้ใน login route
app.post('/login', async (req, res) => {
  // ... login logic ...
  
  // บันทึก log
  saveLog(user.id, 'login', `Logged in from ${req.ip}`);
  
  res.json({ success: true });
});

// ใช้ใน logout route
app.post('/logout', async (req, res) => {
  // ... logout logic ...
  
  // บันทึก log
  saveLog(req.body.userId, 'logout', 'User logged out');
  
  res.json({ success: true });
});
```

## Features
- ✅ ง่ายมาก - แค่ 4 functions
- ✅ ไม่ซับซ้อน - ไม่มี config เยอะ
- ✅ Auto cleanup - ลบข้อมูลเก่าได้
- ✅ พร้อมใช้งาน - แค่ import มาใช้