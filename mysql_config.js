// =============================================
// MySQL Database Connection Configuration
// =============================================
// Update your Node.js application to use MySQL instead of SQLite

// 1. Install MySQL dependencies:
// npm install mysql2

// 2. Update your server.js file to use the MySQL configuration below

// 3. Update your database connection in server.js:

const mysql = require('mysql2/promise');

// MySQL connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dsp_cinema',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL database connected successfully');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
  }
}

// Example query functions (replace your SQLite queries with these)

// Get all movies
async function getMovies() {
  try {
    const [rows] = await pool.execute(`
      SELECT id, title, description, genre, duration, poster, average_rating, review_count
      FROM movie_details
      ORDER BY average_rating DESC
    `);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Get shows for a movie
async function getMovieShows(movieId) {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM show_details
      WHERE movie_id = ? AND date >= CURDATE()
      ORDER BY date, time
    `, [movieId]);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Create booking
async function createBooking(userId, showId, seatRow, seatCol) {
  try {
    const [result] = await pool.execute(`
      INSERT INTO bookings (user_id, show_id, seat_row, seat_col)
      VALUES (?, ?, ?, ?)
    `, [userId, showId, seatRow, seatCol]);
    return result.insertId;
  } catch (error) {
    throw error;
  }
}

// Get user bookings
async function getUserBookings(userId) {
  try {
    const [rows] = await pool.execute(`
      SELECT * FROM booking_details
      WHERE user_id = ?
      ORDER BY booking_created_at DESC
    `, [userId]);
    return rows;
  } catch (error) {
    throw error;
  }
}

// Check seat availability
async function checkSeatAvailability(showId, seatRow, seatCol) {
  try {
    const [rows] = await pool.execute(`
      SELECT COUNT(*) as count FROM bookings
      WHERE show_id = ? AND seat_row = ? AND seat_col = ?
    `, [showId, seatRow, seatCol]);
    return rows[0].count === 0;
  } catch (error) {
    throw error;
  }
}

// Export the functions
module.exports = {
  pool,
  testConnection,
  getMovies,
  getMovieShows,
  createBooking,
  getUserBookings,
  checkSeatAvailability
};