/* ── VAULTRA Dashboard JS ───────────────────────────────────
   Replaces inline script in dashboard.html.
   Connects all UI states to live backend API.
   ────────────────────────────────────────────────────────── */

let currentUser      = null;
let dashboardData    = null;
let activityFeedOn   = true;
let activityInterval = null;

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {

  // Auth guard — redirect if not logged in
  currentUser = await requireAuth('/signin.html');
  if (!currentUser) return;

  // Load dashboard data
  await loadDashboard();

  // UI init
  setCurrentDate();
  startActivityFeed();
  initFaq();
  checkPaymentReturn();

  // App banner after delay
  setTimeout(() => {
    const b = document.getElementById('appDownloadBanner');
    if (b) b.classList.add('show');
  }, 10000);
});

// ── Load Dashboard Data ───────────────────────────────────────
async function loadDashboard() {
  try {
    const res   = await API.user.dashboard();
    dashboardData = res.data;
    currentUser   = res.data.user;

    renderUserInfo();
    renderDashboardState(currentUser.status);
    renderWallet();

  } catch (err) {
    console.error('Dashboard load error:', err);
    // If 401, requireAuth will handle it
  }
}

// ── Render User Info ──────────────────────────────────────────
function renderUserInfo() {
  const u = currentUser;
  if (!u) return;

  // Name displays
  document.querySelectorAll('#userName').forEach(el => el.textContent = u.fullName?.split(' ')[0] || 'Creator');
  const profileName = document.getElementById('profileName');
  const profileEmail = document.getElementById('profileEmail');
  const profileInitials = document.getElementById('profileInitials');
  const profileFullName = document.getElementById('profileFullName');
  const profileEmailInfo = document.getElementById('profileEmailInfo');
  const profileJoined = document.getElementById('profileJoined');
  const profileStatus = document.getElementById('profileStatus');
  const referralCode = document.getElementById('referralCode');

  if (profileName)     profileName.textContent     = u.fullName;
  if (profileEmail)    profileEmail.textContent     = u.email;
  if (profileInitials) profileInitials.textContent  = (u.fullName || 'C')[0].toUpperCase();
  if (profileFullName) profileFullName.textContent  = u.fullName;
  if (profileEmailInfo) profileEmailInfo.textContent = u.email;
  if (profileJoined)   profileJoined.textContent    = new Date(u.createdAt).toLocaleDateString('en-NG', { year:'numeric', month:'long', day:'numeric' });
  if (profileStatus)   profileStatus.textContent    = u.status === 'verified' ? '✅ Active — ' + (u.plan || '').toUpperCase() : u.status === 'verification' ? '⏳ Awaiting Verification' : '🔒 Locked';
  if (referralCode)    referralCode.textContent     = u.referralCode;
}

// ── Render Wallet ─────────────────────────────────────────────
function renderWallet() {
  const w = currentUser?.wallet;
  if (!w) return;

  const fmt = (n) => '€' + (n || 0).toFixed(2);
  const fmtN = (n) => '₦' + (n || 0).toLocaleString();

  document.querySelectorAll('#totalEarnings, #totalEarningsPage').forEach(el => el && (el.textContent = fmt(w.totalEarned)));
  document.querySelectorAll('#walletBalance, #walletBalancePage').forEach(el => el && (el.textContent = fmt(w.balanceEur)));
  document.querySelectorAll('#todayEarnings').forEach(el => el && (el.textContent = fmt(0)));
  document.querySelectorAll('#referralEarnings').forEach(el => el && (el.textContent = fmtN(w.referralNaira)));
  document.querySelectorAll('#pendingAmountPage').forEach(el => el && (el.textContent = fmtN(w.vaultRewardNaira)));
  document.querySelectorAll('#approvedBalancePage').forEach(el => el && (el.textContent = fmt(w.balanceEur)));
}

