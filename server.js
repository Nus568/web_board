// server.js
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const Post = require('./models/post'); // เพิ่มด้านบน
const Comment = require('./models/Comment');const jwt = require('jsonwebtoken');
const cors = require('cors');
const Report = require('./models/report'); // ✅ ต้อง import model ก่อน (lowercase)

// ✅ Import Simple SQLite
const { initDatabase, saveLog, getDashboardStats } = require('./simple-sqlite');








const app = express();
const PORT = 3000;

// ✅ Middleware รองรับ JSON และ x-www-form-urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// ✅ เชื่อม MongoDB ด้วย IPv4 เพื่อหลีกเลี่ยงปัญหา ::1
mongoose.connect('mongodb://127.0.0.1:27017/webboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// ✅ เริ่มต้น SQLite Database
initDatabase();

app.post('/register', async (req, res) => {
  try {
    const { username, email, password, roleRequest } = req.body;
    const role = roleRequest === 'admin' ? 'pendingAdmin' : 'user';
    


    // ✅ แฮชรหัสผ่านก่อนบันทึก
    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({ username, email, password: passwordHash, role });


    await user.save();
    res.json({ message: '✅ Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Registration failed', details: err.message });
  }
});

// ✅ Login
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid password' });

    // ✅ บันทึก login log
    saveLog(user._id.toString(), 'login', `User ${username} logged in`);
    
    res.json({ message: '✅ Login successful', userId: user._id, role: user.role });


    
  } catch (err) {
    res.status(500).json({ error: '❌ Login failed', details: err.message });
  }
});

// ✅ Logout route
app.post('/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    
    // ✅ บันทึก logout log
    saveLog(userId, 'logout', 'User logged out');
    
    res.json({ message: '✅ Logout successful' });
  } catch (err) {
    res.status(500).json({ error: '❌ Logout failed', details: err.message });
  }
});

// ✅ Admin Dashboard route (แสดงหน้า HTML)
app.get('/admin/dashboard', (req, res) => {
  const path = require('path');
  res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
});

// ✅ Admin Dashboard data route (ส่งข้อมูล JSON)
app.get('/admin/dashboard-data', (req, res) => {
  getDashboardStats((stats) => {
    res.json(stats);
  });
});

// ✅ Static files
app.use(express.static(__dirname));

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// ================= Post and Comment Routes =================
function commentPost(postId) {
  const content = document.getElementById(`comment-${postId}`).value;
  const userId = localStorage.getItem('userId');

  fetch('http://localhost:3000/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, postId, userId })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    document.getElementById(`comment-${postId}`).value = ''; // ✅ เคลียร์ช่อง
    loadComments(postId); // ✅ โหลดคอมเมนต์ใหม่
  })
  .catch(err => console.error('❌ Comment error:', err));
}


// ✅ ดึงโพสต์ทั้งหมด
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 }) // เรียงจากใหม่ไปเก่า
      .populate('author', 'username'); // ✅ ดึงเฉพาะ username จาก User

    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch posts', details: err.message });
  }
});
// ✅ สร้างโพสต์
app.post('/comments', async (req, res) => {
  try {
    const { content, postId, userId } = req.body;

    const comment = new Comment({
      content,
      post: new mongoose.Types.ObjectId(postId),
      author: new mongoose.Types.ObjectId(userId)
    });

    await comment.save();
    res.json({ message: '✅ Comment added successfully', comment });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to add comment', details: err.message });
  }
});
// ✅ ดึงคอมเมนต์ของโพสต์
app.get('/comments/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .sort({ createdAt: -1 })
      .populate('author', 'username'); // ✅ ดึงชื่อผู้คอมเมนต์

    res.json(comments);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch comments', details: err.message });
  }
});
// ✅ ไลก์โพสต์
app.post('/posts/:id/like', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: '❌ Invalid userId' });
    }
    

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!Array.isArray(post.likes)) {
  post.likes = []; // ✅ ป้องกัน likes เป็น undefined
}

    const userObjectId = new mongoose.Types.ObjectId(userId);
    const hasLiked = post.likes.some(id => id.equals(userObjectId));

    if (hasLiked) {
      post.likes.pull(userObjectId);
      await post.save();
      return res.json({ message: '👍 Unliked', likes: post.likes.length });
    } else {
      post.likes.push(userObjectId);
      await post.save();
      return res.json({ message: '👍 Liked', likes: post.likes.length });
    }
  } catch (err) {
    console.error('❌ Like toggle error:', err);
    res.status(500).json({ error: '❌ Failed to toggle like', details: err.message });
  }
});

