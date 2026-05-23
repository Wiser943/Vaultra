/* ── VAULTRA Auth Pages JS ───────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {

  // Redirect already-logged-in users away from auth pages
  await redirectIfLoggedIn('/dashboard.html');

  // ── Sign Up Form ─────────────────────────────────────────
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const fullName       = document.getElementById('fullName')?.value.trim();
      const email          = document.getElementById('email')?.value.trim();
      const phone          = document.getElementById('phone')?.value.trim();
      const niche          = document.getElementById('niche')?.value;
      const password       = document.getElementById('password')?.value;
      const confirmPassword = document.getElementById('confirmPassword')?.value;

      // Validate
      let valid = true;
      if (!fullName)  { showError('fullNameErr', 'Please enter your full name'); valid = false; }
      if (!email)     { showError('emailErr', 'Please enter your email'); valid = false; }
      if (!niche)     { showError('nicheErr', 'Please select your niche'); valid = false; }
      if (!password || password.length < 8) { showError('passwordErr', 'Minimum 8 characters'); valid = false; }
      if (password !== confirmPassword) { showError('confirmErr', 'Passwords do not match'); valid = false; }
      if (!valid) return;

      const btn     = document.getElementById('signupBtn');
      const btnText = document.getElementById('signupBtnText');
      setLoading(btn, btnText, 'Creating account...');

      try {
        // Get referral code from URL
        const urlParams    = new URLSearchParams(window.location.search);
        const referralCode = urlParams.get('ref') || '';

        await API.auth.signup({ fullName, email, phone, niche, password, referralCode });

        showAlert('signupSuccess', '🎉 Account created! Redirecting to your dashboard...');
        setTimeout(() => window.location.href = '/dashboard.html', 1500);

      } catch (err) {
        showAlert('signupError', err.message, 'error');
        setLoading(btn, btnText, 'Create Your VAULTRA Account ✦', false);
      }
    });
  }

  // ── Sign In Form ─────────────────────────────────────────
  const signinForm = document.getElementById('signinForm');
  if (signinForm) {
    signinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearErrors();

      const email    = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      if (!email)    { showError('emailErr', 'Please enter your email'); return; }
      if (!password) { showError('passwordErr', 'Please enter your password'); return; }

      const btn     = document.getElementById('signinBtn');
      const btnText = document.getElementById('signinBtnText');
      setLoading(btn, btnText, 'Signing in...');

      try {
        await API.auth.signin({ email, password });
        window.location.href = '/dashboard.html';
      } catch (err) {
        const errDiv = document.getElementById('signinError');
        if (errDiv) { errDiv.textContent = err.message; errDiv.style.display = 'block'; }
        setLoading(btn, btnText, 'Sign In to Dashboard ✦', false);
      }
    });
  }

});

// ── Helpers ──────────────────────────────────────────────────
function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function clearErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.style.display = 'none');
  ['signupError','signinError','signupSuccess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
}
function showAlert(id, msg, type = 'success') {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.style.display = 'block'; }
}
function setLoading(btn, textEl, text, loading = true) {
  if (btn)    btn.disabled = loading;
  if (textEl) textEl.textContent = loading ? text : text;
}
