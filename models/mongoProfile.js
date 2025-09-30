const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullname: String,
  phone: String,
  bio: String,
  avatarUrl: String
});

module.exports = mongoose.model('Profile', profileSchema);