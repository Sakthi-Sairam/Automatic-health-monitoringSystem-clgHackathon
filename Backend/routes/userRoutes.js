const express = require('express');
const router = express.Router();

router.get('/dashboard', (req, res) => {
    res.render('./user/user');
});
router.get('/history', (req, res) => {
    res.render('./user/history');
});
router.get('/medication', (req, res) => {
    res.render('./user/medication');
});
router.get('/report', (req, res) => {
    res.render('./user/report');
});
router.get('/profile', (req, res) => {
    res.render('./user/profile');
});

module.exports = router;