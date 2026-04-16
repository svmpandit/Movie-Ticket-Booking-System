const state = {
  movies: [],
  selectedMovie: null,
  selectedShow: null,
  selectedSeats: [],
  seats: [],
  showPrice: 0
};

// DOM Elements
const moviesGrid = document.getElementById('moviesGrid');
const selectedMovieTitle = document.getElementById('selectedMovieTitle');
const selectedMovieDescription = document.getElementById('selectedMovieDescription');
const showTimes = document.getElementById('showTimes');
const seatMapSection = document.getElementById('seatMapSection');
const seatMap = document.getElementById('seatMap');
const bookingFormSection = document.getElementById('bookingFormSection');
const selectedSeatsList = document.getElementById('selectedSeatsList');
const ticketCount = document.getElementById('ticketCount');
const totalAmount = document.getElementById('totalAmount');
const selectedCount = document.getElementById('selectedCount');
const totalPrice = document.getElementById('totalPrice');
const bookingForm = document.getElementById('bookingForm');
const customerNameInput = document.getElementById('customerName');
const customerEmailInput = document.getElementById('customerEmail');
const bookingEmailInput = document.getElementById('bookingEmail');
const loadBookingsBtn = document.getElementById('loadBookingsBtn');
const bookingList = document.getElementById('bookingList');
const reviewList = document.getElementById('reviewList');
const reviewFormSection = document.getElementById('reviewFormSection');
const reviewForm = document.getElementById('reviewForm');
const reviewMovieId = document.getElementById('reviewMovieId');
const reviewName = document.getElementById('reviewName');
const reviewRating = document.getElementById('reviewRating');
const reviewComment = document.getElementById('reviewComment');
const closeModalBtn = document.getElementById('closeModalBtn');

// Confirm Modal Logic
let confirmActionCallback = null;
const confirmModal = document.getElementById('confirmModal');
const cancelConfirmBtn = document.getElementById('cancelConfirmBtn');
const confirmActionBtn = document.getElementById('confirmActionBtn');

if (cancelConfirmBtn) {
  cancelConfirmBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    confirmActionCallback = null;
  });
}

if (confirmActionBtn) {
  confirmActionBtn.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
    if (confirmActionCallback) {
      confirmActionCallback();
      confirmActionCallback = null;
    }
  });
}

function showConfirmDialog(callback) {
  confirmActionCallback = callback;
  confirmModal.classList.remove('hidden');
}

// DOM Elements - Pages
const homePage = document.getElementById('homePage');
const moviesPage = document.getElementById('moviesPage');
const showSection = document.getElementById('showSection');
const bookingPage = document.getElementById('bookingPage');

// Nav buttons
const homeBtn = document.getElementById('homeBtn');
const browseBtn = document.getElementById('browseBtn');
const bookingsBtn = document.getElementById('bookingsBtn');
const startBrowsingBtn = document.getElementById('startBrowsingBtn');

// Navigation Functions
function showPage(pageToShow) {
  homePage.classList.add('hidden');
  moviesPage.classList.add('hidden');
  showSection.classList.add('hidden');
  bookingPage.classList.add('hidden');
  
  pageToShow.classList.remove('hidden');
  
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
  
  if (pageToShow === homePage) {
    homeBtn.classList.add('active');
  } else if (pageToShow === moviesPage) {
    browseBtn.classList.add('active');
  } else if (pageToShow === bookingPage) {
    bookingsBtn.classList.add('active');
  }
  
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goToHome() {
  showPage(homePage);
}

function goToMovies() {
  console.log('goToMovies called');
  showPage(moviesPage);
  // Ensure movies are loaded before rendering
  if (state.movies.length === 0) {
    console.log('No movies in state, fetching...');
    fetchMovies().then(() => renderMovies());
  } else {
    console.log('Movies already loaded, rendering...');
    renderMovies();
  }
}

function goToShowSelection(movieId) {
  state.selectedMovie = state.movies.find(movie => movie.id === movieId);
  selectedMovieTitle.textContent = state.selectedMovie.title;
  selectedMovieDescription.textContent = state.selectedMovie.description;
  
  showSection.classList.remove('hidden');
  const modalContent = showSection.querySelector('.modal-content');
  if (modalContent) modalContent.scrollTop = 0;
  
  seatMapSection.classList.add('hidden');
  bookingFormSection.classList.add('hidden');
  reviewFormSection.classList.remove('hidden');
  
  loadReviews(movieId);
  loadShows(movieId);
}

function goToMyBookings() {
  showPage(bookingPage);
  document.getElementById('bookingEmail').focus();
}

// Event listeners for navigation
homeBtn.addEventListener('click', goToHome);
browseBtn.addEventListener('click', goToMovies);
bookingsBtn.addEventListener('click', goToMyBookings);
startBrowsingBtn.addEventListener('click', goToMovies);
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => showSection.classList.add('hidden'));
}
if (showSection) {
  showSection.addEventListener('click', (e) => {
    if (e.target === showSection) {
      showSection.classList.add('hidden');
    }
  });
}

