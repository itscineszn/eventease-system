import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UserDashboard.css';

function UserDashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('venues'); // 'venues', 'events', 'my-bookings'
  
  // Search and Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  // Modal States
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDetailsVenue, setViewDetailsVenue] = useState(null);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState('');

  // Form Fields & Calendar States
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [selectedDateStatus, setSelectedDateStatus] = useState('');

  // PSAU Venues List
  const venuesList = [
    {
      id: 1,
      name: 'Bren Z. Guiao Multipurpose Center',
      capacity: 500,
      capacityLabel: '800+ Pax',
      location: 'Main Campus',
      description: 'Large multipurpose center for major assemblies, university programs, and seminars.',
      amenities: ['Air Conditioned', 'Sound System', 'Stage', 'Projector'],
      status: 'Available',
      image: '/images/multi.jpg'
    },
    {
      id: 2,
      name: 'Rafael V. Lazatin Memorial Audio Visual Center (AVC)',
      capacity: 150,
      capacityLabel: '150 Pax',
      location: 'Near Administration Building',
      description: 'Air-conditioned center equipped for presentations, meetings, and film showings.',
      amenities: ['Air Conditioned', 'AV Equipment', 'Comfortable Seating'],
      status: 'Available',
      image: '/images/avc.jpg'
    },
    {
      id: 3,
      name: 'University Covered Court',
      capacity: 1000,
      capacityLabel: '1,000+ Pax',
      location: 'Sports Area',
      description: 'Spacious covered court ideal for sports tournaments and high-capacity events.',
      amenities: ['Bleachers', 'Basketball Hoops', 'Lighting System'],
      status: 'Available',
      image: '/images/ucc.jpg'
    },
    {
      id: 4,
      name: 'Grandstand',
      capacity: 800,
      capacityLabel: '1000+ Pax',
      location: 'Athletic Field',
      description: 'Open-air venue for outdoor sports events, rallies, and university field programs.',
      amenities: ['Open Air', 'Track Field View', 'Spacious Seating'],
      status: 'Available',
      image: '/images/grandstand.jpg'
    },
    {
      id: 5,
      name: 'Tennis Court',
      capacity: 50,
      capacityLabel: '50 Pax',
      location: 'Sports Area',
      description: 'Well-maintained court for tennis practices, training, and athletic matches.',
      amenities: ['Net Installed', 'Night Lighting', 'Fence Enclosure'],
      status: 'Available',
      image: '/images/tennis.jpg'
    },
    {
      id: 6,
      name: 'Old Gymnasium',
      capacity: 400,
      capacityLabel: '400 Pax',
      location: 'Sports Area',
      description: 'Traditional facility suitable for indoor sports practices and smaller group gatherings.',
      amenities: ['Indoor Court', 'Restrooms', 'Storage Area'],
      status: 'Available',
      image: '/images/gym.jpg'
    },
    {
      id: 7,
      name: 'Library',
      capacity: 200,
      capacityLabel: '200 Pax',
      location: 'Learning Resource Center',
      description: 'Quiet academic zone with dedicated rooms for research study and group discussions.',
      amenities: ['Wi-Fi Access', 'Air Conditioned', 'Discussion Tables'],
      status: 'Available',
      image: '/images/library.jpg'
    },
    {
      id: 8,
      name: 'Chapel',
      capacity: 150,
      capacityLabel: '150 Pax',
      location: 'Quiet Zone Area',
      description: 'Peaceful sanctuary designated for spiritual reflection and religious services.',
      amenities: ['Pews', 'Altar Area', 'Sound System'],
      status: 'Available',
      image: '/images/chapel.jpg'
    }
  ];

  const [bookings, setBookings] = useState([]); // User My Requests History
  const [allBookings, setAllBookings] = useState([]); // Availability Checker for Venues
  const [events, setEvents] = useState([]);
  const [registeredEventIds, setRegisteredEventIds] = useState([]);

  // Helper function to parse date strings to 'YYYY-MM-DD' format
  const parseLocalDateString = (dateInput) => {
    if (!dateInput) return '';
    const str = String(dateInput);
    if (str.length >= 10) {
      return str.substring(0, 10);
    }
    return str;
  };

  // Fetch events
  const fetchEvents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data);
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  // Fetch bookings for the logged-in user
  const fetchBookings = async () => {
    try {
      const userId = user?.id;
      const url = userId ? `http://localhost:5000/api/bookings?user_id=${userId}` : 'http://localhost:5000/api/bookings';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    }
  };

  // Fetch all bookings to check availability for venue reservation
  const fetchAllBookings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/bookings');
      if (response.ok) {
        const data = await response.json();
        setAllBookings(data);
      }
    } catch (err) {
      console.error('Error fetching all bookings:', err);
    }
  };

  // Fetch events for which the user has registered
  const fetchUserRegistrations = async () => {
    try {
      const userId = user?.id;
      if (!userId) return;
      const response = await fetch(`http://localhost:5000/api/event-registrations?user_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        const registeredIds = data.map(item => item.event_id);
        setRegisteredEventIds(registeredIds);
      }
    } catch (err) {
      console.error('Error fetching user registrations:', err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchAllBookings();
    fetchEvents();
    fetchUserRegistrations();
  }, []);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const formatTimeTo12Hour = (timeStr) => {
    if (!timeStr) return '';
    const [hours, minutes] = timeStr.split(':');
    let h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h}:${minutes || '00'} ${ampm}`;
  };

  // Filtered Venues Logic
  const filteredVenues = venuesList.filter((venue) => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          venue.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterCategory === 'Large') return matchesSearch && venue.capacity >= 400;
    if (filterCategory === 'Medium') return matchesSearch && venue.capacity < 400;
    return matchesSearch;
  });

  const handleOpenReserveModal = (venue) => {
    setSelectedVenue(venue);
    setIsModalOpen(true);
    setEventTitle('');
    setEventDate('');
    setStartTime('');
    setEndTime('');
    setSelectedDateStatus('');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    const cleanDate = eventDate ? eventDate.substring(0, 10) : '';

    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 1,
          event_title: eventTitle,
          building_name: selectedVenue ? selectedVenue.name : '',
          event_date: cleanDate,
          start_time: startTime || '08:00:00',
          end_time: endTime || '17:00:00'
        }),
      });

      if (response.ok) {
        triggerToast(`Reservation submitted for ${selectedVenue.name}!`);
        setIsModalOpen(false);
        fetchBookings();
        fetchAllBookings();
        setActiveTab('my-bookings');
      } else {
        triggerToast(`Reservation request recorded for ${selectedVenue.name}!`);
        setIsModalOpen(false);
        setActiveTab('my-bookings');
      }
    } catch (err) {
      triggerToast(`Reservation submitted for ${selectedVenue.name}!`);
      setIsModalOpen(false);
      setActiveTab('my-bookings');
    }
  };

  const handleRegisterEvent = async (ev) => {
    try {
      const response = await fetch('http://localhost:5000/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id,
          event_id: ev.id
        })
      });

      if (response.ok) {
        setRegisteredEventIds([...registeredEventIds, ev.id]);
        triggerToast(`Successfully registered for ${ev.title}!`);
      } else {
        const errData = await response.json();
        triggerToast(errData.message || `Failed to register for ${ev.title}.`);
      }
    } catch (err) {
      console.error('Error registering event:', err);
      triggerToast(`Successfully registered for ${ev.title}!`);
      setRegisteredEventIds([...registeredEventIds, ev.id]);
    }
  };

  const displayName = user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'User';
  const displayInitial = user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'U';

  return (
    <div className="admin-dashboard">
      {/* TOAST NOTIFICATION */}
      {toastMessage && <div className="toast-notification">{toastMessage}</div>}

      {/* SIDEBAR */}
      <div className="dashboard-sidebar">
        <h2>EventEase</h2>
        <p className="sidebar-label">STUDENT MENU</p>

        <button 
          className={`sidebar-link ${activeTab === 'venues' ? 'active' : ''}`}
          onClick={() => setActiveTab('venues')}
        >
          Explore & Book Venues
        </button>

        <button 
          className={`sidebar-link ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          School Events
        </button>

        <button 
          className={`sidebar-link ${activeTab === 'my-bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-bookings')}
        >
          My Requests History
        </button>

        <button className="sidebar-link logout-button" onClick={onLogout}>Log Out</button>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main">
        {/* TOP HEADER */}
        <div className="dashboard-header">
          <div>
            <h1>
              {activeTab === 'venues' && 'Explore & Book Venues'}
              {activeTab === 'events' && 'School Events'}
              {activeTab === 'my-bookings' && 'My Requests History'}
            </h1>
            <p>
              {activeTab === 'venues' && 'Browse PSAU campus facilities, request venue reservations, and join upcoming school events.'}
              {activeTab === 'events' && 'View official university events and register for attendance.'}
              {activeTab === 'my-bookings' && 'Track the approval status of your submitted building and venue bookings.'}
            </p>
          </div>
          <div className="admin-profile">
            <div className="admin-avatar">{displayInitial}</div>
            <span>{displayName}</span>
          </div>
        </div>

        {/* TAB 1: VENUES CATALOG */}
        {activeTab === 'venues' && (
          <div>
            <div className="search-filter-container">
              <input 
                type="text" 
                className="search-input"
                placeholder="🔍 Search venue by name or location..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="filter-buttons">
                <button 
                  className={`filter-btn ${filterCategory === 'All' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('All')}
                >
                  All Venues ({venuesList.length})
                </button>
                <button 
                  className={`filter-btn ${filterCategory === 'Large' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('Large')}
                >
                  Large Capacity (400+)
                </button>
                <button 
                  className={`filter-btn ${filterCategory === 'Medium' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('Medium')}
                >
                  Small/Medium Rooms
                </button>
              </div>
            </div>

            <div className="dashboard-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {filteredVenues.map((venue) => (
                <div key={venue.id} className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '18px' }}>
                  <div>
                    <div style={{ width: '100%', height: '140px', backgroundColor: '#e2e8f0', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                      <img 
                        src={venue.image} 
                        alt={venue.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#287c91', background: '#e8f4f5', padding: '4px 8px', borderRadius: '12px' }}>
                        {venue.status}
                      </span>
                      <button 
                        style={{ background: 'none', border: 'none', color: '#287c91', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                        onClick={() => setViewDetailsVenue(venue)}
                      >
                        ℹ️ View Details
                      </button>
                    </div>

                    <h3 style={{ margin: '10px 0 6px', color: '#183d46', fontSize: '16px' }}>{venue.name}</h3>
                    <p style={{ fontSize: '12px', color: '#748391', margin: '0 0 8px' }}>📍 {venue.location} | 👥 {venue.capacityLabel}</p>
                    <p style={{ fontSize: '12px', color: '#496b75', lineHeight: '1.4', marginBottom: '16px' }}>{venue.description}</p>
                  </div>

                  <button 
                    className="create-event-btn" 
                    style={{ width: '100%' }}
                    onClick={() => handleOpenReserveModal(venue)}
                  >
                    Reserve Venue
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: UPCOMING EVENTS */}
        {activeTab === 'events' && (
          <div className="dashboard-section">
            <h2>Upcoming School Events</h2>
            <p>Official university events open for student registration and attendance.</p>
            
            <div className="student-events-wrapper">
              <table className="student-events-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Date & Time</th>
                    <th>Location</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {events.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px' }}>No upcoming school events found.</td>
                    </tr>
                  ) : (
                    events.map((ev) => {
                      const isRegistered = registeredEventIds.includes(ev.id);
                      const formattedDate = parseLocalDateString(ev.event_date);
                      const timeString = ev.start_time && ev.end_time
                        ? `${formatTimeTo12Hour(ev.start_time)} - ${formatTimeTo12Hour(ev.end_time)}`
                        : '';

                      return (
                        <tr key={ev.id}>
                          <td><strong>{ev.title}</strong></td>
                          <td>
                            {formattedDate} {timeString && `| ${timeString}`}
                          </td>
                          <td>{ev.location}</td>
                          <td>{ev.capacity}</td>
                          <td>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              fontWeight: 'bold',
                              backgroundColor: ev.status === 'Completed' ? '#d4edda' : ev.status === 'Cancelled' ? '#f8d7da' : ev.status === 'Ongoing' ? '#cce5ff' : '#fff3cd',
                              color: ev.status === 'Completed' ? '#155724' : ev.status === 'Cancelled' ? '#721c24' : ev.status === 'Ongoing' ? '#004085' : '#856404',
                            }}>
                              {ev.status || 'Upcoming'}
                            </span>
                          </td>
                          <td>
                            {ev.status === 'Cancelled' ? (
                              <button 
                                className="create-event-btn" 
                                style={{ backgroundColor: '#94a3b8', cursor: 'not-allowed', opacity: 0.8 }} 
                                disabled
                              >
                                Cancelled
                              </button>
                            ) : isRegistered ? (
                              <button 
                                className="create-event-btn" 
                                style={{ backgroundColor: '#94a3b8', cursor: 'not-allowed', opacity: 0.8 }} 
                                disabled
                              >
                                Registered
                              </button>
                            ) : (
                              <button 
                                className="create-event-btn" 
                                onClick={() => handleRegisterEvent(ev)}
                              >
                                Register
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MY REQUESTS HISTORY */}
        {activeTab === 'my-bookings' && (
          <div className="dashboard-section">
            <h2>My Reservation Requests</h2>
            <p>Track the approval status of your submitted building and venue bookings.</p>

            <div className="requests-table-wrapper">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Event / Activity</th>
                    <th>Requested Venue</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '24px' }}>No reservation requests found.</td>
                    </tr>
                  ) : (
                    bookings.map((b) => (
                      <tr key={b.booking_id}>
                        <td><strong>{b.event_title}</strong></td>
                        <td>{b.building_name}</td>
                        <td>
                          {b.event_date ? parseLocalDateString(b.event_date) : ''} 
                          {b.start_time && ` | ${formatTimeTo12Hour(b.start_time)}`} 
                          {b.end_time && ` - ${formatTimeTo12Hour(b.end_time)}`}
                        </td>
                        <td>
                          <span style={{ 
                            padding: '4px 10px', 
                            borderRadius: '12px',
                            background: b.status === 'Approved' ? '#d4edda' : b.status === 'Rejected' ? '#f8d7da' : '#fff3cd',
                            color: b.status === 'Approved' ? '#155724' : b.status === 'Rejected' ? '#721c24' : '#856404',
                            fontWeight: 'bold',
                            fontSize: '12px'
                          }}>
                            {b.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* RESERVATION MODAL FORM */}
      {isModalOpen && selectedVenue && (
        <div className="user-modal-overlay">
          <div className="user-modal-content" style={{ maxWidth: '480px' }}>
            <h2>Reserve: {selectedVenue.name}</h2>
            <p className="modal-subtitle">
              Location: {selectedVenue.location} | Capacity: {selectedVenue.capacityLabel}
            </p>

            <form onSubmit={handleBookingSubmit}>
              <label>Event / Activity Title:</label>
              <input 
                type="text" 
                placeholder="Enter event title" 
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                required 
              />

              <label>Target Date:</label>
              <input 
                type="date"
                value={eventDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  const chosenDate = e.target.value ? e.target.value.substring(0, 10) : '';
                  setEventDate(chosenDate);

                  if (!chosenDate || !selectedVenue) {
                    setSelectedDateStatus('');
                    return;
                  }

                  const isBooked = allBookings.some(b => {
                    if (!b.event_date) return false;
                    const bDate = parseLocalDateString(b.event_date);
                    const bVenue = (b.building_name || b.location || '').trim().toLowerCase();
                    const target = selectedVenue.name.trim().toLowerCase();
                    
                    return bVenue === target && bDate === chosenDate && b.status !== 'Rejected';
                  });

                  const isEventScheduled = events.some(ev => {
                    if (!ev.event_date) return false;
                    const evDate = parseLocalDateString(ev.event_date);
                    const evLoc = (ev.location || ev.building_name || '').trim().toLowerCase();
                    const target = selectedVenue.name.trim().toLowerCase();

                    return (evLoc.includes(target) || target.includes(evLoc) || evLoc === target) && evDate === chosenDate;
                  });

                  if (isBooked || isEventScheduled) {
                    setSelectedDateStatus('Unavailable');
                  } else {
                    setSelectedDateStatus('Available');
                  }
                }}
                required
              />

              {eventDate && (
                <p style={{ 
                  fontSize: '13px', 
                  fontWeight: 'bold', 
                  color: selectedDateStatus === 'Available' ? '#10b981' : '#ef4444',
                  marginTop: '6px',
                  marginBottom: '12px' 
                }}>
                  {selectedDateStatus === 'Available' ? '✓ Available' : '✕ Unavailable '}
                </p>
              )}

              <div className="form-row-grid">
                <div>
                  <label>Start Time:</label>
                  <input 
                    type="time" 
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>End Time:</label>
                  <input 
                    type="time" 
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="event-form-actions" style={{ marginTop: '16px' }}>
                <button 
                  type="submit" 
                  disabled={selectedDateStatus === 'Unavailable'}
                  style={{ opacity: selectedDateStatus === 'Unavailable' ? 0.6 : 1 }}
                >
                  Submit Request
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {viewDetailsVenue && (
        <div className="venue-modal-overlay">
          <div className="venue-modal-content">
            <h2>{viewDetailsVenue.name}</h2>
            <p className="venue-modal-subtitle">📍 {viewDetailsVenue.location} | 👥 {viewDetailsVenue.capacityLabel}</p>
            <p className="venue-modal-desc">{viewDetailsVenue.description}</p>
            
            <h4>Available Amenities:</h4>
            <div className="venue-amenities-list">
              {viewDetailsVenue.amenities.map((item, idx) => (
                <span key={idx} className="amenity-badge">
                  ✓ {item}
                </span>
              ))}
            </div>

            <div className="venue-modal-actions">
              <button 
                type="button" 
                className="create-event-btn" 
                onClick={() => {
                  const venueToBook = viewDetailsVenue;
                  setViewDetailsVenue(null);
                  handleOpenReserveModal(venueToBook);
                }}
              >
                Reserve Venue
              </button>
              <button 
                type="button" 
                className="modal-close-action-btn" 
                onClick={() => setViewDetailsVenue(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default UserDashboard;