var express = require('express');
var router = express.Router();

/* GET home page / dashboard hub */
router.get('/', (req, res) => {
    res.render('index', { title: 'Dashboard Hub' });
});

module.exports = router;
