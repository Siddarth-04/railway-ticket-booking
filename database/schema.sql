-- =========================================================
-- RailWayPro - Database Schema
-- =========================================================

CREATE DATABASE IF NOT EXISTS railwaydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railwaydb;

-- TABLE: users
CREATE TABLE IF NOT EXISTS users (
    user_id    INT          NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL,
    password   VARCHAR(255) NOT NULL,  -- bcrypt hash
    phone      VARCHAR(20)  NOT NULL,
    role       ENUM('USER', 'ADMIN') NOT NULL DEFAULT 'USER',
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- TABLE: trains

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

-- Performance index for search by source + destination
CREATE INDEX idx_source_dest ON trains (source, destination);


-- TABLE: bookings

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

-- Performance indexes
CREATE INDEX idx_user_id ON bookings (user_id);
CREATE INDEX idx_pnr     ON bookings (pnr_number);

-- SEED DATA

-- Admin user: admin@railwaypro.com / admin123
-- Password hash for 'admin123' (bcrypt salt 10)
INSERT INTO users (name, email, password, phone, role) VALUES (
    'RailWayPro Admin',
    'admin@railwaypro.com',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWC',
    '9000000000',
    'ADMIN'
);

-- Sample trains
INSERT INTO trains (train_name, source, destination, departure_time, arrival_time, total_seats, available_seats, price) VALUES
('Rajdhani Express',    'Delhi',    'Mumbai',      '06:00:00', '22:00:00', 500, 500, 1200.00),
('Shatabdi Express',    'Delhi',    'Chandigarh',  '07:00:00', '10:30:00', 300, 300,  450.00),
('Duronto Express',     'Mumbai',   'Kolkata',     '14:00:00', '08:00:00', 450, 450, 1500.00),
('Garib Rath',          'Delhi',    'Kolkata',     '09:30:00', '04:30:00', 600, 600,  800.00),
('Vande Bharat',        'Chennai',  'Bangalore',   '06:00:00', '10:00:00', 250, 250,  600.00),
('Deccan Queen',        'Mumbai',   'Pune',        '07:15:00', '10:15:00', 350, 350,  200.00),
('Punjab Mail',         'Delhi',    'Amritsar',    '22:00:00', '06:00:00', 400, 400,  550.00),
('Coromandel Express',  'Kolkata',  'Chennai',     '15:00:00', '13:00:00', 500, 500, 1100.00);
