-- =============================================
-- DSP Cinema Database Setup for MySQL
-- =============================================
-- This script creates the complete MySQL database for the DSP Cinema movie booking system
-- Run this script in MySQL Workbench, phpMyAdmin, or via command line

-- Create database
CREATE DATABASE IF NOT EXISTS dsp_cinema;
USE dsp_cinema;

-- =============================================
-- TABLES
-- =============================================

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
);

-- Cinemas table
CREATE TABLE cinemas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_location (location)
);

-- Movies table
CREATE TABLE movies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    genre VARCHAR(100),
    duration VARCHAR(20),
    poster VARCHAR(500),
    rating DECIMAL(3,1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_title (title),
    INDEX idx_genre (genre),
    INDEX idx_rating (rating)
);

-- Shows table
CREATE TABLE shows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    cinema_id INT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    screen VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (cinema_id) REFERENCES cinemas(id) ON DELETE CASCADE,
    INDEX idx_movie_id (movie_id),
    INDEX idx_cinema_id (cinema_id),
    INDEX idx_date (date),
    INDEX idx_datetime (date, time),
    INDEX idx_movie_date (movie_id, date)
);

-- Bookings table
CREATE TABLE bookings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    show_id INT NOT NULL,
    seat_row INT NOT NULL,
    seat_col INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (show_id) REFERENCES shows(id) ON DELETE CASCADE,
    UNIQUE KEY unique_seat_booking (show_id, seat_row, seat_col),
    INDEX idx_user_id (user_id),
    INDEX idx_show_id (show_id),
    INDEX idx_created_at (created_at)
);

-- Reviews table
CREATE TABLE reviews (
    id INT PRIMARY KEY AUTO_INCREMENT,
    movie_id INT NOT NULL,
    user_id INT,
    customer_name VARCHAR(100),
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_movie_id (movie_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating),
    INDEX idx_created_at (created_at)
);

-- =============================================
-- VIEWS
-- =============================================

-- View for movie details with review statistics
CREATE OR REPLACE VIEW movie_details AS
SELECT
    m.id,
    m.title,
    m.description,
    m.genre,
    m.duration,
    m.poster,
    m.rating as initial_rating,
    COALESCE(ROUND(AVG(r.rating), 1), m.rating) as average_rating,
    COUNT(r.id) as review_count,
    m.created_at,
    m.updated_at
FROM movies m
LEFT JOIN reviews r ON m.id = r.movie_id
GROUP BY m.id, m.title, m.description, m.genre, m.duration, m.poster, m.rating, m.created_at, m.updated_at;

-- View for show details with movie and cinema info
CREATE OR REPLACE VIEW show_details AS
SELECT
    s.id,
    s.movie_id,
    s.cinema_id,
    s.date,
    s.time,
    s.screen,
    s.price,
    m.title as movie_title,
    m.genre as movie_genre,
    m.duration as movie_duration,
    m.poster as movie_poster,
    c.name as cinema_name,
    c.location as cinema_location,
    s.created_at,
    s.updated_at
FROM shows s
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id;

-- View for booking details
CREATE OR REPLACE VIEW booking_details AS
SELECT
    b.id,
    b.user_id,
    b.show_id,
    b.seat_row,
    b.seat_col,
    b.created_at as booking_created_at,
    u.username,
    s.date,
    s.time,
    s.screen,
    s.price,
    m.title as movie_title,
    m.genre as movie_genre,
    c.name as cinema_name,
    c.location as cinema_location
FROM bookings b
JOIN users u ON b.user_id = u.id
JOIN shows s ON b.show_id = s.id
JOIN movies m ON s.movie_id = m.id
JOIN cinemas c ON s.cinema_id = c.id;

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to check if a seat is available
DELIMITER //

CREATE FUNCTION is_seat_available(show_id_param INT, seat_row_param INT, seat_col_param INT)
RETURNS BOOLEAN
DETERMINISTIC
BEGIN
    DECLARE seat_count INT;
    SELECT COUNT(*) INTO seat_count
    FROM bookings
    WHERE show_id = show_id_param
      AND seat_row = seat_row_param
      AND seat_col = seat_col_param;
    RETURN seat_count = 0;
END //

