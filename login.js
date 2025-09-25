// login.js
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('username', username);
      localStorage.setItem('userId', data.userId); // ✅ ต้องมี
      

      window.location.href = 'posts.html';
    } else {
      document.getElementById('result').textContent = data.error;
    }
  } catch (err) {
    document.getElementById('result').textContent = '❌ Network error';
  }
});