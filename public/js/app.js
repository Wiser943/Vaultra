// ===== STATE MANAGEMENT =====
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let currentWithdrawalId = null;

// Change this to your production backend URL (e.g., https://your-backend.onrender.com/api)
const PROD_API_URL = 'https://vaultra-backend.onrender.com/api'; 

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : PROD_API_URL;

// ===== UTILITY FUNCTIONS =====
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type}`;
  toast.style.display = 'block';
  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

function showPage(pageName) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const page = document.getElementById(`${pageName}-page`);
  if (page) {
    page.classList.add('active');
    window.scrollTo(0, 0);
  }
}

async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken) {
    options.headers.Authorization = `Bearer ${authToken}`;
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

// ===== AUTH FUNCTIONS =====
async function handleSignup(e) {
  e.preventDefault();

  const fullName = document.getElementById('fullName').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const phone = document.getElementById('phone').value;
  const niche = document.getElementById('niche').value;
  const referralCode = document.getElementById('referralCode').value;

  try {
    const result = await apiCall('/auth/signup', 'POST', {
      fullName,
      email,
      password,
      phone,
      niche,
      referralCode: referralCode || undefined,
    });

    authToken = result.token;
    localStorage.setItem('authToken', authToken);
    currentUser = result.user;

    showToast('Account created! Redirecting to payment...');
    setTimeout(() => {
      showPage('payment');
    }, 1500);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleSignin(e) {
  e.preventDefault();

  const email = document.getElementById('signinEmail').value;
  const password = document.getElementById('signinPassword').value;

  try {
    const result = await apiCall('/auth/signin', 'POST', {
      email,
      password,
    });

    authToken = result.token;
    localStorage.setItem('authToken', authToken);
    currentUser = result.user;

    showToast('Signed in successfully!');
    if (currentUser.planActivated) {
      loadDashboard();
      showPage('dashboard');
    } else {
      showPage('payment');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('authToken');
  showToast('Logged out');
  showPage('home');
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const result = await apiCall('/dashboard/stats');
    const dashboard = result.dashboard;

    // Update wallet
    document.getElementById('balanceEUR').textContent = `€${dashboard.wallet.balanceEUR.toFixed(2)}`;
    document.getElementById('balanceNaira').textContent = `₦${dashboard.wallet.balanceNaira.toLocaleString()}`;

    // Update referrals
    document.getElementById('level1Count').textContent = dashboard.referrals.level1.count;
    document.getElementById('level1Earnings').textContent = `₦${dashboard.referrals.level1.earnings.toLocaleString()}`;
    document.getElementById('level2Count').textContent = dashboard.referrals.level2.count;
    document.getElementById('level2Earnings').textContent = `₦${dashboard.referrals.level2.earnings.toLocaleString()}`;

    // Referral link
    const referralLink = `${window.location.origin}?ref=${dashboard.user.referralCode}`;
    document.getElementById('referralLink').value = referralLink;

    // Task streams
    const streamsGrid = document.getElementById('streamsGrid');
    streamsGrid.innerHTML = '';
    dashboard.taskStreams.forEach(stream => {
      const streamEl = document.createElement('div');
      streamEl.className = `stream-item ${stream.unlocked ? '' : 'locked'}`;
      streamEl.innerHTML = `
        <div class="stream-icon">📺</div>
        <div class="stream-name">${stream.name}</div>
        <div class="stream-rate">${stream.rate}</div>
        <span class="stream-status ${stream.unlocked ? 'unlocked' : 'locked'}">
          ${stream.unlocked ? '✓ Unlocked' : '🔒 Locked'}
        </span>
      `;
      streamsGrid.appendChild(streamEl);
    });

    // Withdrawal history
    const historyEl = document.getElementById('withdrawalHistory');
    if (dashboard.recentWithdrawals.length > 0) {
      historyEl.innerHTML = dashboard.recentWithdrawals.map(w => `
        <div class="withdrawal-item">
          <div>
            <strong>€${w.amountEUR.toFixed(2)}</strong> (₦${w.amountNaira.toLocaleString()})
            <br/>
            <small>${w.reference} • ${new Date(w.createdAt).toLocaleDateString()}</small>
          </div>
          <span class="status">${w.status}</span>
        </div>
      `).join('');
    } else {
      historyEl.innerHTML = '<p style="color: var(--text-muted);">No withdrawals yet</p>';
    }

    // Bank accounts
    const bankSelect = document.getElementById('bankSelect');
    bankSelect.innerHTML = '<option value="">Select a bank account</option>';
    dashboard.user.bankAccounts.forEach((bank, idx) => {
      const option = document.createElement('option');
      option.value = idx;
      option.textContent = `${bank.bankName} - ${bank.accountNumber}`;
      bankSelect.appendChild(option);
    });

    // Bank list
    const bankList = document.getElementById('bankList');
    bankList.innerHTML = dashboard.user.bankAccounts.map((bank, idx) => `
      <div class="bank-item">
        <div class="bank-info">
          <h4>${bank.bankName}</h4>
          <p>${bank.accountNumber} • ${bank.accountName}</p>
        </div>
        ${bank.isPrimary ? '<span class="bank-badge">Primary</span>' : ''}
      </div>
    `).join('');
  } catch (err) {
    showToast('Failed to load dashboard', 'error');
  }
}

// ===== PAYMENT =====
async function selectPlan(plan) {
  try {
    const result = await apiCall('/payments/initiate', 'POST', { plan });
    
    if (result.checkoutUrl) {
      // Redirect to Korapay
      window.location.href = result.checkoutUrl;
    } else {
      showToast('Payment initialization failed', 'error');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== WITHDRAWAL =====
document.getElementById('withdrawAmount')?.addEventListener('input', (e) => {
  const amount = parseFloat(e.target.value);
  if (amount > 0) {
    const naira = Math.round(amount * 1600);
    document.getElementById('nairaAmount').textContent = `₦${naira.toLocaleString()}`;
    document.getElementById('conversionDisplay').style.display = 'block';
  } else {
    document.getElementById('conversionDisplay').style.display = 'none';
  }
});

async function handleWithdrawal(e) {
  e.preventDefault();

  const amountEUR = parseFloat(document.getElementById('withdrawAmount').value);

  try {
    const result = await apiCall('/withdrawals/initiate', 'POST', { amountEUR });
    currentWithdrawalId = result.withdrawalId;
    showToast('Verification code sent to your email');
    showPage('verification');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleVerification(e) {
  e.preventDefault();

  const code = document.getElementById('verificationCode').value;

  try {
    const result = await apiCall('/withdrawals/verify', 'POST', {
      withdrawalId: currentWithdrawalId,
      code,
    });

    showToast('Withdrawal verified! Processing in 24-48 hours');
    setTimeout(() => {
      loadDashboard();
      showPage('dashboard');
    }, 2000);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleAddBank(e) {
  e.preventDefault();

  const bankName = document.getElementById('bankName').value;
  const accountNumber = document.getElementById('accountNumber').value;
  const accountName = document.getElementById('accountName').value;
  const makePrimary = document.getElementById('makePrimary').checked;

  try {
    await apiCall('/withdrawals/add-bank', 'POST', {
      bankName,
      accountNumber,
      accountName,
      makePrimary,
    });

    showToast('Bank account added successfully');
    document.getElementById('bankForm').reset();
    loadDashboard();
    showPage('dashboard');
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ===== REFERRAL =====
function copyReferralLink() {
  const link = document.getElementById('referralLink').value;
  navigator.clipboard.writeText(link).then(() => {
    showToast('Referral link copied!');
  });
}

// ===== INITIALIZATION =====
window.addEventListener('DOMContentLoaded', () => {
  // Check if user is logged in
  if (authToken) {
    loadDashboard();
    showPage('dashboard');
  } else {
    showPage('home');
  }

  // Check for referral code in URL
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if (ref) {
    document.getElementById('referralCode').value = ref;
  }
});

// ===== FORM HANDLING =====
document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
document.getElementById('signinForm')?.addEventListener('submit', handleSignin);
document.getElementById('withdrawalForm')?.addEventListener('submit', handleWithdrawal);
document.getElementById('verificationForm')?.addEventListener('submit', handleVerification);
document.getElementById('bankForm')?.addEventListener('submit', handleAddBank);