-- Function to get total bookings for a show
CREATE FUNCTION get_show_booking_count(show_id_param INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE booking_count INT;
    SELECT COUNT(*) INTO booking_count
    FROM bookings
    WHERE show_id = show_id_param;
    RETURN booking_count;
END //

-- Function to calculate total revenue for a show
CREATE FUNCTION get_show_revenue(show_id_param INT)
RETURNS DECIMAL(10,2)
DETERMINISTIC
BEGIN
    DECLARE total_revenue DECIMAL(10,2);
    SELECT COALESCE(SUM(s.price), 0) INTO total_revenue
    FROM bookings b
    JOIN shows s ON b.show_id = s.id
    WHERE b.show_id = show_id_param;
    RETURN total_revenue;
END //

-- Function to get user booking count
CREATE FUNCTION get_user_booking_count(user_id_param INT)
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE booking_count INT;
    SELECT COUNT(*) INTO booking_count
    FROM bookings
    WHERE user_id = user_id_param;
    RETURN booking_count;
END //

DELIMITER ;

-- =============================================
-- STORED PROCEDURES
-- =============================================

DELIMITER //

-- Procedure to create a new booking
CREATE PROCEDURE create_booking(
    IN user_id_param INT,
    IN show_id_param INT,
    IN seat_row_param INT,
    IN seat_col_param INT,
    OUT booking_id INT,
    OUT success BOOLEAN,
    OUT message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET success = FALSE;
        SET message = 'An error occurred while creating the booking';
        SET booking_id = NULL;
    END;

    -- Check if seat is available
    IF NOT is_seat_available(show_id_param, seat_row_param, seat_col_param) THEN
        SET success = FALSE;
        SET message = 'Seat is already booked';
        SET booking_id = NULL;
    ELSE
        -- Create the booking
        INSERT INTO bookings (user_id, show_id, seat_row, seat_col)
        VALUES (user_id_param, show_id_param, seat_row_param, seat_col_param);

        SET booking_id = LAST_INSERT_ID();
        SET success = TRUE;
        SET message = 'Booking created successfully';
    END IF;
END //

-- Procedure to cancel a booking
CREATE PROCEDURE cancel_booking(
    IN booking_id_param INT,
    IN user_id_param INT,
    OUT success BOOLEAN,
    OUT message VARCHAR(255)
)
BEGIN
    DECLARE affected_rows INT;

    -- Try to delete the booking (only if it belongs to the user)
    DELETE FROM bookings
    WHERE id = booking_id_param AND user_id = user_id_param;

    SET affected_rows = ROW_COUNT();

    IF affected_rows > 0 THEN
        SET success = TRUE;
        SET message = 'Booking cancelled successfully';
    ELSE
        SET success = FALSE;
        SET message = 'Booking not found or does not belong to you';
    END IF;
END //

-- Procedure to add a new movie with shows
CREATE PROCEDURE add_movie_with_shows(
    IN title_param VARCHAR(255),
    IN description_param TEXT,
    IN genre_param VARCHAR(100),
    IN duration_param VARCHAR(20),
    IN poster_param VARCHAR(500),
    IN rating_param DECIMAL(3,1),
    IN cinema_id_param INT,
    IN show_date_param DATE,
    IN show_time_param TIME,
    IN show_screen_param VARCHAR(50),
    IN show_price_param DECIMAL(10,2),
    OUT movie_id INT,
    OUT success BOOLEAN,
    OUT message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET success = FALSE;
        SET message = 'An error occurred while adding the movie';
        SET movie_id = NULL;
    END;

    -- Insert movie
    INSERT INTO movies (title, description, genre, duration, poster, rating)
    VALUES (title_param, description_param, genre_param, duration_param, poster_param, rating_param);

    SET movie_id = LAST_INSERT_ID();

    -- Insert show
    INSERT INTO shows (movie_id, cinema_id, date, time, screen, price)
    VALUES (movie_id, cinema_id_param, show_date_param, show_time_param, show_screen_param, show_price_param);

    SET success = TRUE;
    SET message = 'Movie and show added successfully';
END //

-- Procedure to add a show to existing movie
CREATE PROCEDURE add_show_to_movie(
    IN movie_id_param INT,
    IN cinema_id_param INT,
    IN show_date_param DATE,
    IN show_time_param TIME,
    IN show_screen_param VARCHAR(50),
    IN show_price_param DECIMAL(10,2),
    OUT show_id INT,
    OUT success BOOLEAN,
    OUT message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET success = FALSE;
        SET message = 'An error occurred while adding the show';
        SET show_id = NULL;
    END;

    -- Check if movie exists
    IF NOT EXISTS (SELECT 1 FROM movies WHERE id = movie_id_param) THEN
        SET success = FALSE;
        SET message = 'Movie not found';
        SET show_id = NULL;
    ELSE
        -- Insert show
        INSERT INTO shows (movie_id, cinema_id, date, time, screen, price)
        VALUES (movie_id_param, cinema_id_param, show_date_param, show_time_param, show_screen_param, show_price_param);

        SET show_id = LAST_INSERT_ID();
        SET success = TRUE;
        SET message = 'Show added successfully';
    END IF;
END //

-- Procedure to get available seats for a show
CREATE PROCEDURE get_available_seats(
    IN show_id_param INT,
    IN rows_param INT,
    IN cols_param INT
)
BEGIN
    -- Create a temporary table with all possible seats
    CREATE TEMPORARY TABLE all_seats (
        seat_row INT,
        seat_col INT,
        booked BOOLEAN DEFAULT FALSE
    );

    -- Insert all possible seats
    SET @row = 1;
    SET @col = 1;
    WHILE @row <= rows_param DO
        SET @col = 1;
        WHILE @col <= cols_param DO
            INSERT INTO all_seats (seat_row, seat_col) VALUES (@row, @col);
            SET @col = @col + 1;
        END WHILE;
        SET @row = @row + 1;
    END WHILE;

    -- Mark booked seats
    UPDATE all_seats a
    JOIN bookings b ON a.seat_row = b.seat_row AND a.seat_col = b.seat_col
    SET a.booked = TRUE
    WHERE b.show_id = show_id_param;

    -- Return the result
    SELECT seat_row, seat_col, booked FROM all_seats ORDER BY seat_row, seat_col;

    -- Clean up
    DROP TEMPORARY TABLE all_seats;
END //

-- Procedure to get user bookings
CREATE PROCEDURE get_user_bookings(IN user_id_param INT)
BEGIN
    SELECT
        b.id,
        b.show_id,
        b.seat_row,
        b.seat_col,
        b.created_at,
        s.date,
        s.time,
        s.screen,
        s.price,
        m.title as movie_title,
        m.genre as movie_genre,
        c.name as cinema_name,
        c.location as cinema_location
    FROM bookings b
    JOIN shows s ON b.show_id = s.id
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    WHERE b.user_id = user_id_param
    ORDER BY b.created_at DESC;
END //

-- Procedure to get show statistics
CREATE PROCEDURE get_show_statistics(IN show_id_param INT)
BEGIN
    SELECT
        s.id,
        s.date,
        s.time,
        s.screen,
        s.price,
        m.title as movie_title,
        c.name as cinema_name,
        COUNT(b.id) as booked_seats,
        (COUNT(b.id) * s.price) as total_revenue
    FROM shows s
    JOIN movies m ON s.movie_id = m.id
    JOIN cinemas c ON s.cinema_id = c.id
    LEFT JOIN bookings b ON s.id = b.show_id
    WHERE s.id = show_id_param
    GROUP BY s.id, s.date, s.time, s.screen, s.price, m.title, c.name;
END //

DELIMITER ;

-- =============================================
-- TRIGGERS
-- =============================================

DELIMITER //

-- Trigger to update movie rating when reviews are added/updated
CREATE TRIGGER update_movie_rating_after_review
AFTER INSERT ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating), 1), 0)
        FROM reviews
        WHERE movie_id = NEW.movie_id
    )
    WHERE id = NEW.movie_id;
