const jwt = require('jsonwebtoken');
const JWT_SECRET = 'blog_website_super_secret_key_987';

module.exports = function (req, res, next) {
    // FIX: Ignore favicon.ico requests so they do not overwrite your login redirect!
    if (req.originalUrl === '/favicon.ico') {
        return res.status(204).end();
    }

    const token = req.cookies.blogToken;
    if (!token) {
        return res.redirect(`/blog/login?redirectTo=${encodeURIComponent(req.originalUrl)}`);
    }
    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.blogUser = verified;
        next();
    } catch (err) {
        res.clearCookie('blogToken');
        return res.redirect(`/blog/login?redirectTo=${encodeURIComponent(req.originalUrl)}`);
    }
};