// ── Render Dashboard State ────────────────────────────────────
function renderDashboardState(state) {
  const locked   = document.getElementById('lockedState');
  const pending  = document.getElementById('verificationState');
  const verified = document.getElementById('verifiedState');
  if (locked)   locked.style.display   = state === 'locked'       ? 'block' : 'none';
  if (pending)  pending.style.display  = state === 'verification' ? 'block' : 'none';
  if (verified) verified.style.display = state === 'verified'     ? 'block' : 'none';

  // Update verification amount label
  if (state === 'verification') {
    const el = document.getElementById('verificationAmountLabel');
    const plan = currentUser?.plan;
    if (el && plan) el.textContent = plan === 'sovereign' ? '₦15,000 confirmed' : '₦7,000 confirmed';
  }
}

// ── Check Payment Return ──────────────────────────────────────
// Called after Korapay redirects back with ?payment=success&reference=VLT-xxx
async function checkPaymentReturn() {
  const params    = new URLSearchParams(window.location.search);
  const payStatus = params.get('payment');
  const reference = params.get('reference');

  if (payStatus === 'success' && reference) {
    // Clean URL
    window.history.replaceState({}, '', '/dashboard.html');

    showNotification('info', 'Payment Received', 'Verifying your payment...');

    try {
      const res = await API.payments.verify(reference);
      if (res.status === 'success') {
        await loadDashboard();
        showNotification('success', 'Account Activated! 🎉', 'Welcome to VAULTRA! Your Vault Fee has been confirmed.');
      } else {
        showNotification('warning', 'Payment Processing', 'Your payment is being verified. This takes up to 24 hours.');
        renderDashboardState('verification');
      }
    } catch {
      showNotification('warning', 'Check Status', 'Payment received — awaiting verification. Contact support if needed.');
    }
  }
}

// ── Initiate Payment ─────────────────────────────────────────
async function initiatePayment(plan) {
  try {
    showNotification('info', 'Preparing Payment', 'Please wait...');

    const res = await API.payments.initiate(plan);

    if (res.checkoutUrl) {
      // Redirect to Korapay checkout
      window.location.href = res.checkoutUrl;
    } else {
      showNotification('error', 'Payment Error', 'Could not open payment page. Please try again.');
    }
  } catch (err) {
    showNotification('error', 'Payment Failed', err.message || 'Please try again.');
  }
}

// ── Open Payment Modal ────────────────────────────────────────
// Keep the modal UI but wire the button to real Korapay
function openPaymentModal(plan = 'sterling') {
  const modal = document.getElementById('paymentModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateModalPlanDisplay(plan);
  }
}
function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function updateModalPlanDisplay(plan) {
  const plans = {
    sterling: { amount: '₦7,000',  badge: 'STERLING PLAN · Entry Level' },
    sovereign:{ amount: '₦15,000', badge: 'SOVEREIGN PLAN · Elite Level' }
  };
  const p = plans[plan] || plans.sterling;
  const amountEl = document.getElementById('modalAmountDisplay');
  const badgeEl  = document.getElementById('modalPackageBadge');
  if (amountEl) amountEl.textContent = p.amount;
  if (badgeEl)  badgeEl.textContent  = p.badge;

  // Store selected plan for confirm button
  const confirmBtn = document.getElementById('confirmPayBtn');
  if (confirmBtn) confirmBtn.dataset.plan = plan;
}

// ── Confirm Payment — fires real Korapay ─────────────────────
async function confirmPaymentNew() {
  const btn  = document.getElementById('confirmPayBtn');
  const plan = btn?.dataset.plan || 'sterling';
  closePaymentModal();
  await initiatePayment(plan);
}

// ── Switch Plan in locked state ───────────────────────────────
let selectedPlan = 'sterling';
function switchLockedPackage(plan) {
  selectedPlan = plan;
  const plans = {
    sterling: { label: '⚡ Sterling Plan', amount: '₦7,000' },
    sovereign:{ label: '👑 Sovereign Plan', amount: '₦15,000' }
  };
  const p = plans[plan];
  const nameEl   = document.getElementById('lockedPackageName');
  const amountEl = document.getElementById('lockedPackageAmount');
  if (nameEl)   nameEl.textContent   = p.label;
  if (amountEl) amountEl.innerHTML   = p.amount + ' <span>One-time Vault Fee</span>';

  // Button styles
  ['sterling','sovereign'].forEach(pp => {
    const btn = document.getElementById('switch' + pp.charAt(0).toUpperCase() + pp.slice(1) + 'Btn');
    if (btn) {
      btn.style.borderColor = pp === plan ? 'rgba(201,168,76,0.7)' : 'rgba(201,168,76,0.2)';
      btn.style.background  = pp === plan ? 'rgba(201,168,76,0.18)' : 'rgba(201,168,76,0.06)';
    }
  });
}