// Fetch and Render Movies
async function fetchMovies() {
  try {
    // Add cache-busting parameter
    const response = await fetch(`/api/movies?t=${Date.now()}`);
    state.movies = await response.json();
    renderFeaturedMovies();
    renderMovies();
  } catch (error) {
    showNotification('Failed to load movies', 'error');
  }
}

function renderFeaturedMovies() {
  const featuredGrid = document.getElementById('featuredGrid');
  if (!featuredGrid) return;
  
  featuredGrid.innerHTML = state.movies.map(movie => `
    <div class="featured-card" data-id="${movie.id}">
      <img src="${movie.poster}" alt="${movie.title}" />
      <div class="featured-card-body">
        <h3>${movie.title}</h3>
        <p>${movie.description}</p>
        <div style="display: flex; gap: 0.5rem; margin-top: auto;">
          <span class="featured-card-badge">${movie.genre}</span>
          <span class="featured-card-badge">⭐ ${movie.average_rating?.toFixed(1) || movie.rating?.toFixed(1) || '4.0'}</span>
        </div>
        <button class="btn btn-primary btn-small" style="width: 100%; margin-top: 1rem;" data-movie-id="${movie.id}">Book Now</button>
      </div>
    </div>
  `).join('');

  featuredGrid.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const movieId = Number(btn.dataset.movieId);
      goToShowSelection(movieId);
    });
  });
}

function renderMovies() {
  console.log('renderMovies called, movies count:', state.movies.length);
  const moviesGrid = document.getElementById('moviesGrid');
  if (!moviesGrid) {
    console.error('moviesGrid element not found');
    return;
  }

  if (state.movies.length === 0) {
    moviesGrid.innerHTML = '<div class="booking-panel" style="text-align: center; grid-column: 1 / -1;"><p>Loading movies...</p></div>';
    return;
  }

  moviesGrid.innerHTML = state.movies.map(movie => `
    <article class="movie-card" data-id="${movie.id}">
      <img src="${movie.poster}" alt="${movie.title}" />
      <div class="movie-body">
        <h3>${movie.title}</h3>
        <p>${movie.description}</p>
        <div class="meta-row">
          <span>${movie.genre}</span>
          <span>${movie.duration}</span>
        </div>
        <div class="meta-row">
          <span class="rating-badge">⭐ ${movie.average_rating?.toFixed(1) || movie.rating?.toFixed(1) || '4.0'}</span>
          <button class="btn btn-primary btn-small bookBtn" data-id="${movie.id}">Book Now</button>
        </div>
      </div>
    </article>
  `).join('');

  console.log('Movies rendered, attaching event listeners');
  document.querySelectorAll('.bookBtn').forEach(btn => {
    btn.addEventListener('click', () => {
      const movieId = Number(btn.dataset.id);
      console.log('Book button clicked for movie ID:', movieId);
      goToShowSelection(movieId);
    });
  });
}

