// ============================================
// MAIN APP CONTROLLER
// ============================================

class AdminApp {
    constructor() {
        this.currentPage = 'dashboard';
        this.init();
    }

    /**
     * Initialize the app
     */
    init() {
        // Check authentication
        if (!auth.requireAdmin()) {
            return;
        }

        this.setupEventListeners();
        this.loadTheme();
        this.updateUserInfo();
        this.loadPage('dashboard');
    }

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                this.loadPage(page);
            });
        });

        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('collapsed');
            });
        }

        // Menu toggle (mobile)
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('active');
            });
        }

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', toggleTheme);
        }

        // User dropdown
        const userButton = document.getElementById('userButton');
        const userDropdown = document.getElementById('userDropdown');
        if (userButton && userDropdown) {
            userButton.addEventListener('click', () => {
                userDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (!userButton.contains(e.target) && !userDropdown.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.logout();
            });
        }

        // Dropdown menu items
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    e.preventDefault();
                    this.loadPage(page);
                    userDropdown.classList.remove('active');
                }
            });
        });
    }

    /**
     * Load a page
     */
    async loadPage(page) {
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) {
                item.classList.add('active');
            }
        });

        // Update breadcrumb
        this.updateBreadcrumb(page);

        // Load page content
        const content = document.getElementById('content');
        showLoading(content);

        try {
            switch (page) {
                case 'dashboard':
                    await this.loadDashboard();
                    break;
                case 'users':
                    await this.loadUsers();
                    break;
                case 'transactions':
                    await this.loadTransactions();
                    break;
                case 'withdrawals':
                    await this.loadWithdrawals();
                    break;
                case 'lifestyle':
                    await this.loadLifestyle();
                    break;
                case 'settings':
                    await this.loadSettings();
                    break;
                case 'logs':
                    await this.loadLogs();
                    break;
                case 'profile':
                    await this.loadProfile();
                    break;
                default:
                    showEmptyState(content, 'Page not found', 'The page you are looking for does not exist.');
            }

            this.currentPage = page;
            
            // Close mobile sidebar after navigation
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.remove('active');
            }
        } catch (error) {
            console.error('Error loading page:', error);
            showEmptyState(content, 'Error', 'Failed to load page. Please try again.');
            showToast('Error loading page', 'error');
        }
    }

    /**
     * Update breadcrumb
     */
    updateBreadcrumb(page) {
        const breadcrumb = document.getElementById('breadcrumb');
        const titles = {
            'dashboard': 'Dashboard',
            'users': 'Users',
            'transactions': 'Transactions',
            'withdrawals': 'Withdrawals',
            'lifestyle': 'Vaultra Lifestyle',
            'settings': 'Settings',
            'logs': 'Activity Logs',
            'profile': 'Profile'
        };
        breadcrumb.innerHTML = `<span class="breadcrumb-item">${titles[page] || 'Page'}</span>`;
    }

    /**
     * Load dashboard
     */
    async loadDashboard() {
        const content = document.getElementById('content');
        try {
            const stats = await api.getDashboardStats();
            content.innerHTML = DashboardPage.render(stats);
            DashboardPage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load dashboard');
        }
    }

    /**
     * Load users page
     */
    async loadUsers() {
        const content = document.getElementById('content');
        try {
            const users = await api.getUsers(1, 50);
            content.innerHTML = UsersPage.render(users);
            UsersPage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load users');
        }
    }

    /**
     * Load transactions page
     */
    async loadTransactions() {
        const content = document.getElementById('content');
        try {
            const transactions = await api.getTransactions(1, 50);
            content.innerHTML = TransactionsPage.render(transactions);
            TransactionsPage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load transactions');
        }
    }

    /**
     * Load withdrawals page
     */
    async loadWithdrawals() {
        const content = document.getElementById('content');
        try {
            const withdrawals = await api.getWithdrawals(1, 50);
            content.innerHTML = WithdrawalsPage.render(withdrawals);
            WithdrawalsPage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load withdrawals');
        }
    }

    /**
     * Load lifestyle page
     */
    async loadLifestyle() {
        const content = document.getElementById('content');
        try {
            const lifestyle = await api.getLifestyleContent(1, 50);
            content.innerHTML = LifestylePage.render(lifestyle);
            LifestylePage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load lifestyle content');
        }
    }

    /**
     * Load settings page
     */
    async loadSettings() {
        const content = document.getElementById('content');
        try {
            const settings = await api.getSettings();
            content.innerHTML = SettingsPage.render(settings);
            SettingsPage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load settings');
        }
    }

    /**
     * Load logs page
     */
    async loadLogs() {
        const content = document.getElementById('content');
        try {
            const logs = await api.getActivityLogs(1, 50);
            content.innerHTML = LogsPage.render(logs);
            LogsPage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load activity logs');
        }
    }

    /**
     * Load profile page
     */
    async loadProfile() {
        const content = document.getElementById('content');
        try {
            const user = auth.getCurrentUser();
            content.innerHTML = ProfilePage.render(user);
            ProfilePage.init();
        } catch (error) {
            showEmptyState(content, 'Error', 'Failed to load profile');
        }
    }

    /**
     * Update user info in header
     */
    updateUserInfo() {
        const user = auth.getCurrentUser();
        if (user) {
            const userName = document.getElementById('userName');
            if (userName) {
                userName.textContent = user.fullName || user.email;
            }
        }
    }

    /**
     * Load theme
     */
    loadTheme() {
        const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
        }
        updateThemeIcon();
    }

    /**
     * Logout
     */
    async logout() {
        try {
            await auth.logout();
            window.location.href = '/login.html';
        } catch (error) {
            console.error('Logout error:', error);
            showToast('Logout failed', 'error');
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new AdminApp();
});
