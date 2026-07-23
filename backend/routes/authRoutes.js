const express = require('express');
const router = express.Router();

const { register, login } = require('../controllers/authController');
const { validateRegister, validateLogin } = require('../middleware/validateMiddleware');

// POST /api/register
router.post('/register', validateRegister, register);

// POST /api/login
router.post('/login', validateLogin, login);

module.exports = router;
