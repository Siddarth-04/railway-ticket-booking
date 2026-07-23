const express = require('express');
const router = express.Router();

const { addTrain, updateTrain, deleteTrain, getAllBookings } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { validateTrain } = require('../middleware/validateMiddleware');

// All admin routes require authentication + ADMIN role
router.use(authMiddleware, adminMiddleware);

// POST   /api/admin/add-train
router.post('/add-train', validateTrain, addTrain);

// PUT    /api/admin/update-train/:id
router.put('/update-train/:id', validateTrain, updateTrain);

// DELETE /api/admin/delete-train/:id
router.delete('/delete-train/:id', deleteTrain);

// GET    /api/admin/bookings
router.get('/bookings', getAllBookings);

module.exports = router;
