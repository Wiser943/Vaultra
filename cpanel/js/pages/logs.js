const LogsPage = {
    render(data) {
        const logs = data?.logs || [];
        return `<div class="card"><div class="card-header"><h3 class="card-title">Activity Logs</h3></div><div class="card-body">
            ${logs.length === 0 ? '<div class="empty-state"><p>No activity logs found</p></div>' : '<table><thead><tr><th>Timestamp</th><th>Admin</th><th>Action</th><th>Resource</th><th>Details</th></tr></thead><tbody>' + logs.map(l => `<tr><td>${formatDate(l.createdAt)}</td><td>${l.admin}</td><td>${l.action}</td><td>${l.resource}</td><td>${l.details}</td></tr>`).join('') + '</tbody></table>'}
        </div></div>`;
    },
    init() {}
};
