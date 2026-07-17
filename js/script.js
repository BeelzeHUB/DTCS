/* ===========================================
   HIMS - Global Script (login page + shared UI)
   =========================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Toggle password visibility ---------- */
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput  = document.getElementById('password');

  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function () {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';

      const icon = togglePassword.querySelector('i');
      icon.classList.toggle('bi-eye');
      icon.classList.toggle('bi-eye-slash');
    });
  }

  /* ---------- Login form submit ---------- */
  const loginForm = document.getElementById('loginForm');

  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();

      if (!username || !password) {
        loginForm.classList.add('was-validated');
        return;
      }

      // TODO: replace with real POST to Laravel backend, e.g.:
      // fetch('/login', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content
      //   },
      //   body: JSON.stringify({ email: username, password: password,
      //                          remember: document.getElementById('rememberPassword').checked })
      // })
      // .then(res => res.json())
      // .then(data => {
      //   if (data.success) window.location.href = 'pages/dashboard.html';
      //   else showLoginError(data.message);
      // });

      console.log('Login submitted:', { username, remember: document.getElementById('rememberPassword').checked });

      // Placeholder redirect for front-end preview only
      window.location.href = 'pages/dashboard.html';
    });
  }

});