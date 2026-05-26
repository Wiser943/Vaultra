# VAULTRA Netlify Frontend + Render Backend Notes

This patched version temporarily disables the backend **Content Security Policy** to stop the font, inline-script, and debugger CSP errors while the current static pages still contain inline styles and inline `onclick` handlers.

## Render backend environment variables

Set these on Render:

| Variable | Example | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables secure cookies. |
| `MONGODB_URI` | your MongoDB Atlas URI | Database connection. |
| `JWT_SECRET` | long random secret | Signs auth tokens. |
| `FRONTEND_URL` | `https://your-site.netlify.app` | Browser redirects and referral links. |
| `BACKEND_URL` | `https://your-backend.onrender.com` | Korapay webhook URL. |
| `CORS_ORIGINS` | `https://your-site.netlify.app` | Allowed frontend origins; comma-separated if multiple. |
| `KORAPAY_PUBLIC_KEY` / `KORAPAY_SECRET_KEY` / `KORAPAY_ENCRYPTION_KEY` | your Korapay keys | Payment integration. |
| `KORAPAY_BASE_URL` | `https://api.korapay.com/merchant/api/v1` | Korapay API base URL. |

## Netlify frontend options

The easiest option is to uncomment the `/api/*` redirect in `netlify.toml` and replace `https://your-backend-service.onrender.com` with your real Render URL. Then the frontend can keep calling `/api/...`.

If you do not use the proxy redirect, copy `public/js/config.example.js` to `public/js/config.js`, set `window.VAULTRA_API_BASE` to the Render backend URL, and include `js/config.js` before `js/api.js` in your HTML pages.

## Important fixes included

The patch disables Helmet CSP, removes the Eruda debug console from `dashboard.html`, makes the frontend API base configurable, allows Netlify origins through CORS, changes production auth cookies to `SameSite=None; Secure`, separates Korapay webhook and redirect URLs, and preserves the raw Korapay webhook body for signature verification.
