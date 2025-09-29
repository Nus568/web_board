document.getElementById('userDisplay').textContent = localStorage.getItem('username');

// ✅ แสดงปุ่ม Dashboard เฉพาะ admin
const userRole = localStorage.getItem('role');
if (userRole === 'admin') {
  document.getElementById('dashboardBtn').style.display = 'inline-block';
}

// 🔹 โหลดโพสต์ทั้งหมด
fetch('http://localhost:3000/posts')
  .then(res => res.json())
  
  .then(posts => {
    const container = document.getElementById('postsContainer');
    posts.forEach(post => {
      const div = document.createElement('div');
      const userId = localStorage.getItem('userId');     // ✅ ดึง userId
      const role = localStorage.getItem('role');         // ✅ ดึง role
      div.id = `post-${post._id}`; // ✅ เพิ่มบรรทัดนี้

  
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <p><strong>โพสต์โดย:</strong> ${post.author?.username || 'ไม่ทราบชื่อ'}</p> <!-- ✅ เพิ่มตรงนี้ -->
        <p><span class="category-tag">📂 ${post.category}</span></p>
        <button onclick="likePost('${post._id}')">👍 Like</button>
       <span id="likes-${post._id}">👍 ${post.likes?.length || 0}</span>
        <input type="text" id="comment-${post._id}" placeholder="Add comment">
        <button onclick="commentPost('${post._id}')">💬 Comment</button> <!-- ✅ เพิ่มตรงนี้ -->
        
        
        <div>
        
        <button onclick="toggleComments('${post._id}')" id="toggle-${post._id}">💬 Comments (...)</button>
        <div id="comments-${post._id}" style="display: none;"></div>
        <button onclick="reportPost('${post._id}')">🚩 รายงานโพสต์</button>
        ${post.author?._id === userId || role === 'admin' ? `<button onclick="deletePost('${post._id}')">🗑️ Delete</button>` : ''}
        ${post.author?._id === userId || role === 'admin' ? `
        <button onclick="startEditPost('${post._id}', '${post.title}', '${post.content}', '${post.category}')">✏️ Edit</button>
        `  : ''}
        </div>
        <hr>
      `;
      container.appendChild(div);
      loadComments(post._id); // ✅ โหลดคอมเมนต์ของแต่ละโพสต์
      

    });
  });
  fetch('http://localhost:3000/admin/reports')
  .then(res => res.json()) // ✅ ต้องเป็น JSON
  .then(reports => {
    // แสดงรายงาน
  })
  .catch(err => {
    console.error('❌ Failed to load reports:', err);
  });

// ✅ เพิ่มคอมเมนต์ให้โพสต์  
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
    
     document.getElementById(`likes-${postId}`).textContent = `👍 ${data.likes ?? 0}`; // ✅ ป้องกัน likes เป็น undefined

    document.getElementById(`comment-${postId}`).value = '';
    loadComments(postId);
  });
}
// ✅ โหลดคอมเมนต์ของโพสต์
function loadComments(postId) {
  fetch(`http://localhost:3000/comments/${postId}`)
    .then(res => res.json())
    .then(comments => {
      const container = document.getElementById(`comments-${postId}`);
      container.innerHTML = comments.map(c => `<p>💬 ${c.content}</p>`).join('');

      // ✅ อัปเดตจำนวนคอมเมนต์บนปุ่ม
      const toggleBtn = document.getElementById(`toggle-${postId}`);
      if (toggleBtn) {
        toggleBtn.textContent = `💬 Comments (${comments.length})`;
      }
    });
}
// ✅ ไลก์โพสต์
function likePost(postId) {
  const userId = localStorage.getItem('userId');
  if (!userId) {
    alert('❌ กรุณา login ก่อนกดไลก์');
    return;
  }

  fetch(`http://localhost:3000/posts/${postId}/like`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  .then(res => {
    if (!res.ok) throw new Error('❌ Like failed');
    return res.json();
  })
  .then(data => {
   //lert(data.message ?? '✅ Like success');
    document.getElementById(`likes-${postId}`).textContent = `👍 ${data.likes ?? 0}`;
  })
  .catch(err => {
    console.error('❌ Like error:', err);
  });
}
// ✅ ออกจากระบบ
function logout() {
  const userId = localStorage.getItem('userId');
  
  // ส่ง logout request ไปที่ server
  fetch('http://localhost:3000/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  .then(() => {
    localStorage.clear();
    window.location.href = 'login.html';
  })
  .catch(err => {
    console.error('❌ Logout error:', err);
    // แม้จะ error ก็ให้ logout ได้
    localStorage.clear();
    window.location.href = 'login.html';
  });
}

// 📊 ไปหน้า Admin Dashboard (เฉพาะ admin)
function goToDashboard() {
  window.location.href = 'http://localhost:3000/admin/dashboard';
}

// ✅ สลับแสดง/ซ่อน คอมเมนต์
function toggleComments(postId) {
  const container = document.getElementById(`comments-${postId}`);
  const isHidden = container.style.display === 'none';

  container.style.display = isHidden ? 'block' : 'none';

  if (isHidden && container.innerHTML.trim() === '') {
    loadComments(postId); // ✅ โหลดคอมเมนต์เมื่อเปิด dropdown ครั้งแรก
  }
}
// ✅ โหลดคอมเมนต์ของโพสต์
function loadComments(postId) {
  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  fetch(`http://localhost:3000/comments/${postId}`)
    .then(res => res.json())
    .then(comments => {
      const container = document.getElementById(`comments-${postId}`);
      container.innerHTML = '';

      comments.forEach(comment => {
        const div = document.createElement('div');
        div.id = `comment-${comment._id}`;
        div.innerHTML = `
          <p>💬 <strong>${comment.author?.username || 'ไม่ทราบชื่อ'}:</strong> ${comment.content}</p>
          ${comment.author?._id === userId || role === 'admin' ? `
            <button onclick="startEditComment('${comment._id}', '${comment.content}', '${postId}')">✏️ Edit</button>
            <button onclick="deleteComment('${comment._id}', '${postId}')">🗑️ Delete</button>

          ` : ''}
        `;
        container.appendChild(div);
      });

      const toggleBtn = document.getElementById(`toggle-${postId}`);
      if (toggleBtn) {
        toggleBtn.textContent = `💬 Commentator (${comments.length})`;
      }
    });
}
// ✅ สร้างโพสต์ใหม่
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;
  const category = document.getElementById('postCategory').value;
  const userId = localStorage.getItem('userId');

  if (!userId) {
    alert('❌ กรุณา login ก่อนโพสต์');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, category, userId }) // ✅ ส่ง category ไปด้วย
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      document.getElementById('postForm').reset(); // ✅ เคลียร์ทุกช่อง
      location.reload();
    } else {
      alert(data.error);
    }
  } catch (err) {
    alert('❌ Network error');
  }
});
// ✅ ลบโพสต์
function deletePost(postId) {
  const userId = localStorage.getItem('userId');
  if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโพสต์นี้?')) return;

  fetch(`http://localhost:3000/posts/${postId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    location.reload(); // ✅ โหลดใหม่เพื่ออัปเดตโพสต์
  })
  .catch(err => {
    alert('❌ ลบโพสต์ไม่สำเร็จ');
    console.error(err);
  });
}

function loadAdminRequests() {
  fetch('http://localhost:3000/admin/requests')
    .then(res => res.json())
    .then(users => {
      const container = document.getElementById('adminRequests');
      container.innerHTML = '<h3>คำขอเป็นผู้ดูแลระบบ</h3>';

      users.forEach(user => {
        const div = document.createElement('div');
        div.innerHTML = `
          <p>👤 ${user.username} (${user.email})</p>
          <button onclick="approveAdmin('${user._id}')">✅ อนุมัติ</button>
          <button onclick="rejectAdmin('${user._id}')">❌ ปฏิเสธ</button>
          <hr>
        `;
        container.appendChild(div);
      });
    });
}

function approveAdmin(userId) {
  fetch(`http://localhost:3000/admin/approve/${userId}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAdminRequests();
    });
}

