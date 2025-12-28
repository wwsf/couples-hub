import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import '../styles/Calendar.css'

function Calendar() {
  const { user } = useAuth()
  const { coupleId } = useCouple()
  const [events, setEvents] = useState([])
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'personal',
    color: 'blue',
    description: ''
  })

  // View states
  const [viewMode, setViewMode] = useState('calendar') // 'calendar' or 'sheet'
  const [calendarView, setCalendarView] = useState('month') // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showEventForm, setShowEventForm] = useState(false)

  // Fetch events from Supabase when component loads or couple changes
  useEffect(() => {
    if (coupleId) {
      fetchEvents()
    }
  }, [coupleId])

  // Function to get events from database
  const fetchEvents = async () => {
    if (!coupleId) return

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('couple_id', coupleId)
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.log('Error fetching events:', error.message)
    }
  }

  // Function to add a new event
  const addEvent = async (e) => {
    e.preventDefault()

    if (!newEvent.title || !newEvent.date) {
      alert('Please fill in at least title and date')
      return
    }

    if (!coupleId || !user) {
      alert('Unable to add event. Please try refreshing the page.')
      return
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([{
          ...newEvent,
          couple_id: coupleId,
          created_by: user.id
        }])
        .select()

      if (error) throw error

      setEvents([...events, ...data])
      setNewEvent({
        title: '',
        date: '',
        time: '',
        location: '',
        category: 'personal',
        color: 'blue',
        description: ''
      })
      setShowEventForm(false)
    } catch (error) {
      console.log('Error adding event:', error.message)
      alert(`Failed to add event: ${error.message}`)
    }
  }

  // Function to update an event (for sheet view inline editing)
  const updateEvent = async (id, updates) => {
    try {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      setEvents(events.map(event =>
        event.id === id ? { ...event, ...updates } : event
      ))
    } catch (error) {
      console.log('Error updating event:', error.message)
      alert(`Failed to update event: ${error.message}`)
    }
  }

  // Function to delete an event
  const deleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEvents(events.filter(event => event.id !== id))
    } catch (error) {
      console.log('Error deleting event:', error.message)
      alert(`Failed to delete event: ${error.message}`)
    }
  }

  // Helper: Get days in month
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  // Helper: Get events for a specific date
  const getEventsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(event => event.date === dateStr)
  }

  // Helper: Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric'
    }).format(date)
  }

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Render Month View
  const renderMonthView = () => {
    const days = getDaysInMonth(currentDate)
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="calendar-month-view">
        <div className="calendar-header">
          <button onClick={goToPreviousMonth} className="btn-nav">←</button>
          <h3>{formatDate(currentDate)}</h3>
          <button onClick={goToNextMonth} className="btn-nav">→</button>
          <button onClick={goToToday} className="btn btn-secondary">Today</button>
        </div>

        <div className="calendar-grid">
          {/* Week day headers */}
          {weekDays.map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}

          {/* Day cells */}
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="calendar-day empty"></div>
            }

            const dayEvents = getEventsForDate(date)
            const isToday = date.toDateString() === new Date().toDateString()

            return (
              <div
                key={date.toISOString()}
                className={`calendar-day ${isToday ? 'today' : ''}`}
                onClick={() => {
                  setSelectedDate(date.toISOString().split('T')[0])
                  setNewEvent({ ...newEvent, date: date.toISOString().split('T')[0] })
                  setShowEventForm(true)
                }}
              >
                <div className="day-number">{date.getDate()}</div>
                <div className="day-events">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`event-dot event-${event.color}`}
                      title={event.title}
                    >
                      {event.title.substring(0, 15)}
                      {event.title.length > 15 ? '...' : ''}
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="event-more">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Render Week View (simplified)
  const renderWeekView = () => {
    return (
      <div className="calendar-week-view">
        <p className="coming-soon">Week view - coming soon! Use month view for now.</p>
      </div>
    )
  }

  // Render Day View (simplified)
  const renderDayView = () => {
    return (
      <div className="calendar-day-view">
        <p className="coming-soon">Day view - coming soon! Use month view for now.</p>
      </div>
    )
  }

  // Render Sheet View
  const renderSheetView = () => {
    const [sortColumn, setSortColumn] = useState('date')
    const [sortDirection, setSortDirection] = useState('asc')

    const handleSort = (column) => {
      if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
      } else {
        setSortColumn(column)
        setSortDirection('asc')
      }
    }

    const sortedEvents = [...events].sort((a, b) => {
      let aVal = a[sortColumn]
      let bVal = b[sortColumn]

      if (sortColumn === 'date') {
        aVal = new Date(a.date)
        bVal = new Date(b.date)
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return (
      <div className="sheet-view">
        <table className="events-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('date')} className="sortable">
                Date {sortColumn === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('time')} className="sortable">
                Time {sortColumn === 'time' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th onClick={() => handleSort('title')} className="sortable">
                Title {sortColumn === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Location</th>
              <th onClick={() => handleSort('category')} className="sortable">
                Category {sortColumn === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  No events yet. Add your first event above!
                </td>
              </tr>
            ) : (
              sortedEvents.map(event => (
                <tr key={event.id} className={`event-row event-${event.color}`}>
                  <td>{new Date(event.date).toLocaleDateString()}</td>
                  <td>{event.time || '-'}</td>
                  <td>
                    <strong>{event.title}</strong>
                    {event.description && <div className="event-description">{event.description}</div>}
                  </td>
                  <td>{event.location || '-'}</td>
                  <td>
                    <span className={`category-badge category-${event.category}`}>
                      {event.category}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => deleteEvent(event.id)}
                      className="btn btn-delete btn-small"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="calendar-top-bar">
        <h2>Our Calendar</h2>
        <button
          onClick={() => setShowEventForm(!showEventForm)}
          className="btn btn-primary"
        >
          {showEventForm ? 'Cancel' : '+ Add Event'}
        </button>
      </div>

      {/* Event Form (collapsible) */}
      {showEventForm && (
        <form onSubmit={addEvent} className="event-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Event title *"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="form-row">
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className="input-field"
              required
            />
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="input-field"
              placeholder="Time (optional)"
            />
          </div>

          <div className="form-row">
            <input
              type="text"
              placeholder="Location (optional)"
              value={newEvent.location}
              onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="form-row">
            <select
              value={newEvent.category}
              onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
              className="input-field"
            >
              <option value="personal">Personal</option>
              <option value="work">Work</option>
              <option value="date">Date Night</option>
              <option value="health">Health</option>
              <option value="other">Other</option>
            </select>

            <div className="color-picker">
              <label>Color:</label>
              {['blue', 'green', 'red', 'purple', 'orange'].map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-btn color-${color} ${newEvent.color === color ? 'selected' : ''}`}
                  onClick={() => setNewEvent({ ...newEvent, color })}
                  title={color}
                />
              ))}
            </div>
          </div>

          <div className="form-row">
            <textarea
              placeholder="Description (optional)"
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="input-field textarea-field"
              rows="2"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block">Add Event</button>
        </form>
      )}

      {/* View Controls */}
      <div className="view-controls">
        <div className="view-mode-toggle">
          <button
            className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => setViewMode('calendar')}
          >
            📅 Calendar
          </button>
          <button
            className={`toggle-btn ${viewMode === 'sheet' ? 'active' : ''}`}
            onClick={() => setViewMode('sheet')}
          >
            📋 Sheet
          </button>
        </div>

        {viewMode === 'calendar' && (
          <div className="calendar-view-toggle">
            <button
              className={`toggle-btn ${calendarView === 'month' ? 'active' : ''}`}
              onClick={() => setCalendarView('month')}
            >
              Month
            </button>
            <button
              className={`toggle-btn ${calendarView === 'week' ? 'active' : ''}`}
              onClick={() => setCalendarView('week')}
            >
              Week
            </button>
            <button
              className={`toggle-btn ${calendarView === 'day' ? 'active' : ''}`}
              onClick={() => setCalendarView('day')}
            >
              Day
            </button>
          </div>
        )}
      </div>

      {/* Render appropriate view */}
      {viewMode === 'calendar' && calendarView === 'month' && renderMonthView()}
      {viewMode === 'calendar' && calendarView === 'week' && renderWeekView()}
      {viewMode === 'calendar' && calendarView === 'day' && renderDayView()}
      {viewMode === 'sheet' && renderSheetView()}
    </div>
  )
}

export default Calendar
