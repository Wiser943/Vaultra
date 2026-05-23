/* ── VAULTRA API Client ──────────────────────────────────────
   Single file handling all frontend ↔ backend communication
   ────────────────────────────────────────────────────────── */

const API = {

  // ── Base request helper ────────────────────────────────────
  async request(method, endpoint, data) {
    const opts = {
      method,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' }
    };
    if (data) opts.body = JSON.stringify(data);

    const res  = await fetch('/api' + endpoint, opts);
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Request failed');
    return json;
  },

  get:    (ep)       => API.request('GET',    ep),
  post:   (ep, data) => API.request('POST',   ep, data),
  delete: (ep)       => API.request('DELETE', ep),

  // ── Auth ───────────────────────────────────────────────────
  auth: {
    signup: (data)  => API.post('/auth/signup',  data),
    signin: (data)  => API.post('/auth/signin',  data),
    signout:()      => API.post('/auth/signout'),
    me:     ()      => API.get('/auth/me'),
  },

  // ── Payments ───────────────────────────────────────────────
  payments: {
    initiate: (plan)      => API.post('/payments/initiate', { plan }),
    verify:   (reference) => API.get(`/payments/verify/${reference}`),
  },

  // ── User ───────────────────────────────────────────────────
  user: {
    dashboard:   ()     => API.get('/user/dashboard'),
    addBank:     (data) => API.post('/user/bank', data),
    withdraw:    (data) => API.post('/user/withdraw', data),
    withdrawals: ()     => API.get('/user/withdrawals'),
  }
};

// ── Auth Guard — redirect if not logged in ──────────────────
async function requireAuth(redirectTo = '/signin.html') {
  try {
    const { user } = await API.auth.me();
    return user;
  } catch {
    window.location.href = redirectTo;
    return null;
  }
}

// ── Redirect if already logged in ───────────────────────────
async function redirectIfLoggedIn(to = '/dashboard.html') {
  try {
    await API.auth.me();
    window.location.href = to;
  } catch {
    // Not logged in — stay on page
  }
}

window.API            = API;
window.requireAuth    = requireAuth;
window.redirectIfLoggedIn = redirectIfLoggedIn;
