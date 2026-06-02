// ===== STATE =====
let adminToken = localStorage.getItem('adminToken');
let currentPage = 'dashboard';
let currentUserPage = 1;
let currentPaymentPage = 1;
let currentWithdrawalPage = 1;
let currentWithdrawalId = null;

const API_URL = 'http://localhost:3000/api';

// ===== UTILITY FUNCTIONS =====
function showAdminToast(message, type = 'success') {
  const toast = document.getElementById('adminToast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function showAdminPage(page) {
  document.querySelectorAll('.content-section').forEach(el => {
    el.classList.remove('active');
  });
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.remove('active');
  });

  const contentEl = document.getElementById(`${page}-content`);
  if (contentEl) {
    contentEl.classList.add('active');
  }

  document.querySelector(`[onclick="showAdminPage('${page}')"]`)?.classList.add('active');

  currentPage = page;

  if (page === 'dashboard') {
    loadDashboard();
  } else if (page === 'users') {
    loadUsers(1);
  } else if (page === 'payments') {
    loadPayments(1);
  } else if (page === 'withdrawals') {
    loadWithdrawals(1);
  }
}

async function adminApiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (adminToken) {
    options.headers.Authorization = `Bearer ${adminToken}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'API Error');
    }

    return result;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

function openModal(modalId) {
  document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
  document.getElementById(modalId).classList.remove('active');
}

// ===== AUTH =====
async function handleAdminLogin(e) {
  e.preventDefault();

  const email = document.getElementById('adminEmail').value;
  const password = document.getElementById('adminPassword').value;

  try {
    const result = await adminApiCall('/admin/login', 'POST', { email, password });

    adminToken = result.token;
    localStorage.setItem('adminToken', adminToken);

    document.getElementById('login-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');

    showAdminPage('dashboard');
    showAdminToast('Logged in successfully!');
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

function logoutAdmin() {
  adminToken = null;
  localStorage.removeItem('adminToken');
  document.getElementById('dashboard-page').classList.remove('active');
  document.getElementById('login-page').classList.add('active');
  document.getElementById('loginForm').reset();
  showAdminToast('Logged out');
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const result = await adminApiCall('/admin/dashboard');
    const analytics = result.analytics;

    // Update stats
    document.getElementById('totalUsers').textContent = analytics.totalUsers;
    document.getElementById('totalPayments').textContent = analytics.totalPayments;
    document.getElementById('totalRevenue').textContent = `₦${analytics.totalRevenue.toLocaleString()}`;
    document.getElementById('pendingWithdrawals').textContent = analytics.pendingWithdrawals;

    // Recent payments
    const paymentsBody = document.getElementById('paymentsTableBody');
    paymentsBody.innerHTML = analytics.recentPayments.map(p => `
      <tr>
        <td>${p.user}</td>
        <td>${p.plan}</td>
        <td>₦${p.amount.toLocaleString()}</td>
        <td><span class="status-badge ${p.status}">${p.status}</span></td>
        <td>${new Date(p.date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    // Top referrers
    const referrersEl = document.getElementById('topReferrers');
    referrersEl.innerHTML = analytics.topReferrers.map(r => `
      <div class="referrer-item">
        <div class="referrer-name">${r.name}</div>
        <div class="referrer-stats">
          <div class="referrer-stat">
            <span>Referrals</span>
            <span class="referrer-stat-value">${r.referrals}</span>
          </div>
          <div class="referrer-stat">
            <span>Earnings</span>
            <span class="referrer-stat-value">₦${r.earnings.toLocaleString()}</span>
          </div>
        </div>
      </div>
    `).join('');
  } catch (err) {
    showAdminToast('Failed to load dashboard', 'error');
  }
}

// ===== USERS =====
async function loadUsers(page) {
  try {
    const result = await adminApiCall(`/admin/users?page=${page}`);
    const users = result.users;
    const pagination = result.pagination;

    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = users.map(u => `
      <tr>
        <td>${u.fullName}</td>
        <td>${u.email}</td>
        <td>${u.planType || 'None'}</td>
        <td>€${u.balanceEUR.toFixed(2)}</td>
        <td>₦${u.balanceNaira.toLocaleString()}</td>
        <td>${new Date(u.createdAt).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-small btn-primary" onclick="viewUserDetails('${u._id}')">View</button>
        </td>
      </tr>
    `).join('');

    // Pagination
    const paginationEl = document.getElementById('usersPagination');
    paginationEl.innerHTML = '';
    for (let i = 1; i <= pagination.pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === page ? 'active' : '';
      btn.onclick = () => loadUsers(i);
      paginationEl.appendChild(btn);
    }

    currentUserPage = page;
  } catch (err) {
    showAdminToast('Failed to load users', 'error');
  }
}

async function viewUserDetails(userId) {
  try {
    const result = await adminApiCall(`/admin/users/${userId}`);
    const user = result.user;

    const detailsEl = document.getElementById('userDetails');
    detailsEl.innerHTML = `
      <div class="form-group">
        <label>Name</label>
        <input type="text" value="${user.fullName}" disabled>
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" value="${user.email}" disabled>
      </div>
      <div class="form-group">
        <label>EUR Balance</label>
        <input type="number" id="userEUR" value="${user.balanceEUR}" step="0.01">
      </div>
      <div class="form-group">
        <label>Naira Balance</label>
        <input type="number" id="userNaira" value="${user.balanceNaira}">
      </div>
      <div class="form-group">
        <label>Plan Status</label>
        <select id="userPlanStatus">
          <option value="false" ${!user.planActivated ? 'selected' : ''}>Not Activated</option>
          <option value="true" ${user.planActivated ? 'selected' : ''}>Activated</option>
        </select>
      </div>
      <div class="form-group">
        <label>Level 1 Referrals</label>
        <input type="number" value="${user.level1Referrals.length}" disabled>
      </div>
      <div class="form-group">
        <label>Level 2 Referrals</label>
        <input type="number" value="${user.level2Referrals.length}" disabled>
      </div>
      <button class="btn btn-primary" onclick="updateUser('${userId}')">Save Changes</button>
    `;

    openModal('userModal');
  } catch (err) {
    showAdminToast('Failed to load user details', 'error');
  }
}

async function updateUser(userId) {
  try {
    const balanceEUR = parseFloat(document.getElementById('userEUR').value);
    const balanceNaira = parseFloat(document.getElementById('userNaira').value);
    const planActivated = document.getElementById('userPlanStatus').value === 'true';

    await adminApiCall(`/admin/users/${userId}`, 'PUT', {
      balanceEUR,
      balanceNaira,
      planActivated,
    });

    showAdminToast('User updated successfully');
    closeModal('userModal');
    loadUsers(currentUserPage);
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

// ===== PAYMENTS =====
async function loadPayments(page) {
  try {
    const result = await adminApiCall(`/admin/payments?page=${page}`);
    const payments = result.payments;
    const pagination = result.pagination;

    const tbody = document.getElementById('paymentsTableBody2');
    tbody.innerHTML = payments.map(p => `
      <tr>
        <td>${p.user}</td>
        <td>${p.plan}</td>
        <td>₦${p.amount.toLocaleString()}</td>
        <td><span class="status-badge ${p.status}">${p.status}</span></td>
        <td>${p.reference}</td>
        <td>${new Date(p.date).toLocaleDateString()}</td>
      </tr>
    `).join('');

    // Pagination
    const paginationEl = document.getElementById('paymentsPagination');
    paginationEl.innerHTML = '';
    for (let i = 1; i <= pagination.pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === page ? 'active' : '';
      btn.onclick = () => loadPayments(i);
      paginationEl.appendChild(btn);
    }

    currentPaymentPage = page;
  } catch (err) {
    showAdminToast('Failed to load payments', 'error');
  }
}

// ===== WITHDRAWALS =====
async function loadWithdrawals(page) {
  try {
    const result = await adminApiCall(`/admin/withdrawals?page=${page}`);
    const withdrawals = result.withdrawals;
    const pagination = result.pagination;

    const tbody = document.getElementById('withdrawalsTableBody');
    tbody.innerHTML = withdrawals.map(w => `
      <tr>
        <td>€${w.amount.toFixed(2)}</td>
        <td>₦${w.amountNaira.toLocaleString()}</td>
        <td><span class="status-badge ${w.status}">${w.status}</span></td>
        <td>${w.bankName}</td>
        <td>${w.reference}</td>
        <td>${w.emailVerified ? '✓' : '✗'}</td>
        <td>${new Date(w.date).toLocaleDateString()}</td>
        <td>
          <button class="btn btn-small btn-primary" onclick="updateWithdrawalStatus('${w.id}', '${w.status}')">Update</button>
        </td>
      </tr>
    `).join('');

    // Pagination
    const paginationEl = document.getElementById('withdrawalsPagination');
    paginationEl.innerHTML = '';
    for (let i = 1; i <= pagination.pages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;
      btn.className = i === page ? 'active' : '';
      btn.onclick = () => loadWithdrawals(i);
      paginationEl.appendChild(btn);
    }

    currentWithdrawalPage = page;
  } catch (err) {
    showAdminToast('Failed to load withdrawals', 'error');
  }
}

function updateWithdrawalStatus(withdrawalId, currentStatus) {
  currentWithdrawalId = withdrawalId;
  document.getElementById('withdrawalStatus').value = currentStatus;
  openModal('withdrawalModal');
}

async function handleWithdrawalStatusUpdate(e) {
  e.preventDefault();

  const status = document.getElementById('withdrawalStatus').value;

  try {
    await adminApiCall(`/admin/withdrawals/${currentWithdrawalId}/status`, 'PUT', { status });

    showAdminToast('Withdrawal status updated');
    closeModal('withdrawalModal');
    loadWithdrawals(currentWithdrawalPage);
  } catch (err) {
    showAdminToast(err.message, 'error');
  }
}

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
  if (adminToken) {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('dashboard-page').classList.add('active');
    showAdminPage('dashboard');
  } else {
    document.getElementById('login-page').classList.add('active');
  }
});

// Form handling
document.getElementById('loginForm')?.addEventListener('submit', handleAdminLogin);
document.getElementById('withdrawalStatusForm')?.addEventListener('submit', handleWithdrawalStatusUpdate);
