// ============================================
// DASHBOARD PAGE
// ============================================

const DashboardPage = {
    render(stats) {
        return `
            <div class="dashboard-page">
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-icon primary">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Users</h3>
                            <div class="value">${stats?.totalUsers || 0}</div>
                            <div class="change positive">
                                <i class="fas fa-arrow-up"></i> +12% this month
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Verified Users</h3>
                            <div class="value">${stats?.verifiedUsers || 0}</div>
                            <div class="change positive">
                                <i class="fas fa-arrow-up"></i> +8% this month
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon warning">
                            <i class="fas fa-money-bill-wave"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Payments</h3>
                            <div class="value">${formatCurrency(stats?.totalPaymentAmount || 0)}</div>
                            <div class="change positive">
                                <i class="fas fa-arrow-up"></i> +15% this month
                            </div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <div class="stat-icon danger">
                            <i class="fas fa-arrow-down"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Total Withdrawals</h3>
                            <div class="value">${formatCurrency(stats?.totalWithdrawalAmount || 0)}</div>
                            <div class="change positive">
                                <i class="fas fa-arrow-up"></i> +5% this month
                            </div>
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 30px;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Recent Activity</h3>
                        </div>
                        <div class="card-body">
                            <div class="activity-list">
                                <div class="activity-item">
                                    <div class="activity-icon" style="background-color: rgba(16, 185, 129, 0.1); color: #10b981;">
                                        <i class="fas fa-user-plus"></i>
                                    </div>
                                    <div class="activity-content">
                                        <p><strong>New user registered</strong></p>
                                        <p style="font-size: 12px; color: var(--gray);">2 hours ago</p>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-icon" style="background-color: rgba(99, 102, 241, 0.1); color: #6366f1;">
                                        <i class="fas fa-money-bill-wave"></i>
                                    </div>
                                    <div class="activity-content">
                                        <p><strong>Payment received</strong></p>
                                        <p style="font-size: 12px; color: var(--gray);">5 hours ago</p>
                                    </div>
                                </div>
                                <div class="activity-item">
                                    <div class="activity-icon" style="background-color: rgba(245, 158, 11, 0.1); color: #f59e0b;">
                                        <i class="fas fa-arrow-down"></i>
                                    </div>
                                    <div class="activity-content">
                                        <p><strong>Withdrawal request pending</strong></p>
                                        <p style="font-size: 12px; color: var(--gray);">1 day ago</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Quick Stats</h3>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <span>Sterling Plans</span>
                                <strong>${stats?.sterlingCount || 0}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                <span>Sovereign Plans</span>
                                <strong>${stats?.sovereignCount || 0}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Lifestyle Plans</span>
                                <strong>${stats?.lifestyleCount || 0}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        // Add any dashboard-specific event listeners here
    }
};

// Add activity item styling
const style = document.createElement('style');
style.textContent = `
    .activity-list {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }

    .activity-item {
        display: flex;
        gap: 12px;
        padding: 12px;
        background-color: var(--bg-secondary);
        border-radius: 8px;
    }

    .activity-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    .activity-content {
        flex: 1;
    }

    .activity-content p {
        margin: 0;
        font-size: 14px;
    }
`;
document.head.appendChild(style);
