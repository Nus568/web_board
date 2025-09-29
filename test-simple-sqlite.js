// 🧪 ตัวอย่างการใช้งาน Simple SQLite
const { initDatabase, saveLog, getLogs, cleanOldLogs } = require('./simple-sqlite');

// 1. เริ่มต้นฐานข้อมูล
initDatabase();

// 2. บันทึก log
setTimeout(() => {
  saveLog('user123', 'login', 'User logged in from Chrome');
  saveLog('user456', 'logout', 'User logged out');
  saveLog('user123', 'create_post', 'Created new post: Hello World');
}, 1000);

// 3. ดึงข้อมูล logs
setTimeout(() => {
  getLogs(5, (logs) => {
    console.log('\n📋 Recent Logs:');
    logs.forEach(log => {
      console.log(`${log.created_at} | ${log.user_id} | ${log.action} | ${log.details}`);
    });
  });
}, 2000);

// 4. ทำความสะอาดข้อมูลเก่า (ถ้าต้องการ)
setTimeout(() => {
  cleanOldLogs();
}, 3000);