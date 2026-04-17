// =============================================
// SQLite to MySQL Migration Script
// =============================================
// This script helps migrate data from existing SQLite database to MySQL
// Run this after setting up the MySQL database

// Note: This is a Node.js script to run the migration
// Save this as migrate_to_mysql.js and run with: node migrate_to_mysql.js

const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
const path = require('path');

// MySQL connection configuration
const mysqlConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dsp_cinema'
};

async function migrateData() {
  let mysqlConnection;
  let sqliteDb;

  try {
    // Connect to MySQL
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connected to MySQL');

    // Connect to SQLite
    sqliteDb = new sqlite3.Database(path.join(__dirname, 'movie-booking.db'));
    console.log('✅ Connected to SQLite');

    // Migrate cinemas
    console.log('📦 Migrating cinemas...');
    const cinemas = await getSQLiteData(sqliteDb, 'SELECT * FROM cinemas');
    for (const cinema of cinemas) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO cinemas (id, name, location) VALUES (?, ?, ?)',
        [cinema.id, cinema.name, cinema.location]
      );
    }
    console.log(`✅ Migrated ${cinemas.length} cinemas`);

    // Migrate users
    console.log('👥 Migrating users...');
    const users = await getSQLiteData(sqliteDb, 'SELECT * FROM users');
    for (const user of users) {
      await mysqlConnection.execute(
        'INSERT IGNORE INTO users (id, username, password, role) VALUES (?, ?, ?, ?)',
        [user.id, user.username, user.password, user.role]
      );
    }
    console.log(`✅ Migrated ${users.length} users`);

    // Migrate movies
    console.log('🎬 Migrating movies...');
    const movies = await getSQLiteData(sqliteDb, 'SELECT * FROM movies');
    for (const movie of movies) {
      await mysqlConnection.execute(
        `INSERT IGNORE INTO movies (id, title, description, genre, duration, poster, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [movie.id, movie.title, movie.description, movie.genre, movie.duration, movie.poster, movie.rating]
      );
    }
    console.log(`✅ Migrated ${movies.length} movies`);

    // Migrate shows
    console.log('🎭 Migrating shows...');
    const shows = await getSQLiteData(sqliteDb, 'SELECT * FROM shows');
    for (const show of shows) {
      await mysqlConnection.execute(
        `INSERT IGNORE INTO shows (id, movie_id, cinema_id, date, time, screen, price)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [show.id, show.movie_id, show.cinema_id || 1, show.date, show.time, show.screen, show.price]
      );
    }
    console.log(`✅ Migrated ${shows.length} shows`);

    // Migrate bookings
    console.log('🎫 Migrating bookings...');
    const bookings = await getSQLiteData(sqliteDb, 'SELECT * FROM bookings');
    for (const booking of bookings) {
      // Skip bookings without user_id (old format)
      if (!booking.user_id) {
        console.log(`⚠️ Skipping booking ${booking.id} - no user_id`);
        continue;
      }
      await mysqlConnection.execute(
        `INSERT IGNORE INTO bookings (id, user_id, show_id, seat_row, seat_col, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [booking.id, booking.user_id, booking.show_id, booking.seat_row, booking.seat_col, booking.created_at]
      );
    }
    console.log(`✅ Migrated ${bookings.filter(b => b.user_id).length} bookings`);

    // Migrate reviews
    console.log('⭐ Migrating reviews...');
    const reviews = await getSQLiteData(sqliteDb, 'SELECT * FROM reviews');
    for (const review of reviews) {
      await mysqlConnection.execute(
        `INSERT IGNORE INTO reviews (id, movie_id, customer_name, rating, comment, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [review.id, review.movie_id, review.customer_name, review.rating, review.comment, review.created_at]
      );
    }
    console.log(`✅ Migrated ${reviews.length} reviews`);

    console.log('🎉 Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    if (mysqlConnection) await mysqlConnection.end();
    if (sqliteDb) sqliteDb.close();
  }
}

function getSQLiteData(db, query) {
  return new Promise((resolve, reject) => {
    db.all(query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };