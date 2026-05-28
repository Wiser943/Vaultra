const LifestylePage = {
    render(data) {
        const content = data?.content || [];
        return `<div class="card"><div class="card-header"><h3 class="card-title">Vaultra Lifestyle</h3><button class="btn btn-primary">Create Content</button></div><div class="card-body">
            ${content.length === 0 ? '<div class="empty-state"><p>No lifestyle content found</p></div>' : '<table><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead><tbody>' + content.map(c => `<tr><td>${c.title}</td><td>${c.category}</td><td>${getStatusBadge(c.status)}</td><td>${formatDate(c.createdAt)}</td><td><button class="btn btn-sm btn-outline">Edit</button></td></tr>`).join('') + '</tbody></table>'}
        </div></div>`;
    },
    init() {}
};