function openPaymentModalWithPlan() {
  openPaymentModal(selectedPlan);
}

// ── Withdraw Modal ────────────────────────────────────────────
function openWithdrawModal() {
  const modal = document.getElementById('withdrawModal');
  if (modal) {
    // Populate balance
    const balEl = document.getElementById('modalBalance');
    if (balEl) balEl.textContent = '€' + (currentUser?.wallet?.balanceEur || 0).toFixed(2);
    // Populate bank accounts
    populateBankDropdown();
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}
function closeWithdrawModal() {
  const modal = document.getElementById('withdrawModal');
  if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function populateBankDropdown() {
  const sel = document.getElementById('bankAccount');
  if (!sel) return;
  sel.innerHTML = '<option value="">Select bank account</option>';
  (currentUser?.bankAccounts || []).forEach(bank => {
    const opt = document.createElement('option');
    opt.value       = bank._id;
    opt.textContent = `${bank.bankName} — ${bank.accountNumber} (${bank.accountName})`;
    sel.appendChild(opt);
  });
}

async function submitWithdrawal(e) {
  e.preventDefault();
  const amountEur     = parseFloat(document.getElementById('withdrawAmount')?.value);
  const bankAccountId = document.getElementById('bankAccount')?.value;

  if (!bankAccountId) {
    showNotification('error', 'No Bank Account', 'Please add a bank account first.');
    return;
  }

  try {
    const res = await API.user.withdraw({ amountEur, bankAccountId });
    showNotification('success', 'Withdrawal Submitted', res.message);
    closeWithdrawModal();
    await loadDashboard();
  } catch (err) {
    showNotification('error', 'Withdrawal Failed', err.message);
  }
}

function setAmount(val) { const i = document.getElementById('withdrawAmount'); if (i) i.value = val; }
function setAmountMax() { setAmount(currentUser?.wallet?.balanceEur || 0); }

// ── Add Bank Modal ────────────────────────────────────────────
function openAddBankModal() {
  const modal = document.getElementById('addBankModal');
  if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeAddBankModal() {
  const modal = document.getElementById('addBankModal');
  if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

async function submitBankAccount(e) {
  e.preventDefault();
  const bankName      = document.getElementById('bankName')?.value;
  const accountNumber = document.getElementById('accountNumber')?.value;
  const accountName   = document.getElementById('accountName')?.value || accountNumber;

  try {
    await API.user.addBank({ bankName, accountNumber, accountName: accountName || 'Account Holder', makePrimary: true });
    showNotification('success', 'Bank Added', 'Your bank account has been saved.');
    closeAddBankModal();
    await loadDashboard();
  } catch (err) {
    showNotification('error', 'Error', err.message);
  }
}

// ── Referral Copy ─────────────────────────────────────────────
function copyReferralCode() {
  const link = `${window.location.origin}/signup.html?ref=${currentUser?.referralCode}`;
  navigator.clipboard.writeText(link).then(() => {
    showNotification('success', 'Link Copied!', 'Share it to earn Vault Associate Commission.');
  });
}

// ── Page Switching ────────────────────────────────────────────
function switchPage(page) {
  document.querySelectorAll('.page-content').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(n => n.classList.remove('active'));

  const pageMap = { home:'homePage', gigs:'gigsPage', earnings:'earningsPage', wallet:'walletPage', support:'supportPage', profile:'profilePage' };
  const el = document.getElementById(pageMap[page]);
  if (el) el.classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));

  if (page === 'wallet') loadWithdrawals();
  window.scrollTo({ top:0, behavior:'smooth' });
  closeSidebar();
}

async function loadWithdrawals() {
  try {
    const res = await API.user.withdrawals();
    // Render withdrawal history if element exists
    const container = document.querySelector('#walletPage .activity-card');
    if (container && res.withdrawals.length > 0) {
      container.innerHTML = res.withdrawals.map(w => `
        <div style="display:flex;justify-content:space-between;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
          <div>
            <div style="font-weight:600;font-size:14px;">€${w.amountEur} → ₦${(w.amountNaira||0).toLocaleString()}</div>
            <div style="font-size:12px;color:#8A9BB0;">${w.bankName} · ${w.accountNumber}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:12px;color:${w.status==='completed'?'#22c55e':w.status==='pending'?'#f59e0b':'#8A9BB0'}">${w.status.toUpperCase()}</div>
            <div style="font-size:11px;color:#5A6A7E;">${new Date(w.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('');
    }
  } catch {}
}

// ── Feature Access Gate ───────────────────────────────────────
function checkFeatureAccess(name) {
  if (currentUser?.status === 'verified') {
    showNotification('info', name, `Opening your ${name} channel...`);
  } else if (currentUser?.status === 'verification') {
    showNotification('info', 'Awaiting Verification', 'Your payment is being confirmed. Usually 1–24 hours.');
  } else {
    openPaymentModal(selectedPlan);
  }
}

// ── Sidebar ───────────────────────────────────────────────────
function toggleSidebar() {
  const s = document.getElementById('sidebar');
  const o = document.getElementById('sidebarOverlay');
  const h = document.getElementById('hamburgerBtn');
  s?.classList.toggle('mobile-open');
  o?.classList.toggle('active');
  h?.classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar')?.classList.remove('mobile-open');
  document.getElementById('sidebarOverlay')?.classList.remove('active');
  document.getElementById('hamburgerBtn')?.classList.remove('open');
}

// ── Logout ────────────────────────────────────────────────────
async function logout() {
  if (confirm('Sign out of VAULTRA?')) {
    await API.auth.signout();
    window.location.href = '/index.html';
  }
}

// ── Go Back Modal ─────────────────────────────────────────────
function showGoBackModal() { document.getElementById('goBackModal')?.classList.add('active'); }
function closeGoBackModal() { document.getElementById('goBackModal')?.classList.remove('active'); }
function confirmGoBack() { closeGoBackModal(); renderDashboardState('locked'); }
function openTelegramVerify() {
  window.open('https://t.me/VAULTRA_SUPPORT', '_blank');
}

// ── Activity Feed ─────────────────────────────────────────────
const ACTIVITY = [
  { type:'earning',    emoji:'💰', msgs:['<strong>Amaka O.</strong> earned €2 on Vault Lifestyle','<strong>Tunde M.</strong> completed 1hr on Vault Realtime','<strong>Ngozi F.</strong> submitted a Vault Script2Cash'], locs:['Lagos','Abuja','Port Harcourt','Ibadan','Kano'] },
  { type:'withdrawal', emoji:'🏦', msgs:['<strong>Emeka K.</strong> withdrew €20 to GTBank','<strong>Fatima A.</strong> withdrew €50 to Kuda','<strong>Blessing B.</strong> withdrew €15 to OPay'], locs:['Enugu','Calabar','Jos','Owerri'] },
  { type:'signup',     emoji:'🎉', msgs:['<strong>Chidi N.</strong> just joined VAULTRA','<strong>Adaeze P.</strong> activated Sterling Plan','<strong>Victor I.</strong> unlocked Sovereign Plan'], locs:['Benin','Warri','Asaba','Abeokuta'] }
];
function startActivityFeed() {
  const container = document.getElementById('activity-feed-container');
  if (!container) return;
  clearInterval(activityInterval);

  const showToast = () => {
    if (!activityFeedOn) return;
    const g    = ACTIVITY[Math.floor(Math.random() * ACTIVITY.length)];
    const msg  = g.msgs[Math.floor(Math.random() * g.msgs.length)];
    const loc  = g.locs[Math.floor(Math.random() * g.locs.length)];
    const mins = Math.floor(Math.random() * 4) + 1;

    const toast = document.createElement('div');
    toast.className = 'activity-toast';
    toast.innerHTML = `
      <div class="toast-avatar ${g.type}">${g.emoji}</div>
      <div class="toast-body">
        <div class="toast-message">${msg}</div>
        <div class="toast-meta"><span class="toast-time">${mins}m ago</span><span class="toast-dot"></span><span class="toast-location">📍 ${loc}</span></div>
      </div>
      <button class="toast-close" onclick="this.closest('.activity-toast').remove()">✕</button>
    `;
    container.prepend(toast);
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('toast-show')));
    setTimeout(() => { toast.classList.add('toast-hide'); setTimeout(() => toast.remove(), 400); }, 5500);
    if (container.querySelectorAll('.activity-toast').length > 3) {
      container.lastElementChild?.remove();
    }
  };

  setTimeout(showToast, 4000);
  activityInterval = setInterval(showToast, 9000);
}

function toggleActivityFeed(enabled) {
  activityFeedOn = enabled;
  if (!enabled) clearInterval(activityInterval);
  else startActivityFeed();
}

// ── Notification ──────────────────────────────────────────────
function showNotification(type, title, message) {
  const existing = document.getElementById('vaultraNotif');
  if (existing) existing.remove();

  const c = {
    success: { bg:'rgba(34,197,94,0.12)', border:'rgba(34,197,94,0.3)', icon:'✓', color:'#22c55e' },
    error:   { bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.3)', icon:'✕', color:'#ef4444' },
    info:    { bg:'rgba(59,130,246,0.12)',border:'rgba(59,130,246,0.3)',icon:'ℹ', color:'#3b82f6' },
    warning: { bg:'rgba(245,158,11,0.12)',border:'rgba(245,158,11,0.3)',icon:'⚠', color:'#f59e0b' }
  }[type] || { bg:'rgba(59,130,246,0.12)',border:'rgba(59,130,246,0.3)',icon:'ℹ',color:'#3b82f6' };

  const el = document.createElement('div');
  el.id = 'vaultraNotif';
  el.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;
    background:linear-gradient(135deg,rgba(5,8,20,0.98),rgba(12,22,45,0.99));
    border:1px solid ${c.border};border-left:3px solid ${c.color};
    border-radius:14px;padding:14px 16px;min-width:280px;max-width:340px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);display:flex;align-items:flex-start;gap:12px;
    animation:slideInRight 0.4s cubic-bezier(0.34,1.56,0.64,1);font-family:'Inter',sans-serif;`;
  el.innerHTML = `
    <div style="width:32px;height:32px;border-radius:50%;background:${c.bg};border:1px solid ${c.border};
      display:flex;align-items:center;justify-content:center;flex-shrink:0;color:${c.color};font-size:14px;font-weight:700;">${c.icon}</div>
    <div style="flex:1;min-width:0;">
      <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.95);margin-bottom:3px;">${title}</div>
      <div style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;">${message}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:16px;padding:0;flex-shrink:0;">✕</button>
  `;
  document.body.appendChild(el);
  setTimeout(() => { el.style.animation='slideOutRight 0.35s ease forwards'; setTimeout(()=>el.remove(),350); }, 4500);
}

// ── Utils ─────────────────────────────────────────────────────
function setCurrentDate() {
  const el = document.getElementById('currentDate');
  if (el) el.textContent = new Date().toLocaleDateString('en-NG', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
}
function initFaq() {
  document.querySelectorAll('.faq-answer').forEach(a => {
    a.style.maxHeight = '0'; a.style.overflow = 'hidden'; a.style.transition = 'max-height 0.35s ease';
  });
}
function toggleFaq(el) {
  const ans = el.querySelector('.faq-answer');
  const isOpen = el.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    const a = i.querySelector('.faq-answer');
    if (a) a.style.maxHeight = null;
  });
  if (!isOpen && ans) { el.classList.add('open'); ans.style.maxHeight = ans.scrollHeight + 'px'; }
}
function closeAppBanner() {
  const b = document.getElementById('appDownloadBanner');
  if (b) { b.classList.remove('show'); setTimeout(() => b.style.display='none', 500); }
}
function changePeriod(period, e) {
  document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
  e?.target?.classList.add('active');
}
function copyAccountNumberNew() {
  const num = document.getElementById('modalBankNum')?.textContent.trim();
  if (num) navigator.clipboard.writeText(num).then(() => showNotification('success','Copied!','Account number copied.'));
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closePaymentModal(); closeWithdrawModal(); closeAddBankModal(); closeGoBackModal(); }
});
