document.getElementById('userDisplay').textContent = localStorage.getItem('username');

// 🔹 โหลดโพสต์ทั้งหมด
fetch('http://localhost:3000/posts')
  .then(res => res.json())
  .then(posts => {
    const container = document.getElementById('postsContainer');
    posts.forEach(post => {
      const div = document.createElement('div');
      const userId = localStorage.getItem('userId'); // ✅ เพิ่มตรงนี้
      div.innerHTML = `
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <p><strong>โพสต์โดย:</strong> ${post.author?.username || 'ไม่ทราบชื่อ'}</p> <!-- ✅ เพิ่มตรงนี้ -->
        <button onclick="likePost('${post._id}')">👍 Like</button>
       <span id="likes-${post._id}">👍 ${post.likes?.length || 0}</span>
        <input type="text" id="comment-${post._id}" placeholder="Add comment">
        <button onclick="commentPost('${post._id}')">💬 Comment</button> <!-- ✅ เพิ่มตรงนี้ -->
        
        <div>
         <button onclick="toggleComments('${post._id}')" id="toggle-${post._id}">💬 Comments (...)</button>
        <div id="comments-${post._id}" style="display: none;"></div>
        ${post.author?._id === userId ? `<button onclick="deletePost('${post._id}')">🗑️ Delete</button>` : ''}
        </div>
        <hr>
      `;
      container.appendChild(div);
      loadComments(post._id); // ✅ โหลดคอมเมนต์ของแต่ละโพสต์
    });
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
  localStorage.clear();
  window.location.href = 'login.html';
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
  fetch(`http://localhost:3000/comments/${postId}`)
    .then(res => res.json())
    .then(comments => {
      const container = document.getElementById(`comments-${postId}`);
      container.innerHTML = comments.map(c => `
      <p>💬 <strong>${c.author?.username || 'ไม่ทราบชื่อ'}:</strong> ${c.content}</p>
      `).join('');

      // ✅ อัปเดตจำนวนคอมเมนต์บนปุ่ม
     const toggleBtn = document.getElementById(`toggle-${postId}`);
if (toggleBtn) {
  toggleBtn.textContent = `💬 Commentator  (${comments.length})`;
}
    });
}
// ✅ สร้างโพสต์ใหม่
document.getElementById('postForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('postTitle').value;
  const content = document.getElementById('postContent').value;
  const userId = localStorage.getItem('userId');

  if (!userId) {
    alert('❌ กรุณา login ก่อนโพสต์');
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, userId })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      document.getElementById('postTitle').value = '';
      document.getElementById('postContent').value = '';
      location.reload(); // ✅ โหลดใหม่เพื่อแสดงโพสต์ล่าสุด
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

