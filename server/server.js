require("dotenv").config();
const { types } = require("pg");
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

//MINUS 1 SOLUTION SA DATE
types.setTypeParser(1082, (val) => val);

const app = express();

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// FOR STATUS CALCULATION OF EVENTS BASED ON DATE AND TIME
const calculateEventStatus = (event) => {
  // Kung mano-manong kinansela ng admin, panatilihin ang 'Cancelled'
  if (event.status === "Cancelled") {
    return "Cancelled";
  }

  if (!event.event_date || !event.start_time || !event.end_time) {
    return event.status || "Upcoming";
  }

  const now = new Date();
  
  // DATE STRING LANFG PARA SA PAGKUMPARA NG DATE
  const eventDateStr = String(event.event_date).substring(0, 10);
  
  const startDateTime = new Date(`${eventDateStr}T${event.start_time}`);
  const endDateTime = new Date(`${eventDateStr}T${event.end_time}`);

  if (now < startDateTime) {
    return "Upcoming";
  } else if (now >= startDateTime && now <= endDateTime) {
    return "Ongoing";
  } else {
    return "Completed";
  }
};

// ROOT TEST ROUTE
app.get("/", (req, res) => {
  res.json({
    message: "Event Management API is running!",
  });
});

// DATABASE CONNECTION TEST ROUTE
app.get("/api/db-test", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT current_database() AS database"
    );

    res.json({
      message: "PostgreSQL connected successfully!",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      message: "Database connection failed.",
    });
  }
});

// DASHBOARD STATS
app.get("/api/dashboard/stats", async (req, res) => {
  try {
    const usersResult = await pool.query(
      "SELECT COUNT(*)::int AS total_users FROM users"
    );

    const eventsResult = await pool.query(
      "SELECT COUNT(*)::int AS total_events FROM events"
    );

    const bookingsResult = await pool.query(
      "SELECT COUNT(*)::int AS total_bookings FROM bookings"
    );

    res.json({
      totalUsers: usersResult.rows[0].total_users,
      totalEvents: eventsResult.rows[0].total_events,
      totalBookings: bookingsResult.rows[0].total_bookings,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error.message);
    res.status(500).json({
      message: "Failed to load dashboard statistics.",
    });
  }
});


// LIST OF USERS
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, role, school_id, 
              CONCAT(first_name, ' ', last_name) AS full_name 
       FROM users ORDER BY id DESC`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users." });
  }
});

// REGISTER NEW USER
app.post("/api/auth/register", async (req, res) => {
  try {
    const { first_name, last_name, school_id, email, password } = req.body;

    if (!first_name || !last_name || !school_id || !email || !password) {
      return res.status(400).json({ message: "Please complete all required fields." });
    }

    const userCheck = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR school_id = $2",
      [email, school_id]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ message: "Email or School ID is already registered." });
    }

    const newUser = await pool.query(
      `INSERT INTO users (first_name, last_name, school_id, email, password_hash, role) 
       VALUES ($1, $2, $3, $4, $5, 'User') 
       RETURNING id, first_name, last_name, school_id, email, role`,
      [first_name, last_name, school_id, email, password]
    );

    return res.status(201).json({
      message: "Account created successfully!",
      user: newUser.rows[0],
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Failed to register account." });
  }
});

// ROLE VALIDATION DURING LOGIN
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const user = userResult.rows[0];

    if (user.password_hash !== password) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (role && user.role !== role) {
      return res.status(400).json({ 
        message: `Access denied. This account is not registered as an ${role}.` 
      });
    }

    return res.json({
      message: "Login successful!",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Failed to log in." });
  }
});


// STATUS CALCULATION FOR EVENTS
app.get("/api/events", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM events ORDER BY id DESC");
    
    const eventsWithDynamicStatus = result.rows.map(event => ({
      ...event,
      status: calculateEventStatus(event)
    }));

    res.json(eventsWithDynamicStatus);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ message: "Failed to fetch events." });
  }
});

// EVENT CREATION
app.post("/api/events", async (req, res) => {
  try {
    const { title, event_date, start_time, end_time, location, capacity } = req.body;
    
    console.log("Data received from the frontend:", req.body);

    // UPCOMING DEFAULT STATUS
    const defaultStatus = "Upcoming";

    const result = await pool.query(
      `INSERT INTO events (title, event_date, start_time, end_time, location, capacity, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, event_date, start_time, end_time, location, capacity, defaultStatus]
    );

    const newEvent = {
      ...result.rows[0],
      status: calculateEventStatus(result.rows[0])
    };

    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Error creating event:", error);
    res.status(500).json({ message: "Failed to create event." });
  }
});

