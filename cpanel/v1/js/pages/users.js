const UsersPage = {
    render(data) {
        const users = data?.users || [];
        const total = data?.total || 0;
        
        let html = '<div class="card"><div class="card-header"><h3 class="card-title">Users Management</h3></div><div class="card-body">';
        
        if (users.length === 0) {
            html += '<div class="empty-state"><p>No users found</p></div>';
        } else {
            html += '<table><thead><tr><th>Name</th><th>Email</th><th>Plan</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
            users.forEach(user => {
                html += `<tr>
                    <td>${user.fullName}</td>
                    <td>${user.email}</td>
                    <td>${getPlanBadge(user.plan)}</td>
                    <td>${getStatusBadge(user.status)}</td>
                    <td><button class="btn btn-sm btn-primary">View</button></td>
                </tr>`;
            });
            html += '</tbody></table>';
        }
        
        html += '</div></div>';
        return html;
    },
    init() {}
};
