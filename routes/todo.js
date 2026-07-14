var express = require('express');
var router = express.Router();
var path = require('path');

router.get('/', (req, res) => {
    const filePath = path.join(__dirname, '../public/todo.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error("❌ Error serving todo page:", err);
            res.status(404).send('To-Do view file not found');
        }
    });
});

module.exports = router;