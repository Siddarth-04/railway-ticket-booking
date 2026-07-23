/**
 * validateMiddleware — Input validation middleware functions.
 * Called before controllers in route definitions.
 * Returns 400 Bad Request with descriptive messages on failure.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{7,15}$/;

/**
 * Sends a 400 validation error response.
 */
const validationError = (res, message) =>
  res.status(400).json({ success: false, message });

// --------------------------------------------------------
// Auth Validators
// --------------------------------------------------------

const validateRegister = (req, res, next) => {
  const { name, email, password, phone } = req.body;

  if (!name || name.trim().length < 2) {
    return validationError(res, 'Name must be at least 2 characters.');
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    return validationError(res, 'Please provide a valid email address.');
  }
  if (!password || password.length < 8) {
    return validationError(res, 'Password must be at least 8 characters.');
  }
  if (!phone || !PHONE_REGEX.test(phone)) {
    return validationError(res, 'Please provide a valid phone number (7-15 digits).');
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !EMAIL_REGEX.test(email)) {
    return validationError(res, 'Please provide a valid email address.');
  }
  if (!password || password.length === 0) {
    return validationError(res, 'Password is required.');
  }

  next();
};

// --------------------------------------------------------
// Train Validators
// --------------------------------------------------------

const validateTrain = (req, res, next) => {
  const {
    train_name, source, destination,
    departure_time, arrival_time,
    total_seats, available_seats, price,
  } = req.body;

  if (!train_name || train_name.trim().length < 2) {
    return validationError(res, 'Train name must be at least 2 characters.');
  }
  if (!source || source.trim().length < 2) {
    return validationError(res, 'Source station is required.');
  }
  if (!destination || destination.trim().length < 2) {
    return validationError(res, 'Destination station is required.');
  }
  if (source.trim().toLowerCase() === destination.trim().toLowerCase()) {
    return validationError(res, 'Source and destination cannot be the same.');
  }
  if (!departure_time || !arrival_time) {
    return validationError(res, 'Departure and arrival times are required.');
  }

  const seats = parseInt(total_seats, 10);
  const avail = parseInt(available_seats, 10);
  const cost  = parseFloat(price);

  if (isNaN(seats) || seats <= 0) {
    return validationError(res, 'Total seats must be a positive number.');
  }
  if (isNaN(avail) || avail < 0 || avail > seats) {
    return validationError(res, 'Available seats must be between 0 and total seats.');
  }
  if (isNaN(cost) || cost <= 0) {
    return validationError(res, 'Price must be a positive number.');
  }

  next();
};

// --------------------------------------------------------
// Booking Validators
// --------------------------------------------------------

const validateBooking = (req, res, next) => {
  const { train_id, journey_date, seat_count } = req.body;

  if (!train_id || isNaN(parseInt(train_id, 10))) {
    return validationError(res, 'A valid train must be selected.');
  }
  if (!journey_date || isNaN(Date.parse(journey_date))) {
    return validationError(res, 'A valid journey date is required (YYYY-MM-DD).');
  }

  // Journey date must not be in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (new Date(journey_date) < today) {
    return validationError(res, 'Journey date cannot be in the past.');
  }

  const seats = parseInt(seat_count, 10);
  if (isNaN(seats) || seats < 1) {
    return validationError(res, 'Seat count must be at least 1.');
  }
  if (seats > 10) {
    return validationError(res, 'Cannot book more than 10 seats in a single booking.');
  }

  next();
};

const validateCancel = (req, res, next) => {
  const { booking_id } = req.body;

  if (!booking_id || isNaN(parseInt(booking_id, 10))) {
    return validationError(res, 'A valid booking ID is required.');
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateTrain,
  validateBooking,
  validateCancel,
};
