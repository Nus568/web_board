// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true }, // เก็บรหัสผ่านแบบ hash
  role:     { type: String, enum: ['user', 'admin'], default: 'user' }, // ✅ เพิ่มตรงนี้
  createdAt: { type: Date, default: Date.now }
});



module.exports = mongoose.model('User', userSchema);