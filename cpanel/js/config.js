// ============================================
// VAULTRA ADMIN PANEL - CONFIGURATION
// ============================================

const CONFIG = {
    // API Configuration
    API_BASE_URL: 'https://vaultra-zacl.onrender.com/api' || 'http://localhost:5000/api',
    
    // Local Storage Keys
    STORAGE_KEYS: {
        TOKEN: 'vaultra_admin_token',
        USER: 'vaultra_admin_user',
        THEME: 'vaultra_admin_theme'
    },

    // API Endpoints
    ENDPOINTS: {
        // Auth
        AUTH_LOGIN: '/auth/login',
        AUTH_LOGOUT: '/auth/logout',
        AUTH_ME: '/auth/me',
        AUTH_REFRESH: '/auth/refresh',

        // Users
        USERS_LIST: '/admin/users',
        USERS_GET: '/admin/users/:id',
        USERS_VERIFY: '/admin/users/:id/verify',
        USERS_UPDATE: '/admin/users/:id',

        // Transactions
        TRANSACTIONS_LIST: '/admin/transactions',
        TRANSACTIONS_GET: '/admin/transactions/:id',

        // Withdrawals
        WITHDRAWALS_LIST: '/admin/withdrawals',
        WITHDRAWALS_GET: '/admin/withdrawals/:id',
        WITHDRAWALS_APPROVE: '/admin/withdrawals/:id/approve',
        WITHDRAWALS_DECLINE: '/admin/withdrawals/:id/decline',
        WITHDRAWALS_UPDATE: '/admin/withdrawals/:id',

        // Settings
        SETTINGS_GET: '/admin/settings',
        SETTINGS_UPDATE: '/admin/settings',

        // Lifestyle
        LIFESTYLE_LIST: '/admin/lifestyle',
        LIFESTYLE_CREATE: '/admin/lifestyle',
        LIFESTYLE_GET: '/admin/lifestyle/:id',
        LIFESTYLE_UPDATE: '/admin/lifestyle/:id',
        LIFESTYLE_DELETE: '/admin/lifestyle/:id',

        // Logs
        LOGS_LIST: '/admin/logs',

        // Dashboard
        DASHBOARD_STATS: '/admin/dashboard/stats',
    },

    // Pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 50,
        PAGE_SIZES: [10, 25, 50, 100]
    },

    // Status Options
    USER_STATUS: {
        LOCKED: 'locked',
        VERIFICATION: 'verification',
        VERIFIED: 'verified'
    },

    USER_PLANS: {
        NONE: 'none',
        STERLING: 'sterling',
        SOVEREIGN: 'sovereign',
        LIFESTYLE: 'lifestyle'
    },

    TRANSACTION_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        SUCCESS: 'success',
        FAILED: 'failed'
    },

    WITHDRAWAL_STATUS: {
        PENDING: 'pending',
        PROCESSING: 'processing',
        COMPLETED: 'completed',
        FAILED: 'failed'
    },

    LIFESTYLE_STATUS: {
        DRAFT: 'draft',
        PUBLISHED: 'published'
    },

    // Toast Duration (ms)
    TOAST_DURATION: 3000,

    // Request Timeout (ms)
    REQUEST_TIMEOUT: 30000,

    // Validation Rules
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 8,
        MIN_NAME_LENGTH: 2,
        MAX_NAME_LENGTH: 100
    }
};

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
