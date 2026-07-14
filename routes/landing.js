var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', (req, res) => {
    // Serves the landing.html file from your public folder
    const filePath = path.join(__dirname, '../public/landing.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error sending landing page:", err);
            res.status(404).send('Landing page file not found');
        }
    });
});

module.exports = router;