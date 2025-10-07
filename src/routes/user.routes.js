const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

// Auth routes
router.get('/auth', userController.renderLoginRegister);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/logout', userController.logout);

// Profile routes
router.get('/profile', requireAuth, userController.getProfile);

module.exports = router;
