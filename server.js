const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;
const db = new sqlite3.Database(path.join(__dirname, 'movie-booking.db'));

app.use(bodyParser.json());
app.use(session({
  secret: 'dsp-cinema-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));
app.use(express.static(path.join(__dirname, 'public')));

// Add cache control headers for API routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

function initDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'admin'))
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      genre TEXT,
      duration TEXT,
      poster TEXT,
      rating REAL DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS shows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      cinema_id INTEGER DEFAULT 1,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      screen TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY(movie_id) REFERENCES movies(id),
      FOREIGN KEY(cinema_id) REFERENCES cinemas(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      show_id INTEGER NOT NULL,
      seat_row INTEGER NOT NULL,
      seat_col INTEGER NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(show_id) REFERENCES shows(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(movie_id) REFERENCES movies(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS cinemas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL
    )`);

    // Ensure cinema_id exists on shows for legacy databases
    db.all("PRAGMA table_info(shows)", (err, rows) => {
      if (!err && rows && !rows.some(r => r.name === 'cinema_id')) {
        db.run("ALTER TABLE shows ADD COLUMN cinema_id INTEGER REFERENCES cinemas(id)", () => {
          db.run("UPDATE shows SET cinema_id = 1 WHERE cinema_id IS NULL");
        });
      } else if (!err) {
        // Ensure any newly inserted shows without cinema_id get assigned to 1
        db.run("UPDATE shows SET cinema_id = 1 WHERE cinema_id IS NULL");
      }
    });

    db.get('SELECT COUNT(*) AS count FROM cinemas', (err, row) => {
      if (err || row.count > 0) return;
      db.run('INSERT INTO cinemas (id, name, location) VALUES (1, ?, ?)', ['Main Cinema', 'Mumbai']);
    });

    // Initialize admin user
    db.get('SELECT COUNT(*) AS count FROM users WHERE role = ?', ['admin'], (err, row) => {
      if (err || row.count > 0) return;
      db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', ['admin', '9766', 'admin']);
    });

    db.get('SELECT COUNT(*) AS count FROM movies', (err, row) => {
      if (err || row.count > 0) return;

      const movies = [
        {
          title: 'Jawan',
          description: 'A high-octane action thriller about a young man who takes on corruption and injustice with deadly precision.',
          genre: 'Action',
          duration: '2h 45m',
          poster: 'https://image.tmdb.org/t/p/w500/3h9zMDD0kVBy6cG2bEFTL0PjfyE.jpg',
          rating: 4.4
        },
        {
          title: 'Kalki 2898 AD',
          description: 'A sci-fi epic set in a dystopian future where technology and humanity collide in a fight for survival.',
          genre: 'Sci-Fi',
          duration: '3h 2m',
          poster: 'https://image.tmdb.org/t/p/w500/vdEY2AeYkz2SYIRc5HGIstA6Kn5.jpg',
          rating: 4.1
        },
        {
          title: 'Leo',
          description: 'A gritty action drama following a man whose dangerous past returns to threaten his family.',
          genre: 'Action',
          duration: '2h 42m',
          poster: 'https://image.tmdb.org/t/p/w500/eyWICP2b6a5Rjz9Ab9Gjn81X9jb.jpg',
          rating: 4.2
        },
        {
          title: 'Dunki',
          description: 'A heartfelt comedy-drama about friendship and the journey of immigrants chasing their dreams abroad.',
          genre: 'Drama',
          duration: '2h 40m',
          poster: 'https://image.tmdb.org/t/p/w500/kxFCgGx6HrJSdkyTaubQ8SgZv5p.jpg',
          rating: 4.0
        },
        {
          title: 'Pushpa: The Rule',
          description: 'The continuation of the epic saga of Pushpa Raj, the smuggler who became a legend in the red sandalwood business.',
          genre: 'Action',
          duration: '3h 5m',
          poster: 'https://image.tmdb.org/t/p/w500/34QPEQHnjXLPUYjL6xwBvKQOvKF.jpg',
          rating: 4.3
        },
        {
          title: 'Murder',
          description: 'A psychological thriller about a man who becomes obsessed with solving a murder mystery.',
          genre: 'Thriller',
          duration: '2h 10m',
          poster: 'https://image.tmdb.org/t/p/w500/8QJGZN5rNvXcVQhxTQjOaTJ2rQ.jpg',
          rating: 4.1
        },
        {
          title: 'Amaran',
          description: 'A biographical action drama about the life of Major Mukund Varadarajan, an Indian Army officer.',
          genre: 'Biography',
          duration: '2h 39m',
          poster: 'https://image.tmdb.org/t/p/w500/5W9g9QL3RBFhTxCGar2rJKEAQ.jpg',
          rating: 4.2
        },
        {
          title: 'Raayan',
          description: 'A revenge drama about a man who returns to his village to settle old scores with his enemies.',
          genre: 'Action',
          duration: '2h 27m',
          poster: 'https://image.tmdb.org/t/p/w500/8VjVLMiPmR7R3Vj4P2xL2W3h.jpg',
          rating: 4.0
        }
      ];

      const stmt = db.prepare('INSERT INTO movies (title, description, genre, duration, poster, rating) VALUES (?, ?, ?, ?, ?, ?)');
      movies.forEach(movie => stmt.run(movie.title, movie.description, movie.genre, movie.duration, movie.poster, movie.rating));
      stmt.finalize(() => {
        db.all('SELECT id FROM movies ORDER BY id', (err, rows) => {
          if (err || !rows || rows.length < 8) return;
          db.serialize(() => {
            // Today's shows (2026-04-09)
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[0].id, '2026-04-09', '10:00 AM', 'Screen 1', 220]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[0].id, '2026-04-09', '02:30 PM', 'Screen 2', 240]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[0].id, '2026-04-09', '07:00 PM', 'Screen 1', 260]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[1].id, '2026-04-09', '11:15 AM', 'Screen 3', 230]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[1].id, '2026-04-09', '04:45 PM', 'Screen 4', 250]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[1].id, '2026-04-09', '08:30 PM', 'Screen 3', 270]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[2].id, '2026-04-09', '12:00 PM', 'Screen 2', 225]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[2].id, '2026-04-09', '05:30 PM', 'Screen 1', 245]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[3].id, '2026-04-09', '01:00 PM', 'Screen 4', 215]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[3].id, '2026-04-09', '06:15 PM', 'Screen 3', 235]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[4].id, '2026-04-09', '09:30 AM', 'Screen 1', 240]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[4].id, '2026-04-09', '03:00 PM', 'Screen 2', 260]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[5].id, '2026-04-09', '10:45 AM', 'Screen 4', 220]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[5].id, '2026-04-09', '04:15 PM', 'Screen 3', 240]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[6].id, '2026-04-09', '11:30 AM', 'Screen 2', 230]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[6].id, '2026-04-09', '05:00 PM', 'Screen 1', 250]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[7].id, '2026-04-09', '12:45 PM', 'Screen 3', 225]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[7].id, '2026-04-09', '06:30 PM', 'Screen 4', 245]);

            // Tomorrow's shows (2026-04-10)
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[0].id, '2026-04-10', '11:00 AM', 'Screen 1', 220]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[1].id, '2026-04-10', '02:00 PM', 'Screen 2', 240]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[2].id, '2026-04-10', '04:30 PM', 'Screen 3', 230]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[3].id, '2026-04-10', '07:00 PM', 'Screen 4', 250]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[4].id, '2026-04-10', '10:00 AM', 'Screen 1', 240]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[5].id, '2026-04-10', '01:00 PM', 'Screen 2', 220]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[6].id, '2026-04-10', '03:30 PM', 'Screen 3', 230]);
            db.run('INSERT INTO shows (movie_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?)', [rows[7].id, '2026-04-10', '06:00 PM', 'Screen 4', 250]);
          });
        });
      });
    });
  });
}

function getSeatLayout(rows = 5, cols = 8) {
  const seats = [];
  for (let row = 1; row <= rows; row += 1) {
    for (let col = 1; col <= cols; col += 1) {
      seats.push({ row, col });
    }
  }
  return seats;
}

// Middleware to check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  res.status(401).json({ error: 'Authentication required' });
}

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (req.session.userId && req.session.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
}

// Login route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, user) => {
    if (err) return res.status(500).json({ error: 'Login failed' });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.userId = user.id;
    req.session.username = user.username;
    req.session.role = user.role;

    res.json({ 
      success: true, 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role 
      } 
    });
  });
});

// Logout route
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.json({ success: true });
  });
});

// Register route
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  db.get('SELECT id FROM users WHERE username = ?', [username], (err, existingUser) => {
    if (err) return res.status(500).json({ error: 'Registration failed' });
    if (existingUser) return res.status(409).json({ error: 'Username already exists' });

    db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, password, 'user'], function(err) {
      if (err) return res.status(500).json({ error: 'Failed to create user' });

      // Auto-login after registration
      req.session.userId = this.lastID;
      req.session.username = username;
      req.session.role = 'user';

      res.json({
        success: true,
        user: {
          id: this.lastID,
          username: username,
          role: 'user'
        }
      });
    });
  });
});

// Get current user
app.get('/api/user', (req, res) => {
  if (!req.session.userId) {
    return res.json({ user: null });
  }
  res.json({ 
    user: { 
      id: req.session.userId, 
      username: req.session.username, 
      role: req.session.role 
    } 
  });
});

app.get('/api/movies', (req, res) => {
  db.all(`SELECT movies.*, COUNT(reviews.id) AS review_count,
          IFNULL(ROUND(AVG(reviews.rating),1), movies.rating) AS average_rating
          FROM movies
          LEFT JOIN reviews ON reviews.movie_id = movies.id
          GROUP BY movies.id`, (err, movies) => {
    if (err) return res.status(500).json({ error: 'Failed to load movies' });
    res.json(movies);
  });
});

app.get('/api/cinemas', (req, res) => {
  db.all('SELECT * FROM cinemas ORDER BY name', (err, cinemas) => {
    if (err) return res.status(500).json({ error: 'Failed to load cinemas' });
    res.json(cinemas);
  });
});

app.post('/api/admin/cinemas', requireAdmin, (req, res) => {
  const { name, location } = req.body;
  if (!name || !location) return res.status(400).json({ error: 'Name and location are required.' });
  db.run('INSERT INTO cinemas (name, location) VALUES (?, ?)', [name, location], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to create cinema' });
    res.json({ id: this.lastID, name, location });
  });
});

app.delete('/api/admin/cinemas/:id', requireAdmin, (req, res) => {
  const cinemaId = req.params.id;
  db.run('DELETE FROM cinemas WHERE id = ?', [cinemaId], function(err) {
    if (err) return res.status(500).json({ error: 'Failed to delete cinema' });
    res.json({ deleted: true });
  });
});

app.get('/api/movies/:movieId/shows', (req, res) => {
  db.all(`SELECT shows.*, cinemas.name AS cinema_name, cinemas.location AS cinema_location
          FROM shows 
          LEFT JOIN cinemas ON shows.cinema_id = cinemas.id
          WHERE movie_id = ? ORDER BY shows.date, shows.time`, [req.params.movieId], (err, shows) => {
    if (err) return res.status(500).json({ error: 'Failed to load shows' });
    
    // Filter out past shows
    const now = new Date();
    const futureShows = shows.filter(show => {
      const timeParts = show.time.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!timeParts) return true;
      let hours = parseInt(timeParts[1], 10);
      const minutes = parseInt(timeParts[2], 10);
      const ampm = timeParts[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const showDate = new Date(`${show.date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`);
      return showDate >= now;
    });

    res.json(futureShows);
  });
});

app.get('/api/shows/:showId/seats', (req, res) => {
  const showId = req.params.showId;
  db.get('SELECT price FROM shows WHERE id = ?', [showId], (err, show) => {
    if (err || !show) return res.status(404).json({ error: 'Show not found' });
    
    db.all('SELECT seat_row AS row, seat_col AS col FROM bookings WHERE show_id = ?', [showId], (err, booked) => {
      if (err) return res.status(500).json({ error: 'Failed to load seats' });
      const availableSeats = getSeatLayout().map(seat => ({
        ...seat,
        booked: booked.some(b => b.row === seat.row && b.col === seat.col)
      }));
      res.json({ seats: availableSeats, rows: 5, cols: 8, price: show.price });
    });
  });
});

app.post('/api/bookings', requireAuth, (req, res) => {
  const { showId, row, col } = req.body;
  const userId = req.session.userId;

  if (!showId || !row || !col) {
    return res.status(400).json({ error: 'Show ID, row, and column are required for booking.' });
  }

  db.get('SELECT * FROM bookings WHERE show_id = ? AND seat_row = ? AND seat_col = ?', [showId, row, col], (err, existing) => {
    if (err) return res.status(500).json({ error: 'Booking verification failed.' });
    if (existing) return res.status(409).json({ error: 'Seat already booked.' });

    db.run('INSERT INTO bookings (user_id, show_id, seat_row, seat_col) VALUES (?, ?, ?, ?)',
      [userId, showId, row, col], function (insertErr) {
        if (insertErr) return res.status(500).json({ error: 'Failed to create booking.' });
        res.json({ id: this.lastID, showId, row, col, userId });
      });
  });
});

app.get('/api/bookings', requireAuth, (req, res) => {
  const userId = req.session.userId;

  db.all(`SELECT bookings.id, bookings.show_id, bookings.seat_row AS row, bookings.seat_col AS col,
          bookings.created_at, users.username,
          shows.date, shows.time, shows.screen, shows.price,
          cinemas.name AS cinema_name,
          movies.title AS movie_title
          FROM bookings
          JOIN users ON users.id = bookings.user_id
          JOIN shows ON shows.id = bookings.show_id
          LEFT JOIN cinemas ON shows.cinema_id = cinemas.id
          JOIN movies ON movies.id = shows.movie_id
          WHERE bookings.user_id = ?
          ORDER BY bookings.created_at DESC`, [userId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to load bookings.' });
    res.json(rows);
  });
});

app.delete('/api/bookings/:bookingId', requireAuth, (req, res) => {
  const bookingId = req.params.bookingId;
  const userId = req.session.userId;

  db.run('DELETE FROM bookings WHERE id = ? AND user_id = ?', [bookingId, userId], function (err) {
    if (err) return res.status(500).json({ error: 'Failed to cancel booking.' });
    if (!this.changes) return res.status(404).json({ error: 'Booking not found or does not belong to you.' });
    res.json({ deleted: true });
  });
});

app.get('/api/reviews', (req, res) => {
  const movieId = req.query.movieId;
  if (!movieId) return res.status(400).json({ error: 'movieId query is required.' });
  db.all('SELECT * FROM reviews WHERE movie_id = ? ORDER BY created_at DESC', [movieId], (err, reviews) => {
    if (err) return res.status(500).json({ error: 'Failed to load reviews.' });
    res.json(reviews);
  });
});

app.post('/api/reviews', (req, res) => {
  const { movieId, customerName, rating, comment } = req.body;
  if (!movieId || !customerName || !rating || !comment) {
    return res.status(400).json({ error: 'All review fields are required.' });
  }

  db.run('INSERT INTO reviews (movie_id, customer_name, rating, comment) VALUES (?, ?, ?, ?)',
    [movieId, customerName, rating, comment], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to submit review.' });
      res.json({ id: this.lastID, movieId, customerName, rating, comment });
    });
});

app.post('/api/admin/movies', requireAdmin, (req, res) => {
  const { title, description, genre, duration, poster, rating } = req.body;
  if (!title || !description || !genre || !duration || !poster) {
    return res.status(400).json({ error: 'All movie fields except rating are required.' });
  }

  db.run('INSERT INTO movies (title, description, genre, duration, poster, rating) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, genre, duration, poster, rating || 0], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add movie.' });
      res.json({ id: this.lastID });
    });
});

app.post('/api/admin/movie-with-show', requireAdmin, (req, res) => {
  const { title, description, genre, duration, poster, rating, cinemaId, cinemaIds, date, time, screen, price } = req.body;
  
  // Validate movie fields
  if (!title || !description || !genre || !duration || !poster) {
    return res.status(400).json({ error: 'All movie fields are required.' });
  }
  
  // Validate show fields
  if (!date || !time || !screen || !price) {
    return res.status(400).json({ error: 'All show fields (date, time, screen, price) are required.' });
  }

  // Insert movie and then insert show
  db.run('INSERT INTO movies (title, description, genre, duration, poster, rating) VALUES (?, ?, ?, ?, ?, ?)',
    [title, description, genre, duration, poster, rating || 0], function (err) {
      if (err) return res.status(500).json({ error: 'Failed to add movie.' });
      
      const movieId = this.lastID;
      
      // Now insert the shows for this movie
      const idsToInsert = (cinemaIds && cinemaIds.length) ? cinemaIds : [cinemaId || 1];
      let insertedCount = 0;
      let hasError = false;
      idsToInsert.forEach(cId => {
        db.run('INSERT INTO shows (movie_id, cinema_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?, ?)',
          [movieId, cId, date, time, screen, price], function (showErr) {
            if (showErr) hasError = true;
            insertedCount++;
            if (insertedCount === idsToInsert.length) {
              if (hasError) return res.status(500).json({ error: 'Failed to add some shows.' });
              res.json({ movieId: movieId, addedShows: insertedCount });
            }
          });
      });
    });
});

app.post('/api/admin/shows', requireAdmin, (req, res) => {
  const { movieId, cinemaId, cinemaIds, date, time, screen, price } = req.body;
  if (!movieId || !date || !time || !screen || !price) {
    return res.status(400).json({ error: 'All show fields are required.' });
  }

  const idsToInsert = (cinemaIds && cinemaIds.length) ? cinemaIds : [cinemaId || 1];
  let insertedCount = 0;
  let hasError = false;

  idsToInsert.forEach(cId => {
    db.run('INSERT INTO shows (movie_id, cinema_id, date, time, screen, price) VALUES (?, ?, ?, ?, ?, ?)',
      [movieId, cId, date, time, screen, price], function (err) {
        if (err) hasError = true;
        insertedCount++;
        if (insertedCount === idsToInsert.length) {
          if (hasError) return res.status(500).json({ error: 'Failed to add some shows.' });
          res.json({ addedShows: insertedCount });
        }
      });
  });
});

app.delete('/api/admin/movies/:movieId', requireAdmin, (req, res) => {
  const movieId = req.params.movieId;
  
  // First delete all bookings for shows of this movie
  db.run('DELETE FROM bookings WHERE show_id IN (SELECT id FROM shows WHERE movie_id = ?)', [movieId], function(bookingErr) {
    if (bookingErr) return res.status(500).json({ error: 'Failed to delete bookings.' });
    
    // Then delete all shows for this movie
    db.run('DELETE FROM shows WHERE movie_id = ?', [movieId], function(showErr) {
      if (showErr) return res.status(500).json({ error: 'Failed to delete shows.' });
      
      // Then delete all reviews for this movie
      db.run('DELETE FROM reviews WHERE movie_id = ?', [movieId], function(reviewErr) {
        if (reviewErr) return res.status(500).json({ error: 'Failed to delete reviews.' });
        
        // Finally delete the movie
        db.run('DELETE FROM movies WHERE id = ?', [movieId], function(movieErr) {
          if (movieErr) return res.status(500).json({ error: 'Failed to delete movie.' });
          
          if (this.changes === 0) {
            return res.status(404).json({ error: 'Movie not found.' });
          }
          
          res.json({ deleted: true, message: 'Movie and all associated data deleted successfully.' });
        });
      });
    });
  });
});

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDatabase();

app.listen(PORT, () => {
  console.log(`Movie booking server running on http://localhost:${PORT}`);
});