END //

CREATE TRIGGER update_movie_rating_after_review_update
AFTER UPDATE ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating), 1), 0)
        FROM reviews
        WHERE movie_id = NEW.movie_id
    )
    WHERE id = NEW.movie_id;
END //

CREATE TRIGGER update_movie_rating_after_review_delete
AFTER DELETE ON reviews
FOR EACH ROW
BEGIN
    UPDATE movies
    SET rating = (
        SELECT COALESCE(ROUND(AVG(rating), 1), 0)
        FROM reviews
        WHERE movie_id = OLD.movie_id
    )
    WHERE id = OLD.movie_id;
END //

-- Trigger to prevent double booking
CREATE TRIGGER prevent_double_booking
BEFORE INSERT ON bookings
FOR EACH ROW
BEGIN
    DECLARE seat_count INT;
    SELECT COUNT(*) INTO seat_count
    FROM bookings
    WHERE show_id = NEW.show_id
      AND seat_row = NEW.seat_row
      AND seat_col = NEW.seat_col;

    IF seat_count > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Seat is already booked';
    END IF;
END //

DELIMITER ;

-- =============================================
-- INITIAL DATA
-- =============================================

-- Insert admin user
INSERT INTO users (username, password, role) VALUES
('admin', '9766', 'admin');

