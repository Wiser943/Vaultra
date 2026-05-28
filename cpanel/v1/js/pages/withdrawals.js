const WithdrawalsPage = {
    render(data) {
        const withdrawals = data?.withdrawals || [];
        return `<div class="card"><div class="card-header"><h3 class="card-title">Withdrawals</h3></div><div class="card-body">
            ${withdrawals.length === 0 ? '<div class="empty-state"><p>No withdrawals found</p></div>' : '<table><thead><tr><th>ID</th><th>User</th><th>Amount (EUR)</th><th>Bank</th><th>Status</th><th>Date</th></tr></thead><tbody>' + withdrawals.map(w => `<tr><td>${w._id}</td><td>${w.user}</td><td>${formatCurrency(w.amountEur)}</td><td>${w.bankName}</td><td>${getStatusBadge(w.status)}</td><td>${formatDate(w.createdAt)}</td></tr>`).join('') + '</tbody></table>'}
        </div></div>`;
    },
    init() {}
};
