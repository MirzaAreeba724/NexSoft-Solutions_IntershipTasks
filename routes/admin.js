var express = require('express');
var router = express.Router();

// --- GET Routes (Rendering Pages) ---
router.get('/dashboard', (req, res) => {
    res.render('admin-dashboard', { title: 'Admin Dashboard' });
});

router.get('/movies', (req, res) => {
    res.render('admin-movies', { title: 'Manage Movies' });
});

router.get('/settings', (req, res) => {
    res.render('admin-settings', { title: 'Settings' });
});

router.get('/add-movie', (req, res) => {
    res.render('admin-add-movie', { title: 'Add New Movie' });
});

// --- POST Routes (Handling Actions) ---

// Handle Settings Form Submission
router.post('/settings/save', (req, res) => {
    // Checkboxes only send data if they are 'checked'. 
    // If unchecked, they won't appear in req.body.
    const enableNotifications = (req.body.notifications === 'on');
    const enableDarkMode = (req.body.darkMode === 'on');

    console.log("Settings submitted:", { enableNotifications, enableDarkMode });

    // TODO: Add your MongoDB update logic here:
    // await User.updateOne({ ... }, { darkMode: enableDarkMode, notifications: enableNotifications });

    // Redirect ensures the browser "finishes" the post request
    res.redirect('/admin/settings');
});

// Handle Add Movie Form Submission
router.post('/submit-movie', (req, res) => {
    const { title, genre, year } = req.body;
    console.log("SUCCESS! Received data:", { title, genre, year });

    // Redirect to the list view after processing
    res.redirect('/admin/movies');
});

module.exports = router;