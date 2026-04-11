# 🎬 Movie Ticket Booking System

A full-stack Database Management System (DBMS) project that allows users to browse movies, view real-time seat availability, book/cancel tickets, and submit feedback. 

## ✨ Features
* **Movie Listings:** Browse currently showing movies with details (genre, duration).
* **Dynamic Seat Matrix:** Visual representation of available, selected, and booked seats.
* **Secure Booking System:** Transaction-safe booking process to prevent double-booking.
* **Ticket Cancellation:** Users can cancel active bookings, freeing up seats in real-time.
* **Customer Feedback:** Users can rate and review movies they have watched.
* **Role-based Access:** (Optional) Admin panel to add new movies and shows.

## 🛠️ Tech Stack
* **Frontend:** HTML/CSS/JavaScript (or React.js)
* **Backend:** Node.js with Express / Python with Flask
* **Database:** MySQL / PostgreSQL

## 🗄️ Database Schema Highlight
The system is built on a normalized relational database. Key relationships include:
* `Shows` are linked to `Movies` (1-to-Many).
* `Seats` are uniquely generated for each `Show` (1-to-Many).
* `Bookings` link `Users`, `Shows`, and specific `Seats` together using Foreign Keys.

## 🚀 Installation & Setup

**1. Clone the repository**
\`\`\`bash
git clone https://github.com/yourusername/movie-booking-dbms.git
cd movie-booking-dbms
\`\`\`

**2. Database Setup**
* Ensure MySQL is installed and running.
* Create a new database named `movie_booking`.
* Run the provided `schema.sql` file in your database to create all necessary tables.

**3. Backend Setup**
\`\`\`bash
cd backend
npm install   # or pip install -r requirements.txt if using Python
# Add your database credentials to the .env file
npm start     # or python app.py
\`\`\`

**4. Frontend Setup**
* Open the `frontend` folder.
* Launch `index.html` in your browser (or run `npm start` if using React).

## 💡 DBMS Concepts Demonstrated
* **ACID Properties:** Ensured during the booking transaction.
* **Concurrency Control:** Handled to prevent two users from booking the same seat.
* **Normalization:** Tables structured to 3NF to eliminate data redundancy.
* **Joins & Subqueries:** Complex SQL queries used to fetch dashboard analytics and available seat matrices.