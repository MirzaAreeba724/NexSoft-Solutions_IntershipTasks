const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    // Attempt to read logged-in user from express-session
    const loggedInUser = req.session && req.session.user ? req.session.user.username : null;

    res.render('chat', {
        title: 'Real-Time Chat Workspace',
        username: loggedInUser
    });
});

module.exports = router;