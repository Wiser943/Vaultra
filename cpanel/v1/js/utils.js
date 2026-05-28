// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show toast notification
 */
function showToast(message, type = 'info', duration = CONFIG.TOAST_DURATION) {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>${message}</span>
            <button style="background: none; border: none; cursor: pointer; color: inherit; font-size: 18px;" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, duration);
}

/**
 * Format currency
 */
function formatCurrency(amount, currency = 'EUR') {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Format date
 */
function formatDate(date, format = 'short') {
    const d = new Date(date);
    
    if (format === 'short') {
        return d.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    if (format === 'long') {
        return d.toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
        });
    }
    
    if (format === 'time') {
        return d.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }
    
    return d.toLocaleString();
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
function formatRelativeTime(date) {
    const now = new Date();
    const diff = now - new Date(date);
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return formatDate(date, 'short');
}

/**
 * Truncate text
 */
function truncateText(text, maxLength = 50) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Validate email
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Validate password
 */
function validatePassword(password) {
    return password.length >= CONFIG.VALIDATION.MIN_PASSWORD_LENGTH;
}

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
    const badges = {
        'verified': '<span class="badge badge-success"><i class="fas fa-check-circle"></i> Verified</span>',
        'verification': '<span class="badge badge-info"><i class="fas fa-hourglass-half"></i> Verification</span>',
        'locked': '<span class="badge badge-danger"><i class="fas fa-lock"></i> Locked</span>',
        'pending': '<span class="badge badge-pending"><i class="fas fa-clock"></i> Pending</span>',
        'processing': '<span class="badge badge-info"><i class="fas fa-spinner"></i> Processing</span>',
        'completed': '<span class="badge badge-completed"><i class="fas fa-check"></i> Completed</span>',
        'success': '<span class="badge badge-success"><i class="fas fa-check"></i> Success</span>',
        'failed': '<span class="badge badge-failed"><i class="fas fa-times"></i> Failed</span>',
        'draft': '<span class="badge badge-info"><i class="fas fa-file"></i> Draft</span>',
        'published': '<span class="badge badge-success"><i class="fas fa-eye"></i> Published</span>'
    };
    
    return badges[status] || `<span class="badge">${status}</span>`;
}

/**
 * Get plan badge HTML
 */
function getPlanBadge(plan) {
    const badges = {
        'sterling': '<span class="badge" style="background-color: #c7d2fe; color: #3730a3;"><i class="fas fa-gem"></i> Sterling</span>',
        'sovereign': '<span class="badge" style="background-color: #fce7f3; color: #831843;"><i class="fas fa-crown"></i> Sovereign</span>',
        'lifestyle': '<span class="badge" style="background-color: #dbeafe; color: #0c2d6b;"><i class="fas fa-star"></i> Lifestyle</span>',
        'none': '<span class="badge" style="background-color: #f3f4f6; color: #6b7280;">None</span>'
    };
    
    return badges[plan] || `<span class="badge">${plan}</span>`;
}

/**
 * Show loading state
 */
function showLoading(element) {
    element.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
}

/**
 * Show empty state
 */
function showEmptyState(element, title = 'No data', message = 'No items to display') {
    element.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-icon">
                <i class="fas fa-inbox"></i>
            </div>
            <h3 class="empty-state-title">${title}</h3>
            <p class="empty-state-text">${message}</p>
        </div>
    `;
}

/**
 * Create pagination HTML
 */
function createPagination(currentPage, totalPages, onPageChange) {
    let html = '<div class="pagination">';
    
    // Previous button
    if (currentPage > 1) {
        html += `<button class="pagination-item" onclick="event.preventDefault(); ${onPageChange}(${currentPage - 1})">
            <i class="fas fa-chevron-left"></i>
        </button>`;
    } else {
        html += '<button class="pagination-item disabled" disabled><i class="fas fa-chevron-left"></i></button>';
    }
    
    // Page numbers
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="pagination-item" onclick="event.preventDefault(); ${onPageChange}(1)">1</button>`;
        if (startPage > 2) html += '<span class="pagination-item disabled">...</span>';
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="pagination-item active">${i}</button>`;
        } else {
            html += `<button class="pagination-item" onclick="event.preventDefault(); ${onPageChange}(${i})">${i}</button>`;
        }
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += '<span class="pagination-item disabled">...</span>';
        html += `<button class="pagination-item" onclick="event.preventDefault(); ${onPageChange}(${totalPages})">${totalPages}</button>`;
    }
    
    // Next button
    if (currentPage < totalPages) {
        html += `<button class="pagination-item" onclick="event.preventDefault(); ${onPageChange}(${currentPage + 1})">
            <i class="fas fa-chevron-right"></i>
        </button>`;
    } else {
        html += '<button class="pagination-item disabled" disabled><i class="fas fa-chevron-right"></i></button>';
    }
    
    html += '</div>';
    return html;
}

/**
 * Debounce function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Deep clone object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Export data to CSV
 */
function exportToCSV(data, filename = 'export.csv') {
    if (!data || data.length === 0) {
        showToast('No data to export', 'warning');
        return;
    }

    const headers = Object.keys(data[0]);
    const csv = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                if (typeof value === 'string' && value.includes(',')) {
                    return `"${value}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showToast('Data exported successfully', 'success');
}

/**
 * Toggle theme
 */
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem(CONFIG.STORAGE_KEYS.THEME, isDark ? 'dark' : 'light');
    updateThemeIcon();
}

/**
 * Load saved theme
 */
function loadTheme() {
    const savedTheme = localStorage.getItem(CONFIG.STORAGE_KEYS.THEME) || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
    }
    updateThemeIcon();
}

/**
 * Update theme toggle icon
 */
function updateThemeIcon() {
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const isDark = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
    }
}

/**
 * Initialize theme on page load
 */
document.addEventListener('DOMContentLoaded', loadTheme);
