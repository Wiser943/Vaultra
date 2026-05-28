# Vaultra Admin Panel - Frontend

A professional, production-ready admin dashboard for managing the Vaultra platform. Built with pure HTML, CSS, and JavaScript for deployment on Netlify.

## Features

✅ **Dashboard** - Live statistics and overview  
✅ **User Management** - Manage users, verify, and assign plans  
✅ **Transactions** - View all payments and transactions  
✅ **Withdrawals** - Manage withdrawal requests with approval/decline  
✅ **Vaultra Lifestyle** - Create and manage lifestyle content  
✅ **System Settings** - Platform-level togglers and configuration  
✅ **Activity Logs** - Comprehensive audit trail  
✅ **Admin Profile** - User profile and session management  
✅ **Dark/Light Mode** - Theme toggle with persistent storage  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  

## Project Structure

```
vaultra-admin-frontend/
├── index.html              # Main dashboard
├── login.html              # Login page
├── css/
│   ├── styles.css          # Main styles
│   └── theme.css           # Dark/Light mode
├── js/
│   ├── config.js           # Configuration
│   ├── api.js              # API client
│   ├── auth.js             # Authentication
│   ├── utils.js            # Utility functions
│   ├── app.js              # Main app controller
│   └── pages/
│       ├── dashboard.js    # Dashboard page
│       ├── users.js        # Users page
│       ├── transactions.js # Transactions page
│       ├── withdrawals.js  # Withdrawals page
│       ├── lifestyle.js    # Lifestyle page
│       ├── settings.js     # Settings page
│       ├── logs.js         # Activity logs page
│       └── profile.js      # Profile page
└── README.md
```

## Setup & Deployment

### Local Development

1. **Update API Configuration**
   - Edit `js/config.js` and set `API_BASE_URL` to your backend URL
   - Default: `http://localhost:5000/api`

2. **Serve Locally**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using Live Server (VS Code extension)
   # Just open index.html with Live Server
   ```

3. **Access the App**
   - Navigate to `http://localhost:8000`
   - Login with admin credentials

### Deploy to Netlify

1. **Prepare for Deployment**
   - Update `js/config.js` with your production backend URL
   - Ensure CORS is configured on your backend

2. **Deploy**
   ```bash
   # Option 1: Drag and drop
   - Go to https://app.netlify.com
   - Drag the project folder to deploy
   
   # Option 2: Git integration
   - Push to GitHub
   - Connect repository to Netlify
   - Set build command: (leave empty)
   - Set publish directory: . (root)
   ```

3. **Environment Variables**
   - Set `REACT_APP_API_URL` in Netlify environment variables if needed

## Configuration

### API Endpoints

Edit `js/config.js` to configure:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://your-backend-url/api',
    // ... other config
};
```

### Authentication

The app uses JWT-based authentication:
- Login credentials are sent to `/api/auth/login`
- JWT token is stored in localStorage
- Token is sent in `Authorization: Bearer <token>` header

### Theme

Theme preference is automatically saved to localStorage:
- Click the moon/sun icon in the header to toggle
- Preference persists across sessions

## Features

### Dashboard
- Real-time statistics cards
- User growth trends
- Payment/withdrawal metrics
- Plan distribution overview

### User Management
- Searchable user table
- Filter by plan (Sterling, Sovereign, Lifestyle)
- Filter by status (locked, verification, verified)
- Verify users and assign plans
- View user details

### Transactions
- Complete payment history
- Filter by status (pending, processing, success, failed)
- Pagination support
- CSV export functionality

### Withdrawals
- Tabbed interface (Pending, Completed, Failed)
- Approve/decline withdrawals
- Add processing notes
- View withdrawal details

### Vaultra Lifestyle
- Create lifestyle content
- Draft/published status
- Edit and delete content
- Category management

### System Settings
- Maintenance mode toggle
- Withdrawals enabled/disabled
- Deposits enabled/disabled
- New user registration toggle
- Payment processing toggle

### Activity Logs
- Comprehensive audit trail
- Filter by action type
- Filter by admin user
- CSV export

### Admin Profile
- View profile information
- Session management
- Last login tracking
- Secure logout

## API Integration

The frontend communicates with the backend via REST API. All endpoints are defined in `js/config.js`:

```javascript
ENDPOINTS: {
    AUTH_LOGIN: '/auth/login',
    USERS_LIST: '/admin/users',
    TRANSACTIONS_LIST: '/admin/transactions',
    // ... etc
}
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## Security

- JWT-based authentication
- Secure token storage
- Admin-only access enforcement
- CORS protection
- XSS prevention through DOM manipulation

## Troubleshooting

### Login Issues
- Check backend is running and accessible
- Verify API_BASE_URL in config.js
- Check browser console for errors

### API Errors
- Ensure backend CORS is configured correctly
- Check JWT token expiration
- Verify admin user exists in database

### Theme Not Persisting
- Check localStorage is enabled
- Clear browser cache and try again

## Support

For issues or questions, contact the Vaultra team.

## License

MIT
