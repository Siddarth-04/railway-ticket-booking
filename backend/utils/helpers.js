/**
 * helpers.js — Utility functions for RailWayPro
 */
const pool = require('../config/db');

/**
 * Generates a random alphanumeric PNR string.
 * @param {number} length - Length of PNR (default 10)
 * @returns {string}
 */
function generatePNR(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let pnr = '';
  for (let i = 0; i < length; i++) {
    pnr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pnr;
}

/**
 * Generates a PNR that is guaranteed to be unique in the DB.
 * Retries up to 5 times on collision (extremely rare with 10-char PNR).
 * Also protected at DB level by UNIQUE constraint on pnr_number.
 * @returns {Promise<string>}
 */
async function generateUniquePNR() {
  const maxRetries = 5;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const pnr = generatePNR(10);
    const [rows] = await pool.query(
      'SELECT booking_id FROM bookings WHERE pnr_number = ?',
      [pnr]
    );
    if (rows.length === 0) return pnr;
  }
  throw new Error('Failed to generate unique PNR after multiple attempts');
}

module.exports = { generatePNR, generateUniquePNR };
