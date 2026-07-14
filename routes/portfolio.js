var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../public/portfolio.html');
    console.log("📁 Sending portfolio from:", filePath);
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error sending file:", err);
            res.status(404).send('File not found');
        }
    });
});

module.exports = router;
