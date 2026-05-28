// ============================================
// API HELPER MODULE
// ============================================

class API {
    constructor() {
        this.baseURL = CONFIG.API_BASE_URL;
        this.timeout = CONFIG.REQUEST_TIMEOUT;
    }

    /**
     * Get authorization header with JWT token
     */
    getAuthHeader() {
        const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Make HTTP request
     */
    async request(method, endpoint, data = null, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const headers = this.getAuthHeader();

        const config = {
            method,
            headers,
            ...options
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle 401 Unauthorized
            if (response.status === 401) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
                localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
                window.location.href = '/login.html';
                return null;
            }

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || `HTTP ${response.status}`);
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    get(endpoint, options = {}) {
        return this.request('GET', endpoint, null, options);
    }

    /**
     * POST request
     */
    post(endpoint, data, options = {}) {
        return this.request('POST', endpoint, data, options);
    }

    /**
     * PUT request
     */
    put(endpoint, data, options = {}) {
        return this.request('PUT', endpoint, data, options);
    }

    /**
     * PATCH request
     */
    patch(endpoint, data, options = {}) {
        return this.request('PATCH', endpoint, data, options);
    }

    /**
     * DELETE request
     */
    delete(endpoint, options = {}) {
        return this.request('DELETE', endpoint, null, options);
    }

    // ============================================
    // AUTH ENDPOINTS
    // ============================================

    login(email, password) {
        return this.post(CONFIG.ENDPOINTS.AUTH_LOGIN, { email, password });
    }

    logout() {
        return this.post(CONFIG.ENDPOINTS.AUTH_LOGOUT);
    }

    getCurrentUser() {
        return this.get(CONFIG.ENDPOINTS.AUTH_ME);
    }

    refreshToken() {
        return this.post(CONFIG.ENDPOINTS.AUTH_REFRESH);
    }

    // ============================================
    // DASHBOARD ENDPOINTS
    // ============================================

    getDashboardStats() {
        return this.get(CONFIG.ENDPOINTS.DASHBOARD_STATS);
    }

    // ============================================
    // USERS ENDPOINTS
    // ============================================

    getUsers(page = 1, limit = 50, filters = {}) {
        const params = new URLSearchParams({
            page,
            limit,
            ...filters
        });
        return this.get(`${CONFIG.ENDPOINTS.USERS_LIST}?${params}`);
    }

    getUser(id) {
        return this.get(CONFIG.ENDPOINTS.USERS_GET.replace(':id', id));
    }

    verifyUser(id, plan) {
        return this.post(CONFIG.ENDPOINTS.USERS_VERIFY.replace(':id', id), { plan });
    }

    updateUser(id, data) {
        return this.put(CONFIG.ENDPOINTS.USERS_UPDATE.replace(':id', id), data);
    }

    // ============================================
    // TRANSACTIONS ENDPOINTS
    // ============================================

    getTransactions(page = 1, limit = 50, filters = {}) {
        const params = new URLSearchParams({
            page,
            limit,
            ...filters
        });
        return this.get(`${CONFIG.ENDPOINTS.TRANSACTIONS_LIST}?${params}`);
    }

    getTransaction(id) {
        return this.get(CONFIG.ENDPOINTS.TRANSACTIONS_GET.replace(':id', id));
    }

    // ============================================
    // WITHDRAWALS ENDPOINTS
    // ============================================

    getWithdrawals(page = 1, limit = 50, filters = {}) {
        const params = new URLSearchParams({
            page,
            limit,
            ...filters
        });
        return this.get(`${CONFIG.ENDPOINTS.WITHDRAWALS_LIST}?${params}`);
    }

    getWithdrawal(id) {
        return this.get(CONFIG.ENDPOINTS.WITHDRAWALS_GET.replace(':id', id));
    }

    approveWithdrawal(id, note = '') {
        return this.post(CONFIG.ENDPOINTS.WITHDRAWALS_APPROVE.replace(':id', id), { note });
    }

    declineWithdrawal(id, note = '') {
        return this.post(CONFIG.ENDPOINTS.WITHDRAWALS_DECLINE.replace(':id', id), { note });
    }

    updateWithdrawal(id, data) {
        return this.put(CONFIG.ENDPOINTS.WITHDRAWALS_UPDATE.replace(':id', id), data);
    }

    // ============================================
    // SETTINGS ENDPOINTS
    // ============================================

    getSettings() {
        return this.get(CONFIG.ENDPOINTS.SETTINGS_GET);
    }

    updateSettings(data) {
        return this.put(CONFIG.ENDPOINTS.SETTINGS_UPDATE, data);
    }

    // ============================================
    // LIFESTYLE ENDPOINTS
    // ============================================

    getLifestyleContent(page = 1, limit = 50, filters = {}) {
        const params = new URLSearchParams({
            page,
            limit,
            ...filters
        });
        return this.get(`${CONFIG.ENDPOINTS.LIFESTYLE_LIST}?${params}`);
    }

    createLifestyleContent(data) {
        return this.post(CONFIG.ENDPOINTS.LIFESTYLE_CREATE, data);
    }

    getLifestyleItem(id) {
        return this.get(CONFIG.ENDPOINTS.LIFESTYLE_GET.replace(':id', id));
    }

    updateLifestyleContent(id, data) {
        return this.put(CONFIG.ENDPOINTS.LIFESTYLE_UPDATE.replace(':id', id), data);
    }

    deleteLifestyleContent(id) {
        return this.delete(CONFIG.ENDPOINTS.LIFESTYLE_DELETE.replace(':id', id));
    }

    // ============================================
    // LOGS ENDPOINTS
    // ============================================

    getActivityLogs(page = 1, limit = 50, filters = {}) {
        const params = new URLSearchParams({
            page,
            limit,
            ...filters
        });
        return this.get(`${CONFIG.ENDPOINTS.LOGS_LIST}?${params}`);
    }
}

// Create global API instance
const api = new API();