// ✅ สร้างโพสต์
app.post('/posts', async (req, res) => {
  try {
    const { title, content, category, userId } = req.body;

    if (!title || !content || !userId) {
      return res.status(400).json({ error: '❌ Missing required fields' });
    }

    const post = new Post({
      title,
      content,
      category, // ✅ ต้องมีตรงนี้
      author: new mongoose.Types.ObjectId(userId)
    });

    await post.save();
    res.json({ message: '✅ Post created successfully', post });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to create post', details: err.message });
  }
});
// ✅ ลบโพสต์
app.delete('/posts/:id', async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    const post = await Post.findById(req.params.id);
    const isOwner = post.author.toString() === userId;
    const isAdmin = user.role === 'admin';

    
    if (!post) return res.status(404).json({ error: 'Post not found' });



    if (!isOwner && !isAdmin) {
  return res.status(403).json({ error: '❌ You do not have permission to delete this post' });
}


    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: '✅ Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to delete post', details: err.message });
  }

  
});
//ระบบคำขอเป็นผู้ดูแลระบบ
// ✅ ดึงคำขอเป็นผู้ดูแลระบบ
app.get('/admin/requests', async (req, res) => {
  try {
    const pending = await User.find({ role: 'pendingAdmin' });
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch requests', details: err.message });
  }
});
//
app.post('/admin/approve/:id', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { role: 'admin' });
  res.json({ message: '✅ Approved as admin' });
});
//
app.post('/admin/reject/:id', async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { role: 'user' });
  res.json({ message: '❌ Rejected admin request' });
});








app.post('/reports', async (req, res) => {
  try {
    const { postId, userId, reason } = req.body;

    const report = new Report({ post: postId, reporter: userId, reason });
    await report.save();

    res.json({ message: '✅ Report submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to submit report', details: err.message });
  }
});

app.get('/admin/reports', async (req, res) => {
  try {
    const reports = await Report.find({ status: 'pending' })
      .populate('post', 'title content')
      .populate('reporter', 'username email');

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to fetch reports', details: err.message });
  }
});
//อนุมัติการอนุญาตแอดมิน
app.post('/admin/reports/:id/approve', async (req, res) => {
  try {
    const { postId } = req.body;
    await Post.findByIdAndDelete(postId);
    await Report.findByIdAndUpdate(req.params.id, { status: 'reviewed' });
    res.json({ message: '✅ Post deleted and report reviewed' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to approve report', details: err.message });
  }
});
//ปฏิเสธการอนุญาตแอดมิน
app.post('/admin/reports/:id/reject', async (req, res) => {
  try {
    await Report.findByIdAndUpdate(req.params.id, { status: 'reviewed' });
    res.json({ message: '❌ Report rejected' });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to reject report', details: err.message });
  }
});
// ✅ แก้ไขคอมเมนต์
app.put('/comments/:id', async (req, res) => {
  try {
    const { content } = req.body;

    const updated = await Comment.findByIdAndUpdate(
      req.params.id,
      { content },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: '❌ Comment not found' });
    }

    res.json({ success: true, updated });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to update comment', details: err.message });
  }
});
// ✅ ลบคอมเมนต์
app.delete('/comments/:id', async (req, res) => {
  console.log('DELETE /comments/:id', req.params.id); // ✅ เพิ่ม log

  try {
    const deleted = await Comment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      console.log('Comment not found'); // ✅ เพิ่ม log

      return res.status(404).json({ error: '❌ Comment not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to delete comment', details: err.message });
  }
});

app.put('/posts/:id', async (req, res) => {
  try {
    const { title, content, category } = req.body;

    const updated = await Post.findByIdAndUpdate(
      req.params.id,
      { title, content, category },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: '❌ Post not found' });
    }

    res.json({ message: '✅ Post updated successfully', post: updated });
  } catch (err) {
    res.status(500).json({ error: '❌ Failed to update post', details: err.message });
  }
});

const Profile = require('./models/mongoProfile');

// ✅ สร้างหรืออัปเดตโปรไฟล์
app.post('/profile', async (req, res) => {
  const { username, fullname, phone, bio, avatarUrl } = req.body;

  try {
    const existing = await Profile.findOne({ username });

    if (existing) {
      existing.fullname = fullname;
      existing.phone = phone;
      existing.bio = bio;
      existing.avatarUrl = avatarUrl;
      await existing.save();
      return res.json({ message: '✅ โปรไฟล์ถูกอัปเดตแล้ว' });
    }

    const profile = new Profile({ username, fullname, phone, bio, avatarUrl });
    await profile.save();
    res.json({ message: '✅ โปรไฟล์ถูกสร้างแล้ว' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ดึงโปรไฟล์
app.get('/profile/:username', async (req, res) => {
  try {
    const profile = await Profile.findOne({ username: req.params.username });
    if (!profile) return res.status(404).json({ error: 'ไม่พบโปรไฟล์' });
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
