const pool = require('./db');

/**
 * Initializes database tables and seed data if they do not exist.
 */
async function initDb() {
  try {
    // Check if trains table exists
    const [tables] = await pool.query("SHOW TABLES LIKE 'trains'");
    if (tables.length > 0) {
      console.log('✅ Database tables already exist.');
      return;
    }

    console.log('🔄 First-time setup: Creating database tables...');

    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id    INT          NOT NULL AUTO_INCREMENT,
        name       VARCHAR(100) NOT NULL,
        email      VARCHAR(150) NOT NULL,
        password   VARCHAR(255) NOT NULL,
        phone      VARCHAR(20)  NOT NULL,
        role       ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
        created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id),
        UNIQUE KEY uq_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create trains table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trains (
        train_id         INT            NOT NULL AUTO_INCREMENT,
        train_name       VARCHAR(150)   NOT NULL,
        source           VARCHAR(100)   NOT NULL,
        destination      VARCHAR(100)   NOT NULL,
        departure_time   TIME           NOT NULL,
        arrival_time     TIME           NOT NULL,
        total_seats      INT            NOT NULL CHECK (total_seats > 0),
        available_seats  INT            NOT NULL CHECK (available_seats >= 0),
        price            DECIMAL(10, 2) NOT NULL CHECK (price > 0),
        created_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (train_id),
        CONSTRAINT chk_available CHECK (available_seats <= total_seats)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Create bookings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        booking_id      INT            NOT NULL AUTO_INCREMENT,
        user_id         INT            NOT NULL,
        train_id        INT            NOT NULL,
        journey_date    DATE           NOT NULL,
        seat_count      INT            NOT NULL CHECK (seat_count > 0),
        total_amount    DECIMAL(10, 2) NOT NULL,
        pnr_number      VARCHAR(20)    NOT NULL,
        booking_status  ENUM('CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
        booked_at       TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (booking_id),
        UNIQUE KEY uq_pnr (pnr_number),
        CONSTRAINT fk_booking_user  FOREIGN KEY (user_id)  REFERENCES users (user_id)  ON DELETE CASCADE,
        CONSTRAINT fk_booking_train FOREIGN KEY (train_id) REFERENCES trains (train_id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed Admin user (admin@railwaypro.com / admin123)
    await pool.query(`
      INSERT IGNORE INTO users (name, email, password, phone, role) VALUES (
        'RailWayPro Admin',
        'admin@railwaypro.com',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWC',
        '9000000000',
        'ADMIN'
      );
    `);

    // Seed sample trains
    await pool.query(`
      INSERT INTO trains (train_name, source, destination, departure_time, arrival_time, total_seats, available_seats, price) VALUES
      ('Rajdhani Express',    'Delhi',    'Mumbai',      '06:00:00', '22:00:00', 500, 500, 1200.00),
      ('Shatabdi Express',    'Delhi',    'Chandigarh',  '07:00:00', '10:30:00', 300, 300,  450.00),
      ('Duronto Express',     'Mumbai',   'Kolkata',     '14:00:00', '08:00:00', 450, 450, 1500.00),
      ('Garib Rath',          'Delhi',    'Kolkata',     '09:30:00', '04:30:00', 600, 600,  800.00),
      ('Vande Bharat',        'Chennai',  'Bangalore',   '06:00:00', '10:00:00', 250, 250,  600.00),
      ('Deccan Queen',        'Mumbai',   'Pune',        '07:15:00', '10:15:00', 350, 350,  200.00),
      ('Punjab Mail',         'Delhi',    'Amritsar',    '22:00:00', '06:00:00', 400, 400,  550.00),
      ('Coromandel Express',  'Kolkata',  'Chennai',     '15:00:00', '13:00:00', 500, 500, 1100.00);
    `);

    console.log('✅ First-time database setup completed successfully!');
  } catch (err) {
    console.error('⚠️ Database auto-initialization error:', err.message);
  }
}

module.exports = initDb;