// Load and Display Shows
async function loadShows(movieId) {
  try {
    const response = await fetch(`/api/movies/${movieId}/shows`);
    const shows = await response.json();
    
    if (!shows.length) {
      showTimes.innerHTML = '<div class="booking-panel" style="text-align: center;"><p>No shows available yet for this movie.</p></div>';
      return;
    }

    showTimes.innerHTML = shows.map(show => `
      <div class="show-card" data-show-id="${show.id}">
        <h3>${show.time}</h3>
        <small>${show.date}</small>
        <p style="margin: 0.5rem 0; font-weight: 500; font-size: 0.9rem; color: var(--accent);">${show.cinema_name || 'Main Cinema'}</p>
        <small>${show.screen}</small>
        <div class="price">₹${show.price}</div>
        <button class="btn btn-primary btn-small selectShowBtn" data-show-id="${show.id}">Select</button>
      </div>
    `).join('');

    document.querySelectorAll('.selectShowBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        const showId = Number(btn.dataset.showId);
        state.selectedShow = showId;
        loadSeats(showId);
      });
    });
  } catch (error) {
    showNotification('Failed to load shows', 'error');
  }
}

// Load and Display Seats
async function loadSeats(showId) {
  try {
    const response = await fetch(`/api/shows/${showId}/seats`);
    const data = await response.json();
    state.seats = data.seats;
    state.selectedSeats = [];
    state.showPrice = data.price || 200;
    selectedSeatsList.value = '';
    ticketCount.value = '0';
    totalAmount.value = '₹0';
    selectedCount.textContent = '0';
    totalPrice.textContent = '₹0';
    seatMapSection.classList.remove('hidden');
    bookingFormSection.classList.add('hidden');
    renderSeatMap(data.rows, data.cols);
  } catch (error) {
    showNotification('Failed to load seats', 'error');
  }
}

function renderSeatMap(rows, cols) {
  seatMap.innerHTML = '';
  const rowGroups = Array.from({ length: rows }, (_, rowIndex) => 
    state.seats.filter(seat => seat.row === rowIndex + 1)
  );

  rowGroups.forEach(row => {
    const rowEl = document.createElement('div');
    rowEl.className = 'seat-row';
    
    row.forEach(seat => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'seat';
      button.textContent = `${String.fromCharCode(64 + seat.row)}${seat.col}`;
      
      if (seat.booked) {
        button.classList.add('booked');
        button.disabled = true;
      } else {
        const isSelected = state.selectedSeats.some(s => s.row === seat.row && s.col === seat.col);
        if (isSelected) {
          button.classList.add('selected');
        }
        button.addEventListener('click', () => toggleSeat(seat));
      }
      rowEl.appendChild(button);
    });
    seatMap.appendChild(rowEl);
  });
}

function toggleSeat(seat) {
  const index = state.selectedSeats.findIndex(s => s.row === seat.row && s.col === seat.col);
  
  if (index > -1) {
    // Deselect
    state.selectedSeats.splice(index, 1);
  } else {
    // Select
    state.selectedSeats.push(seat);
  }
  
  updateSeatDisplay();
  renderSeatMap(5, 8);
}

function updateSeatDisplay() {
  const count = state.selectedSeats.length;
  const total = count * state.showPrice;
  const seatLabels = state.selectedSeats
    .map(s => `${String.fromCharCode(64 + s.row)}${s.col}`)
    .join(', ');
  
  selectedSeatsList.value = seatLabels || 'No seats selected';
  ticketCount.value = count;
  totalAmount.value = `₹${total}`;
  selectedCount.textContent = count;
  totalPrice.textContent = `₹${total}`;
  
  if (count > 0) {
    bookingFormSection.classList.remove('hidden');
  } else {
    bookingFormSection.classList.add('hidden');
  }
}

// Book Ticket
bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  
  if (state.selectedSeats.length === 0) {
    showNotification('Please select at least one seat', 'error');
    return;
  }

  const bookings = state.selectedSeats.map(seat => ({
    showId: state.selectedShow,
    row: seat.row,
    col: seat.col,
    customerName: customerNameInput.value.trim(),
    customerEmail: customerEmailInput.value.trim()
  }));

  try {
    let successCount = 0;
    let failedSeats = [];

    for (const booking of bookings) {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking)
      });
      
      if (response.ok) {
        successCount++;
      } else {
        failedSeats.push(`${String.fromCharCode(64 + booking.row)}${booking.col}`);
      }
    }

    if (successCount > 0) {
      showNotification(`✓ ${successCount} ticket(s) booked successfully!`, 'success');
      bookingForm.reset();
      state.selectedSeats = [];
      updateSeatDisplay();
      setTimeout(() => showSection.classList.add('hidden'), 1500);
    } else if (failedSeats.length > 0) {
      showNotification(`Failed to book seats: ${failedSeats.join(', ')}`, 'error');
    }
  } catch (error) {
    showNotification('Booking failed. Please try again.', 'error');
  }
});

