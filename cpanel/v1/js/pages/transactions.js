const TransactionsPage = {
    render(data) {
        const transactions = data?.payments || [];
        return `<div class="card"><div class="card-header"><h3 class="card-title">Transactions</h3></div><div class="card-body">
            ${transactions.length === 0 ? '<div class="empty-state"><p>No transactions found</p></div>' : '<table><thead><tr><th>ID</th><th>User</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead><tbody>' + transactions.map(t => `<tr><td>${t._id}</td><td>${t.user}</td><td>${formatCurrency(t.amount)}</td><td>${getStatusBadge(t.status)}</td><td>${formatDate(t.createdAt)}</td></tr>`).join('') + '</tbody></table>'}
        </div></div>`;
    },
    init() {}
};
