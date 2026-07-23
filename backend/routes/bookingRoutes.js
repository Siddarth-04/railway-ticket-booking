const express = require('express');
const router = express.Router();

const { bookTicket, cancelTicket, myBookings, trackPNR, downloadTicket } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');
const { validateBooking, validateCancel } = require('../middleware/validateMiddleware');

// All booking routes require authentication
router.use(authMiddleware);

// POST /api/book
router.post('/book', validateBooking, bookTicket);

// POST /api/cancel
router.post('/cancel', validateCancel, cancelTicket);

// GET /api/my-bookings
router.get('/my-bookings', myBookings);

// GET /api/track/:pnr
router.get('/track/:pnr', trackPNR);

// GET /api/ticket/:booking_id
router.get('/ticket/:booking_id', downloadTicket);
module.exports = router;
