const pool = require('../config/db');
const { generateUniquePNR } = require('../utils/helpers');

/**
 * POST /api/book
 * Books a ticket using a transaction with row-level locking.
 * Prevents overbooking and race conditions.
 */
const bookTicket = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { train_id, journey_date, seat_count } = req.body;
    const userId = req.user.user_id;
    const seats = parseInt(seat_count, 10);

    await conn.beginTransaction();

    // Lock the train row to prevent race conditions
    const [trainRows] = await conn.query(
      'SELECT train_id, train_name, available_seats, price FROM trains WHERE train_id = ? FOR UPDATE',
      [train_id]
    );

    if (trainRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Train not found.' });
    }

    const train = trainRows[0];

    if (train.available_seats < seats) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: `Not enough seats. Only ${train.available_seats} seat(s) available.`,
      });
    }
    // Select available seats (lock them)
const [seatRows] = await conn.query(
  `SELECT s.seat_id, s.seat_number
   FROM seats s
   LEFT JOIN booking_seats bs ON s.seat_id = bs.seat_id
   WHERE s.train_id = ?
   AND bs.seat_id IS NULL
   LIMIT ?
   FOR UPDATE`,
  [train_id, seats]
);

if (seatRows.length < seats) {
  await conn.rollback();
  return res.status(409).json({
    success: false,
    message: 'Not enough actual free seats available.',
  });
}

    // Deduct seats
    await conn.query(
      'UPDATE trains SET available_seats = available_seats - ? WHERE train_id = ?',
      [seats, train_id]
    );

    // Generate unique PNR
    const pnr = await generateUniquePNR();
    const totalAmount = parseFloat(train.price) * seats;

    // Insert booking record
    const [bookingResult] = await conn.query(
      `INSERT INTO bookings
         (user_id, train_id, journey_date, seat_count, total_amount, pnr_number, booking_status)
       VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')`,
      [userId, train_id, journey_date, seats, totalAmount, pnr]
    );
    // Insert selected seats into booking_seats
    for (const seat of seatRows) {
      await conn.query(
        'INSERT INTO booking_seats (booking_id, seat_id) VALUES (?, ?)',
        [bookingResult.insertId, seat.seat_id]
      );
    }

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Ticket booked successfully!',
      data: {
        booking_id: bookingResult.insertId,
        pnr_number: pnr,
        train_name: train.train_name,
        journey_date,
        seat_count: seats,
        total_amount: totalAmount,
        booking_status: 'CONFIRMED',
      },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * POST /api/cancel
 * Cancels a CONFIRMED booking and restores seats.
 * Prevents double-cancellation (seat inflation bug).
 */
const cancelTicket = async (req, res, next) => {
  const conn = await pool.getConnection();
  try {
    const { booking_id } = req.body;
    const userId = req.user.user_id;

    await conn.beginTransaction();

    // Fetch booking — must belong to user
    const [bookingRows] = await conn.query(
      `SELECT b.booking_id, b.train_id, b.seat_count, b.booking_status, b.pnr_number
       FROM bookings b
       WHERE b.booking_id = ? AND b.user_id = ?
       FOR UPDATE`,
      [booking_id, userId]
    );

    if (bookingRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = bookingRows[0];

    // Safety check: only CONFIRMED bookings can be cancelled
    if (booking.booking_status !== 'CONFIRMED') {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'This booking is already cancelled.',
      });
    }

    // Mark booking as CANCELLED
    await conn.query(
      "UPDATE bookings SET booking_status = 'CANCELLED' WHERE booking_id = ?",
      [booking_id]
    );

    // Restore available seats
    await conn.query(
      'UPDATE trains SET available_seats = available_seats + ? WHERE train_id = ?',
      [booking.seat_count, booking.train_id]
    );

    await conn.commit();

    return res.status(200).json({
      success: true,
      message: `Booking ${booking.pnr_number} cancelled successfully.`,
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

/**
 * GET /api/my-bookings
 * Returns all bookings for the authenticated user with train details.
 */
const myBookings = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const [bookings] = await pool.query(
      `SELECT
        b.booking_id,
        b.pnr_number,
        b.journey_date,
        b.seat_count,
        b.total_amount,
        b.booking_status,
        b.booked_at,
        t.train_name,
        t.source,
        t.destination,
        t.departure_time,
        t.arrival_time,
        GROUP_CONCAT(s.seat_number ORDER BY s.seat_number) AS seat_numbers
      FROM bookings b
      JOIN trains t ON b.train_id = t.train_id
      LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
      LEFT JOIN seats s ON bs.seat_id = s.seat_id
      WHERE b.user_id = ?
      GROUP BY b.booking_id
      ORDER BY b.booked_at DESC`,
      [userId]
    );

    return res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/track/:pnr
 * Tracks a booking by PNR number (public endpoint).
 */
const trackPNR = async (req, res, next) => {
  try {
    const { pnr } = req.params;

    if (!pnr || pnr.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'PNR number is required.' });
    }

    const [rows] = await pool.query(
      `SELECT
         b.booking_id,
         b.pnr_number,
         b.journey_date,
         b.seat_count,
         b.total_amount,
         b.booking_status,
         b.booked_at,
         t.train_name,
         t.source,
         t.destination,
         t.departure_time,
         t.arrival_time,
         u.name AS passenger_name
       FROM bookings b
       JOIN trains t ON b.train_id = t.train_id
       JOIN users u  ON b.user_id  = u.user_id
       WHERE b.pnr_number = ?`,
      [pnr.trim().toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No booking found for this PNR.' });
    }

    return res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
};

const generateTicketPDF = require('../utils/generateTicketPDF');

const downloadTicket = async (req, res, next) => {
  try {
    const { booking_id } = req.params;

    const [rows] = await pool.query(
      `SELECT 
         b.booking_id,
         b.pnr_number,
         b.journey_date,
         b.total_amount,
         b.booking_status,
         t.train_name,
         t.source,
         t.destination,
         t.departure_time,
         t.arrival_time,
         u.name AS passenger_name,
         GROUP_CONCAT(s.seat_number ORDER BY s.seat_number) AS seat_numbers
       FROM bookings b
       JOIN trains t ON b.train_id = t.train_id
       JOIN users u ON b.user_id = u.user_id
       LEFT JOIN booking_seats bs ON b.booking_id = bs.booking_id
       LEFT JOIN seats s ON bs.seat_id = s.seat_id
       WHERE b.booking_id = ?
       GROUP BY b.booking_id`,
      [booking_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    const booking = rows[0];

    generateTicketPDF(res, booking);

  } catch (err) {
    next(err);
  }
};

module.exports = { bookTicket, cancelTicket, myBookings, trackPNR, downloadTicket };
