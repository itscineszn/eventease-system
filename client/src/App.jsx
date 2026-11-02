import { useState, useEffect } from "react";
import "./App.css";
import UserDashboard from './UserDashboard';

function App() {
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [activeSection, setActiveSection] = useState("Dashboard");
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState("");

  const [isRegistering, setIsRegistering] = useState(false);
  const [registerFirstName, setRegisterFirstName] = useState("");
  const [registerLastName, setRegisterLastName] = useState("");
  const [registerSchoolId, setRegisterSchoolId] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  
  // Bookings states for the Admin view
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [bookingsError, setBookingsError] = useState("");

  // Users states for the Admin view
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState("");

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    event_date: "",
    start_time: "",
    end_time: "",
    location: "",
    capacity: "",
  });

  const [savingEvent, setSavingEvent] = useState(false);
  const [eventMessage, setEventMessage] = useState("");

  // Dashboard statistics
  const [totalUsers, setTotalUsers] = useState(null);
  const [totalEvents, setTotalEvents] = useState(null);
  const [totalBookings, setTotalBookings] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState("");

  const [attendeesModalOpen, setAttendeesModalOpen] = useState(false);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [attendees, setAttendees] = useState([]);
  const [attendeesLoading, setAttendeesLoading] = useState(false);

  // Auto-dismiss timer 
  useEffect(() => {
    if (eventMessage) {
      const timer = setTimeout(() => {
        setEventMessage("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [eventMessage]);

  // Helper function to parse date string to YYYY-MM-DD format
  const parseLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const str = String(dateInput);
    if (str.length >= 10) {
      return str.substring(0, 10);
    }
    return str;
  };

  const handleViewAttendees = async (eventId, eventTitle) => {
    setSelectedEventTitle(eventTitle);
    setAttendeesModalOpen(true);
    setAttendeesLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/events/${eventId}/registrations`);
      if (response.ok) {
        const data = await response.json();
        setAttendees(data);
      } else {
        setAttendees([]);
      }
    } catch (error) {
      console.error("Error fetching attendees:", error);
      setAttendees([]);
    } finally {
      setAttendeesLoading(false);
    }
  };

  // Helper function to format time to 12-hour AM/PM format
  const formatTimeTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    return `${h}:${minutes || '00'} ${ampm}`;
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setEventMessage("");

    const capacity = Number(eventForm.capacity);

    if (!Number.isInteger(capacity) || capacity < 1) {
      setEventMessage("Capacity must be a positive whole number.");
      return;
    }

    setSavingEvent(true);

    try {
      const cleanDate = eventForm.event_date; 

      const response = await fetch("http://localhost:5000/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...eventForm,
          event_date: cleanDate,
          capacity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create event.");
      }

      setEventForm({
        title: "",
        description: "",
        event_date: "",
        start_time: "",
        end_time: "",
        location: "",
        capacity: "",
      });

      const eventsResponse = await fetch("http://localhost:5000/api/events");

      if (eventsResponse.ok) {
        const updatedEvents = await eventsResponse.json();
        setEvents(updatedEvents);
      }

      setShowEventForm(false);
      setEventMessage("Event created successfully!");

      const statsResponse = await fetch(
        "http://localhost:5000/api/dashboard/stats"
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setTotalUsers(statsData.totalUsers);
        setTotalEvents(statsData.totalEvents);
      }
    } catch (error) {
      setEventMessage(error.message || "Unable to create event.");
    } finally {
      setSavingEvent(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update booking status.");
      }

      setBookings((prevBookings) =>
        prevBookings.map((b) =>
          b.booking_id === bookingId ? { ...b, status: newStatus } : b
        )
      );
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Unable to update booking status.");
    }
  };

  // Function to handle event deletion
const handleDeleteEvent = async (eventId) => {
    if (window.confirm("Are you sure you want to permanently delete this event?")) {
      try {
        const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          throw new Error("Failed to delete event.");
        }
        // update events
        setEvents(events.filter((ev) => ev.id !== eventId));
        setEventMessage("Event deleted successfully!");

        // update dashboard stats
        const statsResponse = await fetch("http://localhost:5000/api/dashboard/stats");
        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setTotalEvents(statsData.totalEvents);
        }
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Unable to delete event.");
      }
    }
  };

  // Fetch dashboard statistics
  useEffect(() => {
    if (loggedInUser?.role !== "Admin") {
      return;
    }

    let isMounted = true;

    async function fetchDashboardStats() {
      setStatsLoading(true);
      setStatsError("");

      try {
        const response = await fetch(
          "http://localhost:5000/api/dashboard/stats"
        );

        if (!response.ok) {
          throw new Error("Failed to load dashboard statistics.");
        }

        const data = await response.json();

        if (isMounted) {
          setTotalUsers(data.totalUsers);
          setTotalEvents(data.totalEvents);
          setTotalBookings(data.totalBookings);
        }
      } catch (error) {
        console.error("Dashboard stats error:", error);

        if (isMounted) {
          setStatsError("Unable to load user count.");
        }
      } finally {
        if (isMounted) {
          setStatsLoading(false);
        }
      }
    }

    fetchDashboardStats();

    return () => {
      isMounted = false;
    };
  }, [loggedInUser]);

  // Fetch events when the Events section is active
  useEffect(() => {
    if (loggedInUser?.role !== "Admin" || activeSection !== "Events") {
      return;
    }

    async function fetchEvents() {
      setEventsLoading(true);
      setEventsError("");

      try {
        const response = await fetch("http://localhost:5000/api/events");

        if (!response.ok) {
          throw new Error("Failed to fetch events.");
        }

        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Fetch events error:", error);
        setEventsError("Unable to load events. Please try again.");
      } finally {
        setEventsLoading(false);
      }
    }

    fetchEvents();
  }, [loggedInUser, activeSection]);

  // Fetch bookings when the Bookings section is active
  useEffect(() => {
    if (loggedInUser?.role !== "Admin" || activeSection !== "Bookings") {
      return;
    }

    async function fetchBookings() {
      setBookingsLoading(true);
      setBookingsError("");

      try {
        const response = await fetch("http://localhost:5000/api/bookings");

        if (!response.ok) {
          throw new Error("Failed to fetch bookings.");
        }

        const data = await response.json();
        setBookings(data);
      } catch (error) {
        console.error("Fetch bookings error:", error);
        setBookingsError("Unable to load bookings. Please try again.");
      } finally {
        setBookingsLoading(false);
      }
    }

    fetchBookings();
  }, [loggedInUser, activeSection]);

  // Fetch users when the Users section is active
  useEffect(() => {
    if (loggedInUser?.role !== "Admin" || activeSection !== "Users") {
      return;
    }

    async function fetchUsers() {
      setUsersLoading(true);
      setUsersError("");

      try {
        const response = await fetch("http://localhost:5000/api/users");

        if (!response.ok) {
          throw new Error("Failed to fetch users.");
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Fetch users error:", error);
        setUsersError("Unable to load users. Please try again.");
      } finally {
        setUsersLoading(false);
      }
    }

    fetchUsers();
  }, [loggedInUser, activeSection]);

  function chooseRole(selectedRole) {
    setRole(selectedRole);
    setEmail("");
    setPassword("");
    setMessage("");
    setShowPassword(false);
    setIsRegistering(false);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");

    if (!role) {
      setMessage("Please select Admin or User first.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password, role }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Login failed. Please try again.");
        return;
      }

      if (data.user?.role === "Admin") {
        setLoggedInUser(data.user);
        setActiveSection("Dashboard");
        setMessage("");
      } else if (data.user?.role === "User") {
        setLoggedInUser(data.user);
        setMessage("");
      } else {
        setMessage("Unable to verify your account. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage("Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: registerFirstName,
          last_name: registerLastName,
          school_id: registerSchoolId,
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Registration failed.");
        return;
      }

      alert("Account created successfully! Please log in.");
      setIsRegistering(false);
      setRegisterFirstName("");
      setRegisterLastName("");
      setRegisterSchoolId("");
      setRegisterEmail("");
      setRegisterPassword("");
      setMessage("");
    } catch (error) {
      console.error("Registration error:", error);
      setMessage("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }
  
  // USER DASHBOARD
  if (loggedInUser?.role === "User") {
    return <UserDashboard user={loggedInUser} onLogout={() => setLoggedInUser(null)} />;
  }

  // ADMIN DASHBOARD
  if (loggedInUser?.role === "Admin") {
    return (
      <div className="admin-dashboard">
        {/* TOAST NOTIFICATION */}
        {eventMessage && <div className="toast-notification">{eventMessage}</div>}

        <aside className="dashboard-sidebar">
          <h2>EventEase</h2>
          <p className="sidebar-label">ADMIN MENU</p>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "Dashboard" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("Dashboard");
              setMessage("");
            }}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "Events" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("Events");
              setMessage("");
            }}
          >
            Events
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "Bookings" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("Bookings");
              setMessage("");
            }}
          >
            Bookings
          </button>

          <button
            type="button"
            className={`sidebar-link ${
              activeSection === "Users" ? "active" : ""
            }`}
            onClick={() => {
              setActiveSection("Users");
              setMessage("");
            }}
          >
            Users
          </button>

          <button
            type="button"
            className="sidebar-link logout-button"
            onClick={() => {
              setLoggedInUser(null);
              setEmail("");
              setPassword("");
              setMessage("");
              setRole("");
              setTotalUsers(null);
              setStatsError("");
              setActiveSection("Dashboard");
            }}
          >
            Log Out
          </button>
        </aside>

        <main className="dashboard-main">
          {activeSection === "Events" ? (
            <>
              <header className="dashboard-header">
                <div>
                  <h1>Manage Events</h1>
                  <p>Create and manage your EventEase events.</p>
                </div>
                <div className="header-actions">
                  <button
                    className="create-event-btn"
                    onClick={() => {
                      setEventMessage(""); 
                      setShowEventForm(true);
                    }}
                  >
                    + Create Event
                  </button>

                  <div className="admin-profile">
                    <span className="admin-avatar">A</span>
                    <span>{loggedInUser?.full_name}</span>
                  </div>
                </div>
              </header>

              {showEventForm && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h2>Create New Event</h2>
                      <button 
                        type="button" 
                        className="modal-close-btn"
                        onClick={() => {
                          setShowEventForm(false);
                          setEventMessage("");
                        }}
                      >
                        &times;
                      </button>
                    </div>

                    <form onSubmit={handleCreateEvent}>
                      <label>Event Title</label>
                      <input
                        type="text"
                        placeholder="Enter event title"
                        value={eventForm.title}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, title: e.target.value })
                        }
                        required
                      />

                      <label>Date</label>
                      <input
                        type="date"
                        name="event_date"
                        value={eventForm.event_date}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => {
                          setEventForm({ ...eventForm, event_date: e.target.value });
                        }}
                        required
                      />
                      
                      <div className="time-inputs-wrapper">
                        <div className="time-field">
                          <label>Start Time</label>
                          <input
                            type="time"
                            value={eventForm.start_time}
                            onChange={(e) =>
                              setEventForm({ ...eventForm, start_time: e.target.value })
                            }
                            required
                          />
                        </div>
                        <div className="time-field">
                          <label>End Time</label>
                          <input
                            type="time"
                            value={eventForm.end_time}
                            onChange={(e) =>
                              setEventForm({ ...eventForm, end_time: e.target.value })
                            }
                            required
                          />
                        </div>
                      </div>

                      <label>Location</label>
                      <select
                        value={eventForm.location}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, location: e.target.value })
                        }
                        required
                        style={{ width: '100%', padding: '10px', marginBottom: '15px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
                      >
                        <option value="" disabled>-- Select Venue --</option>
                        <option value="Bren Z. Guiao Multipurpose Center">Bren Z. Guiao Multipurpose Center</option>
                        <option value="Rafael V. Lazatin Memorial Audio Visual Center (AVC)">Rafael V. Lazatin Memorial Audio Visual Center (AVC)</option>
                        <option value="University Covered Court">University Covered Court</option>
                        <option value="Grandstand">Grandstand</option>
                        <option value="Tennis Court">Tennis Court</option>
                        <option value="Old Gymnasium">Old Gymnasium</option>
                        <option value="Library">Library</option>
                        <option value="Chapel">Chapel</option>
                      </select>

                      <label>Capacity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Enter maximum attendees"
                        value={eventForm.capacity}
                        onChange={(e) =>
                          setEventForm({ ...eventForm, capacity: e.target.value })
                        }
                        required
                      />

                      <div className="event-form-actions">
                        <button type="submit" disabled={savingEvent}>
                          {savingEvent ? "Saving..." : "Create Event"}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setShowEventForm(false);
                            setEventMessage("");
                          }}
                          disabled={savingEvent}
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              <section className="dashboard-section">
                <h2>All Events</h2>

                {eventsLoading && <p>Loading events...</p>}

                {eventsError && (
                  <p role="alert">{eventsError}</p>
                )}

                {!eventsLoading && !eventsError && events.length === 0 && (
                  <p>No events found. Your events will appear here once added.</p>
                )}

                {!eventsLoading && events.length > 0 && (
                  <div className="events-table-wrapper">
                    <table className="events-table">
                      <thead>
                        <tr>
                          <th>Title</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Location</th>
                          <th>Capacity</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                      {events.map((event) => {
                        const formattedDate = parseLocalDateString(event.event_date);
                        const timeString = event.start_time && event.end_time
                          ? `${formatTimeTo12Hour(event.start_time)} - ${formatTimeTo12Hour(event.end_time)}`
                          : '';

                        return (
                          <tr key={event.id}>
                            <td>{event.title}</td>
                            <td>{formattedDate}</td>
                            <td>{timeString}</td>
                            <td>{event.location}</td>
                            <td>{event.capacity}</td>
                            <td>
                            {event.status === "Upcoming" || event.status === "Ongoing" || event.status === "Completed" ? (
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '12px',
                                  fontSize: '0.8rem',
                                  fontWeight: 'bold',
                                  backgroundColor: event.status === 'Completed' ? '#d4edda' : event.status === 'Ongoing' ? '#cce5ff' : '#fff3cd',
                                  color: event.status === 'Completed' ? '#155724' : event.status === 'Ongoing' ? '#004085' : '#856404',
                                }}>
                                  {event.status}
                                </span>
                                <button
                                  onClick={async () => {
                                    if (window.confirm("Are you sure you want to cancel this event?")) {
                                      try {
                                        const res = await fetch(`http://localhost:5000/api/events/${event.id}/status`, {
                                          method: "PUT",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ status: "Cancelled" }),
                                        });
                                        if (res.ok) {
                                          setEvents(events.map(ev => ev.id === event.id ? { ...ev, status: "Cancelled" } : ev));
                                        }
                                      } catch (err) {
                                        console.error("Error cancelling event:", err);
                                      }
                                    }
                                  }}
                                  title="Click to cancel event"
                                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", justifyContent: "center" }}>
                                <select
                                  value={event.status}
                                  onChange={async (e) => {
                                    const newStatus = e.target.value;
                                    try {
                                      const response = await fetch(`http://localhost:5000/api/events/${event.id}/status`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: newStatus }),
                                      });
                                      if (response.ok) {
                                        const data = await response.json();
                                        setEvents(events.map(ev => ev.id === event.id ? { ...ev, status: data.event.status } : ev));
                                      }
                                    } catch (err) {
                                      console.error("Error updating status:", err);
                                    }
                                  }}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    backgroundColor: '#f8d7da',
                                    color: '#721c24',
                                    cursor: 'pointer'
                                  }}
                                >
                                  <option value="Cancelled">Cancelled</option>
                                  <option value="Upcoming">Restore to Upcoming</option>
                                </select>
                              </div>
                                )}
                              </td>
                           <td>
                              <div className="action-buttons-wrapper">
                                <button 
                                  className="create-event-btn view-attendees-btn"
                                  onClick={() => handleViewAttendees(event.id, event.title)}
                                >
                                  View Attendees
                                </button>
                                <button
                                  className="delete-event-btn"
                                  onClick={() => handleDeleteEvent(event.id)}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {attendeesModalOpen && (
                <div className="modal-overlay">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h2>Attendees: {selectedEventTitle}</h2>
                      <button 
                        type="button" 
                        className="modal-close-btn"
                        onClick={() => setAttendeesModalOpen(false)}
                      >
                        &times;
                      </button>
                    </div>

                    {attendeesLoading ? (
                      <p>Loading attendees...</p>
                    ) : attendees.length === 0 ? (
                      <p style={{ marginTop: "15px" }}>No students registered for this event yet.</p>
                    ) : (
                      <div className="attendees-modal-list">
                        <table className="events-table">
                          <thead>
                            <tr>
                              <th>School ID</th>
                              <th>Full Name</th>
                              <th>Email</th>
                            </tr>
                          </thead>
                          <tbody>
                            {attendees.map((att) => (
                              <tr key={att.id}>
                                <td>{att.school_id}</td>
                                <td>{att.first_name} {att.last_name}</td>
                                <td>{att.email}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : activeSection === "Bookings" ? (
            <>
              <header className="dashboard-header">
                <div>
                  <h1>Manage Bookings</h1>
                  <p>View and manage campus venue reservation requests.</p>
                </div>
                <div className="admin-profile">
                  <span className="admin-avatar">A</span>
                  <span>{loggedInUser?.full_name}</span>
                </div>
              </header>

              <section className="dashboard-section">
                <h2>Booking Requests</h2>

                {bookingsLoading && <p>Loading bookings...</p>}

                {bookingsError && (
                  <p role="alert">{bookingsError}</p>
                )}

                {!bookingsLoading && !bookingsError && bookings.length === 0 && (
                  <p>No booking requests found.</p>
                )}

                {!bookingsLoading && bookings.length > 0 && (
                  <div className="events-table-wrapper">
                    <table className="bookings-table">
                      <thead>
                        <tr>
                          <th>Booking ID</th>
                          <th>User ID</th>
                          <th>Event Title</th>
                          <th>Location</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map((booking) => (
                          <tr key={booking.booking_id}>
                            <td>{booking.booking_id}</td>
                            <td>{booking.user_id}</td>
                            <td>{booking.event_title}</td>
                            <td>{booking.building_name}</td>
                            <td>{parseLocalDateString(booking.event_date)}</td>
                            <td>
                              {formatTimeTo12Hour(booking.start_time)} - {formatTimeTo12Hour(booking.end_time)}
                            </td>
                            <td>
                              {booking.status === "Pending" ? (
                                <div style={{ display: "flex", gap: "6px" }}>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking.booking_id, "Approved")}
                                    style={{
                                      backgroundColor: "#10b981",
                                      color: "white",
                                      border: "none",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "0.8rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => handleUpdateBookingStatus(booking.booking_id, "Rejected")}
                                    style={{
                                      backgroundColor: "#ef4444",
                                      color: "white",
                                      border: "none",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      cursor: "pointer",
                                      fontSize: "0.8rem",
                                      fontWeight: "600",
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span style={{ 
                                  padding: '4px 10px', 
                                  borderRadius: '12px',
                                  background: booking.status === 'Approved' ? '#d4edda' : '#f8d7da',
                                  color: booking.status === 'Approved' ? '#155724' : '#721c24',
                                  fontWeight: 'bold',
                                  fontSize: '12px'
                                }}>
                                  {booking.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : activeSection === "Users" ? (
            <>
              <header className="dashboard-header">
                <div>
                  <h1>Manage Users</h1>
                  <p>View and manage registered system users.</p>
                </div>
                <div className="admin-profile">
                  <span className="admin-avatar">A</span>
                  <span>{loggedInUser?.full_name}</span>
                </div>
              </header>

              <section className="dashboard-section">
                <h2>System Users</h2>

                {usersLoading && <p>Loading users...</p>}

                {usersError && (
                  <p role="alert">{usersError}</p>
                )}

                {!usersLoading && !usersError && users.length === 0 && (
                  <p>No registered users found.</p>
                )}

                {!usersLoading && users.length > 0 && (
                  <div className="users-table-wrapper">
                    <table className="users-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Full Name</th>
                          <th>Email</th>
                          <th>Role</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => (
                          <tr key={u.id}>
                            <td>{u.id}</td>
                            <td>{u.full_name}</td>
                            <td>{u.email}</td>
                            <td>{u.role}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          ) : (
            <>
              <header className="dashboard-header">
                <div>
                  <h1>Admin Dashboard</h1>
                  <p>Manage your events in one place.</p>
                </div>

                <div className="admin-profile">
                  <span className="admin-avatar">A</span>
                  <span>{loggedInUser?.full_name}</span>
                </div>
              </header>

              <section className="welcome-banner">
                <h2>Welcome back, {loggedInUser?.full_name}!</h2>
                <p>
                  Here's an overview of your EventEase management system.
                </p>
              </section>

              <section className="dashboard-cards">
                <article 
                  className="dashboard-card" 
                  style={{ transition: 'transform 0.2s' }}
                >
                  <span>Total Events</span>
                  <h2>
                    {statsLoading
                      ? "..."
                      : statsError
                        ? "—"
                        : totalEvents ?? "—"}
                  </h2>
                  <small 
                    onClick={() => setActiveSection("Events")} 
                    style={{ color: '#287c91', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    View Events
                  </small>
                </article>

                <article 
                  className="dashboard-card" 
                  style={{ transition: 'transform 0.2s' }}
                >
                  <span>Total Bookings</span>
                  <h2>
                    {statsLoading
                      ? "..."
                      : statsError
                        ? "—"
                        : totalBookings ?? "—"}
                  </h2>
                  <small 
                    onClick={() => setActiveSection("Bookings")} 
                    style={{ color: '#287c91', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    View Bookings
                  </small>
                </article>

                <article 
                  className="dashboard-card" 
                  style={{ transition: 'transform 0.2s' }}
                >
                  <span>Registered Users</span>
                  <h2>
                    {statsLoading
                      ? "..."
                      : statsError
                        ? "—"
                        : totalUsers ?? "—"}
                  </h2>
                  <small 
                    onClick={() => setActiveSection("Users")} 
                    style={{ color: '#287c91', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    View Users
                  </small>
                  {statsError && (
                    <p role="status">{statsError}</p>
                  )}
                </article>
              </section>
            </>
          )}
        </main>
      </div>
    );
  }

  // LOGIN PAGE / REGISTER PAGE
  return (
    <main className="login-page">
      <section className="login-card">
        <header className="brand">
          <div className="brand-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
              <path d="m9 15 2 2 4-4" />
            </svg>
          </div>

          <h1>EventEase</h1>
          <p>Your events, organized in one place.</p>
        </header>

        <div className="login-content">
          {!role ? (
            <>
              <div className="heading">
                <h2>Welcome Back!</h2>
                <p>Select your account type to continue.</p>
              </div>

              <div className="role-options">
                <button
                  type="button"
                  className="role-card"
                  onClick={() => chooseRole("Admin")}
                >
                  <span className="role-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>

                  <span className="role-title">Admin</span>
                  <span className="role-description">
                    Manage events and bookings
                  </span>
                  <span className="role-arrow" aria-hidden="true">
                    →
                  </span>
                </button>

                <button
                  type="button"
                  className="role-card"
                  onClick={() => chooseRole("User")}
                >
                  <span className="role-icon" aria-hidden="true">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
                    </svg>
                  </span>

                  <span className="role-title">User</span>
                  <span className="role-description">
                    Discover and join events
                  </span>
                  <span className="role-arrow" aria-hidden="true">
                    →
                  </span>
                </button>
              </div>
            </>
          ) : role === "User" && isRegistering ? (
            <>
              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setIsRegistering(false);
                  setMessage("");
                }}
              >
                ← Back to User Login
              </button>

              <div className="heading form-heading">
                <span className="selected-role">PSAU User Registration</span>
                <h2>Create Account</h2>
                <p>Register as a user to reserve venues.</p>
              </div>

              <form onSubmit={handleRegister}>
                <label htmlFor="firstname">First Name</label>
                <input
                  id="firstname"
                  type="text"
                  placeholder="First Name"
                  value={registerFirstName}
                  onChange={(event) => setRegisterFirstName(event.target.value)}
                  required
                />

                <label htmlFor="lastname">Last Name</label>
                <input
                  id="lastname"
                  type="text"
                  placeholder="Last Name"
                  value={registerLastName}
                  onChange={(event) => setRegisterLastName(event.target.value)}
                  required
                />

                <label htmlFor="schoolid">School ID Number</label>
                <input
                  id="schoolid"
                  type="text"
                  placeholder="e.g. 2026-12345"
                  value={registerSchoolId}
                  onChange={(event) => setRegisterSchoolId(event.target.value)}
                  required
                />

                <label htmlFor="reg-email">Email Address</label>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="you@psau.edu.ph"
                  value={registerEmail}
                  onChange={(event) => setRegisterEmail(event.target.value)}
                  required
                />

                <label htmlFor="reg-password">Password</label>
                <input
                  id="reg-password"
                  type="password"
                  placeholder="Create a password"
                  value={registerPassword}
                  onChange={(event) => setRegisterPassword(event.target.value)}
                  required
                />

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Sign Up"}
                </button>

                {message && (
                  <p className="form-message" role="status" style={{ color: message.includes("success") ? "green" : "#ef4444", marginTop: "10px" }}>
                    {message}
                  </p>
                )}
              </form>
            </>
          ) : (
            <>
              <button
                type="button"
                className="back-button"
                onClick={() => {
                  chooseRole("");
                  setIsRegistering(false);
                }}
              >
                ← Change account type
              </button>

              <div className="heading form-heading">
                <span className="selected-role">{role} Login</span>
                <h2>Welcome Back!</h2>
                <p>Enter your details to continue.</p>
              </div>

              <form onSubmit={handleLogin}>
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />

                <label htmlFor="password">Password</label>

                <div className="password-wrapper">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={loading}
                >
                  {loading ? "Logging in..." : `Log In as ${role}`}
                </button>

                {role === "User" && (
                  <p style={{ textAlign: "center", marginTop: "15px", fontSize: "0.9rem" }}>
                    Don't have an account?{" "}
                    <span 
                      onClick={() => {
                        setIsRegistering(true);
                        setMessage("");
                      }}
                      style={{ color: "#287c91", fontWeight: "bold", cursor: "pointer" }}
                    >
                      Sign up here
                    </span>
                  </p>
                )}

                {message && (
                  <p className="form-message" role="status">
                    {message}
                  </p>
                )}
              </form>
            </>
          )}
        </div>

        <footer className="login-footer">
          <p>EventEase © 2026</p>
          <span>Plan. Organize. Celebrate.</span>
        </footer>
      </section>
    </main>
  );
}

export default App;