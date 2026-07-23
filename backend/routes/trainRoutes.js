const express = require('express');
const router = express.Router();

const { getAllTrains, searchTrains } = require('../controllers/trainController');

// GET /api/trains
router.get('/', getAllTrains);

// GET /api/trains/search?source=&destination=
router.get('/search', searchTrains);

module.exports = router;
