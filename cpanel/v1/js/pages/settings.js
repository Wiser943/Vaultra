const SettingsPage = {
    render(settings) {
        return `<div class="card"><div class="card-header"><h3 class="card-title">Platform Settings</h3></div><div class="card-body">
            <div class="form-group">
                <label>Maintenance Mode</label>
                <input type="checkbox" ${settings?.maintenanceMode ? 'checked' : ''} class="form-control" style="width: auto;">
            </div>
            <div class="form-group">
                <label>Withdrawals Enabled</label>
                <input type="checkbox" ${settings?.withdrawalsEnabled ? 'checked' : ''} class="form-control" style="width: auto;">
            </div>
            <div class="form-group">
                <label>Deposits Enabled</label>
                <input type="checkbox" ${settings?.depositsEnabled ? 'checked' : ''} class="form-control" style="width: auto;">
            </div>
            <button class="btn btn-primary">Save Settings</button>
        </div></div>`;
    },
    init() {}
};
