# DSP Cinema - MySQL Database Setup Guide

## Overview
This guide provides complete instructions for setting up the DSP Cinema movie booking system with MySQL database instead of SQLite.

## Database Features
- **8 Tables**: users, cinemas, movies, shows, bookings, reviews
- **4 Views**: movie_details, show_details, booking_details
- **4 Functions**: seat availability, booking counts, revenue calculations
- **6 Stored Procedures**: booking management, movie/show operations
- **3 Triggers**: automatic rating updates, double booking prevention
- **Sample Data**: Pre-loaded with movies, shows, cinemas, and reviews

## Prerequisites
- MySQL Server 8.0 or higher
- Node.js 16+ installed
- MySQL Workbench (recommended for database management)

## Installation Steps

### 1. Install MySQL Dependencies
```bash
npm install mysql2
```

### 2. Create MySQL Database
Run the SQL setup script in MySQL:

**Option A: Using MySQL Workbench**
1. Open MySQL Workbench
2. Connect to your MySQL server
3. Open `mysql_database_setup.sql`
4. Execute the entire script

**Option B: Using Command Line**
```bash
mysql -u root -p < mysql_database_setup.sql
```

### 3. Configure Environment Variables
Create a `.env` file in your project root:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dsp_cinema
```

### 4. Update Server Configuration
Replace the SQLite configuration in `server.js` with MySQL:

```javascript
// Remove these lines:
// const sqlite3 = require('sqlite3').verbose();
// const db = new sqlite3.Database(path.join(__dirname, 'movie-booking.db'));

// Add these lines:
const mysql = require('mysql2/promise');
const dbConfig = require('./mysql_config');

// Use the MySQL connection pool
const pool = dbConfig.pool;
```

### 5. Update Database Queries
Replace all SQLite `db.run()`, `db.get()`, `db.all()` calls with MySQL equivalents:

**Example conversions:**
```javascript
// SQLite
db.all('SELECT * FROM movies', (err, rows) => { ... });

// MySQL
const [rows] = await pool.execute('SELECT * FROM movies');
```

## Database Schema

### Tables
- **users**: User accounts and authentication
- **cinemas**: Cinema locations
- **movies**: Movie information
- **shows**: Movie screenings with date/time
- **bookings**: Seat reservations
- **reviews**: User movie reviews

### Views
- **movie_details**: Movies with review statistics
- **show_details**: Shows with movie and cinema info
- **booking_details**: Complete booking information

### Key Features
- **Foreign Key Constraints**: Maintains data integrity
- **Indexes**: Optimized for common queries
- **Triggers**: Automatic rating calculations
- **Stored Procedures**: Complex operations
- **Functions**: Reusable calculations

## API Usage Examples

### Check Seat Availability
```javascript
const available = await pool.execute(
  'SELECT is_seat_available(?, ?, ?) as available',
  [showId, seatRow, seatCol]
);
```

### Create Booking (using stored procedure)
```javascript
const [result] = await pool.execute(
  'CALL create_booking(?, ?, ?, ?, @booking_id, @success, @message)',
  [userId, showId, seatRow, seatCol]
);
```

### Get User Bookings
```javascript
const [bookings] = await pool.execute(
  'CALL get_user_bookings(?)',
  [userId]
);
```

## Backup and Maintenance

### Database Backup
```bash
mysqldump -u root -p dsp_cinema > dsp_cinema_backup.sql
```

### Database Restore
```bash
mysql -u root -p dsp_cinema < dsp_cinema_backup.sql
```

### Performance Optimization
- The database includes proper indexing for common queries
- Use connection pooling for production
- Monitor slow queries and optimize as needed

## Troubleshooting

### Connection Issues
- Verify MySQL server is running
- Check credentials in `.env` file
- Ensure database `dsp_cinema` exists

### Migration Issues
- Backup your SQLite database before migration
- Test all API endpoints after migration
- Check for data type differences between SQLite and MySQL

### Performance Issues
- Use `EXPLAIN` to analyze slow queries
- Consider adding more indexes for specific query patterns
- Monitor connection pool usage

## Security Considerations
- Use environment variables for database credentials
- Implement proper input validation
- Use prepared statements (already implemented)
- Regularly update MySQL server
- Backup database regularly

## Support
For issues with the MySQL setup, check:
1. MySQL error logs
2. Node.js console output
3. Database connection status
4. Query execution plans

The MySQL database provides better performance, scalability, and features compared to SQLite, making it ideal for production use.