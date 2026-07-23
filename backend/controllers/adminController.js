const pool = require('../config/db');

/**
 * POST /api/admin/add-train
 * Adds a new train to the system.
 */
const addTrain = async (req, res, next) => {
  try {
    const {
      train_name, source, destination,
      departure_time, arrival_time,
      total_seats, available_seats, price,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO trains
         (train_name, source, destination, departure_time, arrival_time, total_seats, available_seats, price)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        train_name.trim(), source.trim(), destination.trim(),
        departure_time, arrival_time,
        parseInt(total_seats, 10),
        parseInt(available_seats, 10),
        parseFloat(price),
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Train added successfully.',
      trainId: result.insertId,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/admin/update-train/:id
 * Updates an existing train's details.
 */
const updateTrain = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      train_name, source, destination,
      departure_time, arrival_time,
      total_seats, available_seats, price,
    } = req.body;

    const [existing] = await pool.query(
      'SELECT train_id FROM trains WHERE train_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Train not found.' });
    }

    await pool.query(
      `UPDATE trains SET
         train_name = ?, source = ?, destination = ?,
         departure_time = ?, arrival_time = ?,
         total_seats = ?, available_seats = ?, price = ?
       WHERE train_id = ?`,
      [
        train_name.trim(), source.trim(), destination.trim(),
        departure_time, arrival_time,
        parseInt(total_seats, 10),
        parseInt(available_seats, 10),
        parseFloat(price),
        id,
      ]
    );

    return res.status(200).json({ success: true, message: 'Train updated successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/delete-train/:id
 * Deletes a train by ID.
 */
const deleteTrain = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query(
      'SELECT train_id FROM trains WHERE train_id = ?',
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Train not found.' });
    }

    await pool.query('DELETE FROM trains WHERE train_id = ?', [id]);

    return res.status(200).json({ success: true, message: 'Train deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/bookings
 * Returns all bookings with user and train details — admin only.
 */
const getAllBookings = async (req, res, next) => {
  try {
    const [bookings] = await pool.query(
      `SELECT
         b.booking_id,
         b.pnr_number,
         b.journey_date,
         b.seat_count,
         b.total_amount,
         b.booking_status,
         b.booked_at,
         u.user_id,
         u.name  AS passenger_name,
         u.email AS passenger_email,
         t.train_id,
         t.train_name,
         t.source,
         t.destination
       FROM bookings b
       JOIN users  u ON b.user_id  = u.user_id
       JOIN trains t ON b.train_id = t.train_id
       ORDER BY b.booked_at DESC`
    );

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

module.exports = { addTrain, updateTrain, deleteTrain, getAllBookings };
