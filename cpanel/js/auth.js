// ============================================
// AUTHENTICATION MODULE
// ============================================

class Auth {
    constructor() {
        this.user = this.loadUser();
        this.token = this.loadToken();
    }

    /**
     * Load user from localStorage
     */
    loadUser() {
        const userStr = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Load token from localStorage
     */
    loadToken() {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated() {
        return !!this.token && !!this.user;
    }

    /**
     * Check if user is admin
     */
    isAdmin() {
        return this.user && this.user.isAdmin === true;
    }

    /**
     * Get current user
     */
    getCurrentUser() {
        return this.user;
    }

    /**
     * Get auth token
     */
    getToken() {
        return this.token;
    }

    /**
     * Login user
     */
    async login(email, password) {
        try {
            const response = await api.login(email, password);
            
            if (response && response.token && response.user) {
                this.setAuth(response.token, response.user);
                return { success: true, user: response.user };
            }
            
            return { success: false, error: response?.message || 'Login failed' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Logout user
     */
    async logout() {
        try {
            await api.logout();
        } catch (error) {
            console.error('Logout error:', error);
        }
        
        this.clearAuth();
    }

    /**
     * Set authentication data
     */
    setAuth(token, user) {
        this.token = token;
        this.user = user;
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    }

    /**
     * Clear authentication data
     */
    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    }

    /**
     * Verify current session
     */
    async verifySes sion() {
        if (!this.isAuthenticated()) {
            return false;
        }

        try {
            const response = await api.getCurrentUser();
            if (response && response.user) {
                this.user = response.user;
                localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(response.user));
                return true;
            }
        } catch (error) {
            console.error('Session verification failed:', error);
            this.clearAuth();
            return false;
        }

        return false;
    }

    /**
     * Require authentication
     */
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login.html';
            return false;
        }
        return true;
    }

    /**
     * Require admin role
     */
    requireAdmin() {
        if (!this.isAdmin()) {
            window.location.href = '/';
            return false;
        }
        return true;
    }
}

// Create global auth instance
const auth = new Auth();

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async () => {
    // Only verify on pages that need it (not on login page)
    if (!window.location.pathname.includes('login')) {
        const isValid = await auth.verifySes sion();
        if (!isValid && window.location.pathname !== '/login.html') {
            window.location.href = '/login.html';
        }
    }
});