function rejectAdmin(userId) {
  fetch(`http://localhost:3000/admin/reject/${userId}`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAdminRequests();
    });
}



// ✅ รายงานโพสต์
function reportPost(postId) {
  const userId = localStorage.getItem('userId');
  const reason = prompt('กรุณาระบุเหตุผลที่รายงานโพสต์นี้:');
  if (!reason) return;

  fetch('http://localhost:3000/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId, userId, reason })
  })
  .then(res => res.json())
  .then(data => alert(data.message))
  .catch(err => alert('❌ ไม่สามารถส่งรายงานได้'));
}

function loadAdminReports() {
  fetch('http://localhost:3000/admin/reports')
    .then(res => res.json())
    .then(reports => {
      const container = document.getElementById('adminReports');
      container.innerHTML = '<h3>🚩 รายงานโพสต์</h3>';

      reports.forEach(report => {
        const div = document.createElement('div');
        div.innerHTML = `
          <p><strong>โพสต์:</strong> ${report.post?.title || 'ไม่พบโพสต์'}</p>
          <p><strong>เหตุผล:</strong> ${report.reason}</p>
          <p><strong>ผู้รายงาน:</strong> ${report.reporter?.username || 'ไม่ทราบชื่อ'}</p>
          <button onclick="approveReport('${report._id}', '${report.post?._id}')">✅ ลบโพสต์</button>
          <button onclick="rejectReport('${report._id}')">❌ ละเว้น</button>
          <hr>
        `;
        container.appendChild(div);
      });
    })
    .catch(err => {
      console.error('❌ Failed to load reports:', err);
    });
}