// Load Bookings
loadBookingsBtn.addEventListener('click', () => {
  loadBookings(bookingEmailInput.value.trim());
});

async function loadBookings(email) {
  if (!email) {
    showNotification('Please enter your email address', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/bookings?email=${encodeURIComponent(email)}`);
    const bookings = await response.json();
    
    if (!response.ok) {
      throw new Error(bookings.error);
    }

    bookingList.innerHTML = bookings.length ? bookings.map(booking => `
      <article class="booking-card">
        <div>
          <h3>${booking.movie_title}</h3>
          <small>${booking.date} • ${booking.time}</small>
          <div class="booking-details">
            <div class="detail" style="flex: 1.5;">
              <div class="detail-label">Cinema</div>
              <div class="detail-value" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${booking.cinema_name || 'Main Cinema'}">${booking.cinema_name || 'Main Cinema'}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Screen</div>
              <div class="detail-value">${booking.screen}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Seat</div>
              <div class="detail-value">${String.fromCharCode(64 + booking.row)}${booking.col}</div>
            </div>
            <div class="detail">
              <div class="detail-label">Price</div>
              <div class="detail-value">₹${booking.price}</div>
            </div>
          </div>
        </div>
        <button class="btn btn-secondary cancelBookingBtn" data-booking-id="${booking.id}">Cancel Booking</button>
      </article>
    `).join('') : '<div class="booking-panel" style="text-align: center;"><p>No active bookings found.</p></div>';

    document.querySelectorAll('.cancelBookingBtn').forEach(btn => {
      btn.addEventListener('click', () => {
        showConfirmDialog(() => {
          cancelBooking(btn.dataset.bookingId, email);
        });
      });
    });
  } catch (error) {
    showNotification(error.message || 'Failed to load bookings', 'error');
    bookingList.innerHTML = '';
  }
}

// Cancel Booking
async function cancelBooking(bookingId, email) {
  try {
    const response = await fetch(`/api/bookings/${bookingId}?email=${encodeURIComponent(email)}`, {
      method: 'DELETE'
    });
    const result = await response.json();
    
    if (response.ok) {
      showNotification('✓ Booking canceled successfully', 'success');
      loadBookings(email);
    } else {
      showNotification(result.error || 'Failed to cancel booking', 'error');
    }
  } catch (error) {
    showNotification('Cancellation failed. Please try again.', 'error');
  }
}

// Load Reviews
async function loadReviews(movieId) {
  try {
    const response = await fetch(`/api/reviews?movieId=${movieId}`);
    const reviews = await response.json();
    
    reviewList.innerHTML = reviews.length ? reviews.map(review => `
      <article class="review-item">
        <div>
          <h3>${review.customer_name}</h3>
          <small>${'⭐'.repeat(review.rating)} (${review.rating}/5)</small>
          <small>${new Date(review.created_at).toLocaleDateString()}</small>
        </div>
        <p>${review.comment}</p>
      </article>
    `).join('') : '<div class="booking-panel" style="text-align: center;"><p>No reviews yet. Be the first to share your thoughts!</p></div>';
  } catch (error) {
    showNotification('Failed to load reviews', 'error');
  }
}

// Submit Review
reviewForm.addEventListener('submit', async event => {
  event.preventDefault();
  const movieId = Number(reviewMovieId.value);
  
  const payload = {
    movieId,
    customerName: reviewName.value.trim(),
    rating: Number(reviewRating.value),
    comment: reviewComment.value.trim()
  };

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    
    if (response.ok) {
      showNotification('✓ Review submitted successfully', 'success');
      reviewForm.reset();
      loadReviews(movieId);
    } else {
      showNotification(result.error || 'Unable to submit review', 'error');
    }
  } catch (error) {
    showNotification('Review submission failed', 'error');
  }
});

// Notification System
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    z-index: 1000;
    animation: slideIn 0.3s ease;
    font-weight: 500;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize
goToHome();
fetchMovies();