-- Insert cinemas
INSERT INTO cinemas (name, location) VALUES
('Main Cinema', 'Mumbai'),
('City Center Cinema', 'Delhi'),
('Metro Cinema', 'Bangalore'),
('Royal Cinema', 'Chennai');

-- Insert movies
INSERT INTO movies (title, description, genre, duration, poster, rating) VALUES
('Jawan', 'A high-octane action thriller about a young man who takes on corruption and injustice with deadly precision.', 'Action', '2h 45m', 'https://image.tmdb.org/t/p/w500/3h9zMDD0kVBy6cG2bEFTL0PjfyE.jpg', 4.4),
('Kalki 2898 AD', 'A sci-fi epic set in a dystopian future where technology and humanity collide in a fight for survival.', 'Sci-Fi', '3h 2m', 'https://image.tmdb.org/t/p/w500/vdEY2AeYkz2SYIRc5HGIstA6Kn5.jpg', 4.1),
('Leo', 'A gritty action drama following a man whose dangerous past returns to threaten his family.', 'Action', '2h 42m', 'https://image.tmdb.org/t/p/w500/eyWICP2b6a5Rjz9Ab9Gjn81X9jb.jpg', 4.2),
('Dunki', 'A heartfelt comedy-drama about friendship and the journey of immigrants chasing their dreams abroad.', 'Drama', '2h 40m', 'https://image.tmdb.org/t/p/w500/kxFCgGx6HrJSdkyTaubQ8SgZv5p.jpg', 4.0),
('Pushpa: The Rule', 'The continuation of the epic saga of Pushpa Raj, the smuggler who became a legend in the red sandalwood business.', 'Action', '3h 5m', 'https://image.tmdb.org/t/p/w500/34QPEQHnjXLPUYjL6xwBvKQOvKF.jpg', 4.3),
('Murder', 'A psychological thriller about a man who becomes obsessed with solving a murder mystery.', 'Thriller', '2h 10m', 'https://image.tmdb.org/t/p/w500/8QJGZN5rNvXcVQhxTQjOaTJ2rQ.jpg', 4.1),
('Amaran', 'A biographical action drama about the life of Major Mukund Varadarajan, an Indian Army officer.', 'Biography', '2h 39m', 'https://image.tmdb.org/t/p/w500/5W9g9QL3RBFhTxCGar2rJKEAQ.jpg', 4.2),
('Raayan', 'A revenge drama about a man who returns to his village to settle old scores with his enemies.', 'Action', '2h 27m', 'https://image.tmdb.org/t/p/w500/8VjVLMiPmR7R3Vj4P2xL2W3h.jpg', 4.0);