function approveReport(reportId, postId) {
  fetch(`http://localhost:3000/admin/reports/${reportId}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postId })
  })
  .then(res => res.json())
  .then(data => {
    alert(data.message);
    loadAdminReports();
  });
}

function rejectReport(reportId) {
  fetch(`http://localhost:3000/admin/reports/${reportId}/reject`, { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      alert(data.message);
      loadAdminReports();
    });
}

function startEditComment(commentId, oldText, postId) {
  const commentDiv = document.getElementById(`comment-${commentId}`);
  commentDiv.innerHTML = `
    <input type="text" id="editInput-${commentId}" value="${oldText}">
    <button onclick="submitEditComment('${commentId}', '${postId}')">💾 Save</button>
    <button onclick="loadComments('${postId}')">❌ Cancel</button>
  `;
}

function submitEditComment(commentId, postId) {
  const newText = document.getElementById(`editInput-${commentId}`).value;

  fetch(`http://localhost:3000/comments/${commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: newText })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to update comment');
    return res.json();
  })
  .then(() => loadComments(postId))
  .catch(err => {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการแก้ไข');
  });
}

function deleteComment(commentId, postId) {
  if (!confirm('คุณแน่ใจว่าต้องการลบคอมเมนต์นี้หรือไม่?')) return;
  console.log('Deleting comment:', commentId); // ✅ เพิ่ม log

  fetch(`http://localhost:3000/comments/${commentId}`, {
    method: 'DELETE'
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to delete comment');
    return res.json();
  })
  .then(() => loadComments(postId))
  .catch(err => {
    console.error(err);
    alert('เกิดข้อผิดพลาดในการลบคอมเมนต์');
  });
}
// ✅ แก้ไขโพสต์
function startEditPost(postId, oldTitle, oldContent, oldCategory) {
  console.log('🔧 Starting edit for post:', postId); // ✅ เพิ่ม debug
  const postDiv = document.getElementById(`post-${postId}`);
  if (!postDiv) {
    console.error('❌ ไม่พบ element สำหรับโพสต์:', postId);
    alert('❌ ไม่สามารถแก้ไขโพสต์ได้ กรุณาลองใหม่');
    return;
  }

  console.log('✅ Found post element, setting edit mode'); // ✅ เพิ่ม debug
  postDiv.innerHTML = `
    <input type="text" id="editTitle-${postId}" value="${oldTitle}"><br>
    <textarea id="editContent-${postId}">${oldContent}</textarea><br>
    <select id="editCategory-${postId}">
      <option value="ข่าวสาร" ${oldCategory === 'ข่าวสาร' ? 'selected' : ''}>ข่าวสาร</option>
      <option value="รีวิว" ${oldCategory === 'รีวิว' ? 'selected' : ''}>รีวิว</option>
      <option value="ถามตอบ" ${oldCategory === 'ถามตอบ' ? 'selected' : ''}>ถามตอบ</option>
      <option value="อื่นๆ" ${oldCategory === 'อื่นๆ' ? 'selected' : ''}>อื่นๆ</option>
    </select><br>
    <button onclick="submitEditPost('${postId}')">💾 Save</button>
    <button onclick="loadPosts()">❌ Cancel</button>
  `;
}
//ยืนยันการแก้ไขโพสต์
function submitEditPost(postId) {
  const title = document.getElementById(`editTitle-${postId}`).value;
  const content = document.getElementById(`editContent-${postId}`).value;
  const category = document.getElementById(`editCategory-${postId}`).value;

  fetch(`http://localhost:3000/posts/${postId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, content, category })
  })
  .then(res => {
    if (!res.ok) throw new Error('Failed to update post');
    return res.json();
  })
  .then(() => loadPosts())
  .catch(err => {
    console.error(err);
    alert('❌ เกิดข้อผิดพลาดในการแก้ไขโพสต์');
  });
}
// โหลดโพสต์ใหม่ทั้งหมดเพื่อแก้ปัญหาการแสดงผลหาไม่เจอ
function loadPosts() {
  fetch('http://localhost:3000/posts')
    .then(res => res.json())
    .then(posts => {
      const container = document.getElementById('postsContainer');
      container.innerHTML = ''; // ✅ เคลียร์ก่อนโหลดใหม่

      posts.forEach(post => {
        allPosts = posts; // ✅ เก็บไว้ใช้กรอง
      renderPosts(posts); // ✅ แสดงทั้งหมดตอนแรก
        const div = document.createElement('div');
        div.id = `post-${post._id}`; // ✅ เพื่อให้แก้ไขได้

        const userId = localStorage.getItem('userId');
        const role = localStorage.getItem('role');

        div.innerHTML = `
          <h3>${post.title}</h3>
          <p>${post.content}</p>
          <p><strong>โพสต์โดย:</strong> ${post.author?.username || 'ไม่ทราบชื่อ'}</p>
          <p><span class="category-tag">📂 ${post.category}</span></p>
          <button onclick="likePost('${post._id}')">👍 Like</button>
          <span id="likes-${post._id}">👍 ${post.likes?.length || 0}</span>
          <input type="text" id="comment-${post._id}" placeholder="Add comment">
          <button onclick="commentPost('${post._id}')">💬 Comment</button>
          <br>
          <button onclick="toggleComments('${post._id}')" id="toggle-${post._id}">💬 Comments (...)</button>
          <div id="comments-${post._id}" style="display: none;"></div>
          <button onclick="reportPost('${post._id}')">🚩 รายงานโพสต์</button>
          ${post.author?._id === userId || role === 'admin' ? `
            <button onclick="deletePost('${post._id}')">🗑️ Delete</button>
            <button onclick="startEditPost('${post._id}', '${post.title}', '${post.content}', '${post.category}')">✏️ Edit</button>
          ` : ''}
          <hr>
        `;
        container.appendChild(div);
        loadComments(post._id);
      });
    });
}

let allPosts = []; // ✅ เก็บโพสต์ทั้งหมดไว้



function renderPosts(posts) {
  const container = document.getElementById('postsContainer');
  container.innerHTML = '';

  const userId = localStorage.getItem('userId');
  const role = localStorage.getItem('role');

  posts.forEach(post => {
    const div = document.createElement('div');
    div.className = 'post'; // ✅ ใส่ class เพื่อให้ style กลับมา
    div.id = `post-${post._id}`; // ✅ เพิ่มบรรทัดนี้เพื่อให้แก้ไขโพสต์ได้

    div.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.content}</p>
      <p><strong>โพสต์โดย:</strong> ${post.author?.username || 'ไม่ทราบชื่อ'}</p>
      <p><span class="category-tag">📂 ${post.category}</span></p>
      <button onclick="likePost('${post._id}')">👍 Like</button>
      <span id="likes-${post._id}">👍 ${post.likes?.length || 0}</span>
      <input type="text" id="comment-${post._id}" placeholder="Add comment">
      <button onclick="commentPost('${post._id}')">💬 Comment</button>
      <br>
      <button onclick="toggleComments('${post._id}')" id="toggle-${post._id}">💬 Comments (...)</button>
      <div id="comments-${post._id}" style="display: none;"></div>
      <button onclick="reportPost('${post._id}')">🚩 รายงานโพสต์</button>
      ${post.author?._id === userId || role === 'admin' ? `
        <button onclick="deletePost('${post._id}')">🗑️ Delete</button>
        <button onclick="startEditPost('${post._id}', \`${post.title.replace(/'/g, "&apos;")}\`, \`${post.content.replace(/'/g, "&apos;")}\`, '${post.category}')">✏️ Edit</button>
      ` : ''}
      <hr>
    `;
    container.appendChild(div);
    loadComments(post._id); // ✅ โหลดคอมเมนต์ของแต่ละโพสต์
  });
}
// ✅ จัดการ Admin Toggle Button (ย้ายมาไว้ตำแหน่งที่ถูกต้อง)
const role = localStorage.getItem('role');
if (role === 'admin') {
  document.getElementById('adminToggleBtn').style.display = 'block';
} else {
  document.getElementById('adminToggleBtn').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
  loadPosts(); // ✅ โหลดทั้งหมดตอนเริ่ม

  // ✅ ตั้งค่า admin toggle button
  const adminBtn = document.getElementById('adminToggleBtn');
  if (adminBtn) {
    adminBtn.addEventListener('click', () => {
      const popup = document.getElementById('adminPopup');
      const isVisible = popup.style.display === 'block';
      popup.style.display = isVisible ? 'none' : 'block';

      if (!isVisible) {
        loadAdminRequests(); // ✅ โหลดคำขอ admin
        loadAdminReports();  // ✅ โหลดรายงานโพสต์
      }
    });
  }

  document.getElementById('categoryFilter').addEventListener('change', e => {
    const selected = e.target.value;
    if (selected) {
      const filtered = allPosts.filter(post => post.category === selected);
      renderPosts(filtered);
    } else {
      renderPosts(allPosts); // ✅ ถ้าเลือก "-- แสดงทั้งหมด --"
    }
  });
});