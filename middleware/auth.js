// auth.js (Your Notes Auth Middleware)

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_super_secret_notes_key_123';

module.exports = function (req, res, next) {
    if (req.originalUrl === '/favicon.ico') {
        return res.status(204).end();
    }

    // UPDATED WHITELIST: Ensure '/ecommerce' is here, and remove '/shop' if it's no longer used for this task
    const publicPaths = [
        '/ecommerce',  // Now the official path for your e-commerce task
        '/blog',
        '/expense',
        '/portfolio',
        '/landing',
        '/todo',
        '/calculator',
        '/weather',
        '/movies',
        '/contact'
    ];

    const isPublic = req.originalUrl === '/' || publicPaths.some(path => req.originalUrl.startsWith(path));

    if (isPublic) {
        return next(); // Bypass Notes JWT check for whitelisted paths
    }

    // Notes Task Authentication Check (ONLY for non-whitelisted paths)
    const token = req.cookies.token;
    if (!token) {
        return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`);
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified;
        next();
    } catch (err) {
        res.clearCookie('token');
        return res.redirect(`/login?redirectTo=${encodeURIComponent(req.originalUrl)}`);
    }
};