const ProfilePage = {
    render(user) {
        return `<div class="card"><div class="card-header"><h3 class="card-title">Admin Profile</h3></div><div class="card-body">
            <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control" value="${user?.fullName || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Email</label>
                <input type="email" class="form-control" value="${user?.email || ''}" readonly>
            </div>
            <div class="form-group">
                <label>Last Login</label>
                <input type="text" class="form-control" value="${user?.lastLoginAt ? formatDate(user.lastLoginAt) : 'N/A'}" readonly>
            </div>
        </div></div>`;
    },
    init() {}
};