-- Insert shows for today (2026-04-17)
INSERT INTO shows (movie_id, cinema_id, date, time, screen, price) VALUES
-- Jawan shows
(1, 1, '2026-04-17', '10:00:00', 'Screen 1', 220.00),
(1, 1, '2026-04-17', '14:30:00', 'Screen 2', 240.00),
(1, 1, '2026-04-17', '19:00:00', 'Screen 1', 260.00),
-- Kalki shows
(2, 2, '2026-04-17', '11:15:00', 'Screen 3', 230.00),
(2, 2, '2026-04-17', '16:45:00', 'Screen 4', 250.00),
(2, 2, '2026-04-17', '20:30:00', 'Screen 3', 270.00),
-- Leo shows
(3, 1, '2026-04-17', '12:00:00', 'Screen 2', 225.00),
(3, 1, '2026-04-17', '17:30:00', 'Screen 1', 245.00),
-- Dunki shows
(4, 3, '2026-04-17', '13:00:00', 'Screen 4', 215.00),
(4, 3, '2026-04-17', '18:15:00', 'Screen 3', 235.00),
-- Pushpa shows
(5, 1, '2026-04-17', '09:30:00', 'Screen 1', 240.00),
(5, 1, '2026-04-17', '15:00:00', 'Screen 2', 260.00),
-- Murder shows
(6, 4, '2026-04-17', '10:45:00', 'Screen 4', 220.00),
(6, 4, '2026-04-17', '16:15:00', 'Screen 3', 240.00),
-- Amaran shows
(7, 2, '2026-04-17', '11:30:00', 'Screen 2', 230.00),
(7, 2, '2026-04-17', '17:00:00', 'Screen 1', 250.00),
-- Raayan shows
(8, 3, '2026-04-17', '12:45:00', 'Screen 3', 225.00),
(8, 3, '2026-04-17', '18:30:00', 'Screen 4', 245.00);

-- Insert shows for tomorrow (2026-04-18)
INSERT INTO shows (movie_id, cinema_id, date, time, screen, price) VALUES
(1, 1, '2026-04-18', '11:00:00', 'Screen 1', 220.00),
(2, 2, '2026-04-18', '14:00:00', 'Screen 2', 240.00),
(3, 3, '2026-04-18', '16:30:00', 'Screen 3', 230.00),
(4, 4, '2026-04-18', '19:00:00', 'Screen 4', 250.00),
(5, 1, '2026-04-18', '10:00:00', 'Screen 1', 240.00),
(6, 2, '2026-04-18', '13:00:00', 'Screen 2', 220.00),
(7, 3, '2026-04-18', '15:30:00', 'Screen 3', 230.00),
(8, 4, '2026-04-18', '18:00:00', 'Screen 4', 250.00);

-- Insert some sample reviews
INSERT INTO reviews (movie_id, customer_name, rating, comment) VALUES
(1, 'Rajesh Kumar', 5, 'Amazing action sequences! Shah Rukh Khan was brilliant.'),
(1, 'Priya Sharma', 4, 'Great movie, loved the story and performances.'),
(2, 'Amit Singh', 5, 'Mind-blowing visuals and concept. A must-watch!'),
(2, 'Sneha Patel', 4, 'Good sci-fi movie with deep philosophical themes.'),
(3, 'Vijay Joshi', 4, 'Leo delivers on action and emotions.'),
(4, 'Meera Nair', 5, 'Beautiful story about friendship and dreams.'),
(5, 'Rohan Gupta', 5, 'Pushpa is back with more intensity!'),
(6, 'Kavita Reddy', 4, 'Intriguing thriller with unexpected twists.');

-- =============================================
-- USEFUL QUERIES AND REPORTS
-- =============================================

-- Sample queries for reporting (uncomment to use)

-- Get daily revenue report
-- SELECT DATE(created_at) as booking_date, COUNT(*) as total_bookings, SUM(price) as total_revenue
-- FROM booking_details
-- GROUP BY DATE(created_at)
-- ORDER BY booking_date DESC;

-- Get movie popularity report
-- SELECT movie_title, COUNT(*) as total_bookings, SUM(price) as total_revenue
-- FROM booking_details
-- GROUP BY movie_title
-- ORDER BY total_bookings DESC;

-- Get cinema performance report
-- SELECT cinema_name, COUNT(*) as total_bookings, SUM(price) as total_revenue
-- FROM booking_details
-- GROUP BY cinema_name
-- ORDER BY total_revenue DESC;

-- Get user activity report
-- SELECT u.username, COUNT(b.id) as total_bookings, SUM(s.price) as total_spent
-- FROM users u
-- LEFT JOIN bookings b ON u.id = b.user_id
-- LEFT JOIN shows s ON b.show_id = s.id
-- GROUP BY u.id, u.username
-- ORDER BY total_bookings DESC;

-- =============================================
-- SETUP COMPLETE
-- =============================================

SELECT 'DSP Cinema MySQL Database Setup Complete!' as Status;