// GET BOOKINGS
app.get("/api/bookings", async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = "SELECT * FROM bookings";
    let params = [];

    if (user_id) {
      query += " WHERE user_id = $1 ORDER BY booking_id DESC";
      params.push(user_id);
    } else {
      query += " ORDER BY booking_id DESC";
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

// SAVE NEW BOOKING
app.post("/api/bookings", async (req, res) => {
  try {
    const { user_id, event_title, building_name, event_date, start_time, end_time } = req.body;
    
    if (!user_id) {
      return res.status(400).json({ message: "User ID is required for booking." });
    }

    const result = await pool.query(
      `INSERT INTO bookings (user_id, event_title, building_name, event_date, start_time, end_time, status) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [user_id, event_title, building_name, event_date, start_time, end_time, 'Pending']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "Failed to create booking." });
  }
});

// STATUS UPDATE FOR BOOKINGS
app.put("/api/bookings/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await pool.query(
      `UPDATE bookings SET status = $1 WHERE booking_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ message: "Failed to update booking status." });
  }
});

// CANCEL OR RESTORE EVENT STATUS
app.put("/api/events/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["Upcoming", "Cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Only 'Cancelled' is allowed for manual update." });
    }

    const result = await pool.query(
      "UPDATE events SET status = $1 WHERE id = $2 RETURNING *",
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Event not found." });
    }

    const updatedEvent = {
      ...result.rows[0],
      status: calculateEventStatus(result.rows[0])
    };

    res.json({ message: "Event status updated successfully!", event: updatedEvent });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({ message: "Failed to update event status." });
  }
});

// EVENT REGISTRATIONS
app.get("/api/event-registrations", async (req, res) => {
  try {
    const { user_id } = req.query;
    let query = "SELECT * FROM event_registrations";
    let params = [];

    if (user_id) {
      query += " WHERE user_id = $1";
      params.push(user_id);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({ message: "Failed to fetch registrations." });
  }
});

app.post("/api/event-registrations", async (req, res) => {
  try {
    const { user_id, event_id } = req.body;
    
    if (!user_id || !event_id) {
      return res.status(400).json({ message: "User ID and Event ID are required." });
    }

    const existing = await pool.query(
      "SELECT * FROM event_registrations WHERE user_id = $1 AND event_id = $2",
      [user_id, event_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "You are already registered for this event." });
    }

    const result = await pool.query(
      `INSERT INTO event_registrations (user_id, event_id) VALUES ($1, $2) RETURNING *`,
      [user_id, event_id]
    );

    res.status(201).json({ message: "Successfully registered for the event!", registration: result.rows[0] });
  } catch (error) {
    console.error("Error registering event:", error);
    res.status(500).json({ message: "Failed to register for event." });
  }
});

app.get("/api/events/:id/registrations", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.school_id, u.email, er.registered_at
       FROM event_registrations er
       JOIN users u ON er.user_id = u.id
       WHERE er.event_id = $1
       ORDER BY er.registered_at DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching event registrations:", error);
    res.status(500).json({ message: "Failed to fetch registered attendees." });
  }
});

// SERVER LISTENER
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// DELETE AN EVENT
app.delete('/api/events/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const query = 'DELETE FROM events WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]); 

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully', event: result.rows[0] });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Server error while deleting event' });
  }
});