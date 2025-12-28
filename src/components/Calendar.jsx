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

  // Sheet view sorting states
  const [sortColumn, setSortColumn] = useState('date')
  const [sortDirection, setSortDirection] = useState('asc')

  // Sheet view editing states
  const [editingCell, setEditingCell] = useState(null) // { eventId, field }
  const [editValue, setEditValue] = useState('')
  const [inputValues, setInputValues] = useState({}) // Track input values for sheet view
  const [newRow, setNewRow] = useState({
    date: '',
    time: '',
    title: '',
    location: '',
    category: 'personal',
    color: 'blue',
    description: ''
  })

  // Fetch events from Supabase when component loads or couple changes
  useEffect(() => {
    if (coupleId) {
      fetchEvents()
    }
  }, [coupleId])

  // Set up real-time subscription for events
  useEffect(() => {
    if (!coupleId) return

    console.log('Setting up real-time subscription for couple:', coupleId)

    // Subscribe to changes in the events table for this couple
    const channel = supabase
      .channel('events_changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'events',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload) => {
          console.log('🔥 Real-time event received:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            console.log('Adding new event:', payload.new)
            setEvents((currentEvents) => [...currentEvents, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            console.log('Updating event:', payload.new)
            setEvents((currentEvents) =>
              currentEvents.map((event) =>
                event.id === payload.new.id ? payload.new : event
              )
            )
          } else if (payload.eventType === 'DELETE') {
            console.log('Deleting event:', payload.old)
            setEvents((currentEvents) =>
              currentEvents.filter((event) => event.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Subscription status:', status, err)
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('Cleaning up real-time subscription')
      supabase.removeChannel(channel)
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

  // Handle cell click in sheet view
  const handleCellClick = (eventId, field, currentValue) => {
    setEditingCell({ eventId, field })
    setEditValue(currentValue || '')
  }

  // Handle cell blur (save changes)
  const handleCellBlur = async (eventId, field) => {
    if (editValue !== null && editValue !== undefined) {
      await updateEvent(eventId, { [field]: editValue })
    }
    setEditingCell(null)
    setEditValue('')
  }

  // Handle adding new row from sheet
  const handleAddNewRow = async () => {
    if (!newRow.title || !newRow.date) {
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
          ...newRow,
          couple_id: coupleId,
          created_by: user.id
        }])
        .select()

      if (error) throw error

      setEvents([...events, ...data])
      setNewRow({
        date: '',
        time: '',
        title: '',
        location: '',
        category: 'personal',
        color: 'blue',
        description: ''
      })
    } catch (error) {
      console.log('Error adding event:', error.message)
      alert(`Failed to add event: ${error.message}`)
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
                  {dayEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`event-pill event-${event.color} ${event.created_by === user?.id ? 'partner-a' : 'partner-b'}`}
                      title={event.title}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEventClick(event)
                      }}
                    >
                      {event.title.substring(0, 12)}
                      {event.title.length > 12 ? '...' : ''}
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
    // Generate dates from today onwards for the current month
    const getDatesForMonth = () => {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const today = new Date()
      today.setHours(0, 0, 0, 0) // Reset time to compare dates only

      const dates = []
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)

        // Only show today and future dates
        if (date >= today) {
          const dateStr = date.toISOString().split('T')[0]

          // Find event for this date
          const event = events.find(e => e.date === dateStr)

          dates.push({
            date: dateStr,
            dateObj: date,
            event: event || null
          })
        }
      }
      return dates
    }

    const monthDates = getDatesForMonth()

    // AI-powered event parsing
    const parseEventText = (text) => {
      // Simple pattern matching for time (HH:MM, H:MM AM/PM, etc)
      const timePatterns = [
        /(\d{1,2}):(\d{2})\s*(am|pm)?/i,
        /(\d{1,2})\s*(am|pm)/i,
        /at\s+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i
      ]

      let time = ''
      let cleanTitle = text

      for (const pattern of timePatterns) {
        const match = text.match(pattern)
        if (match) {
          time = match[0].replace('at ', '').trim()
          cleanTitle = text.replace(match[0], '').trim()
          break
        }
      }

      // Extract location (words after "at", "@", "in")
      const locationPattern = /(?:at|@|in)\s+([^,\d]+?)(?:\s+\d|$|,)/i
      const locationMatch = text.match(locationPattern)
      let location = ''
      if (locationMatch && !time.includes(locationMatch[0])) {
        location = locationMatch[1].trim()
        cleanTitle = cleanTitle.replace(locationMatch[0], '').replace(location, '').trim()
      }

      // Determine category based on keywords
      const textLower = text.toLowerCase()
      let category = 'personal'
      let color = 'blue'

      if (textLower.includes('work') || textLower.includes('meeting') || textLower.includes('office')) {
        category = 'work'
        color = 'orange'
      } else if (textLower.includes('date') || textLower.includes('dinner') || textLower.includes('movie') || textLower.includes('restaurant')) {
        category = 'date'
        color = 'red'
      } else if (textLower.includes('doctor') || textLower.includes('gym') || textLower.includes('workout') || textLower.includes('health')) {
        category = 'health'
        color = 'green'
      }

      return {
        title: cleanTitle || text,
        time,
        location,
        category,
        color
      }
    }

    // Handle updating or creating event for a specific date
    const handleCellChange = async (dateStr, field, value) => {
      const existingEvent = events.find(e => e.date === dateStr)

      if (existingEvent) {
        // Update existing event title (re-parse if needed)
        if (field === 'title') {
          const parsed = parseEventText(value)
          await updateEvent(existingEvent.id, {
            title: parsed.title,
            time: parsed.time || existingEvent.time,
            location: parsed.location || existingEvent.location,
            category: parsed.category,
            color: parsed.color
          })
        } else {
          await updateEvent(existingEvent.id, { [field]: value })
        }
      } else {
        // Create new event if title is being added
        if (field === 'title' && value.trim()) {
          if (!coupleId || !user) return

          const parsed = parseEventText(value)

          try {
            const { data, error } = await supabase
              .from('events')
              .insert([{
                date: dateStr,
                title: parsed.title,
                time: parsed.time,
                location: parsed.location,
                category: parsed.category,
                color: parsed.color,
                description: '',
                couple_id: coupleId,
                created_by: user.id
              }])
              .select()

            if (error) throw error
            setEvents([...events, ...data])
          } catch (error) {
            console.log('Error creating event:', error.message)
          }
        }
      }
    }

    return (
      <div className="sheet-view">
        <div className="calendar-header">
          <button onClick={goToPreviousMonth} className="btn-nav">←</button>
          <h3>{formatDate(currentDate)}</h3>
          <button onClick={goToNextMonth} className="btn-nav">→</button>
          <button onClick={goToToday} className="btn btn-secondary">Today</button>
        </div>

        <div className="sheet-hint">
          💡 Type in free text like "Dinner at 7pm at Mario's" - AI will auto-detect time, location & category
        </div>

        <table className="events-table editable-sheet google-sheet-style three-column">
          <thead>
            <tr>
              <th className="date-column">Date</th>
              <th className="event-column">Partner A</th>
              <th className="event-column">Partner B</th>
            </tr>
          </thead>
          <tbody>
            {monthDates.map(({ date, dateObj }) => {
              const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
              const isToday = dateObj.toDateString() === new Date().toDateString()
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6

              // Find events for this date
              const dateEvents = events.filter(e => e.date === date)
              const partnerAEvent = dateEvents[0] || null
              const partnerBEvent = dateEvents[1] || null

              const editingA = editingCell?.date === date && editingCell?.partner === 'A'
              const editingB = editingCell?.date === date && editingCell?.partner === 'B'

              return (
                <tr
                  key={date}
                  className={`
                    ${isToday ? 'today-row' : ''}
                    ${isWeekend ? 'weekend-row' : ''}
                  `}
                >
                  <td className="date-column">
                    <div className="date-display">
                      {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      <span className={`day-name ${isWeekend ? 'weekend' : ''}`}>({dayName})</span>
                    </div>
                  </td>

                  {/* Partner A Column */}
                  <td className={`editable-cell event-text-cell ${partnerAEvent ? `event-${partnerAEvent.color}` : ''}`}>
                    {editingA ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={async () => {
                          if (editValue.trim() && partnerAEvent) {
                            const parsed = parseEventText(editValue)
                            await updateEvent(partnerAEvent.id, {
                              title: parsed.title,
                              time: parsed.time,
                              location: parsed.location,
                              category: parsed.category,
                              color: parsed.color
                            })
                          }
                          setEditingCell(null)
                          setEditValue('')
                        }}
                        autoFocus
                        className="sheet-input-inline event-input"
                      />
                    ) : partnerAEvent ? (
                      <div
                        className="event-display clickable"
                        onClick={() => {
                          setEditingCell({ date, partner: 'A' })
                          const fullText = `${partnerAEvent.time || ''} ${partnerAEvent.title} ${partnerAEvent.location ? 'at ' + partnerAEvent.location : ''}`.trim()
                          setEditValue(fullText)
                        }}
                        title="Click to edit"
                      >
                        {partnerAEvent.time && <span className="event-time">{partnerAEvent.time}</span>}
                        <span className="event-title">{partnerAEvent.title}</span>
                        {partnerAEvent.location && <span className="event-location">at {partnerAEvent.location}</span>}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={inputValues[`${date}-A`] || ''}
                        onChange={(e) => setInputValues({ ...inputValues, [`${date}-A`]: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleCellChange(date, 'title', e.target.value)
                            setInputValues({ ...inputValues, [`${date}-A`]: '' })
                          }
                        }}
                        className="sheet-input-inline event-input"
                      />
                    )}
                    {partnerAEvent && !editingA && (
                      <button
                        onClick={() => deleteEvent(partnerAEvent.id)}
                        className="btn-delete-inline"
                        title="Delete event"
                      >
                        ✕
                      </button>
                    )}
                  </td>

                  {/* Partner B Column */}
                  <td className={`editable-cell event-text-cell ${partnerBEvent ? `event-${partnerBEvent.color}` : ''}`}>
                    {editingB ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={async () => {
                          if (editValue.trim() && partnerBEvent) {
                            const parsed = parseEventText(editValue)
                            await updateEvent(partnerBEvent.id, {
                              title: parsed.title,
                              time: parsed.time,
                              location: parsed.location,
                              category: parsed.category,
                              color: parsed.color
                            })
                          }
                          setEditingCell(null)
                          setEditValue('')
                        }}
                        autoFocus
                        className="sheet-input-inline event-input"
                      />
                    ) : partnerBEvent ? (
                      <div
                        className="event-display clickable"
                        onClick={() => {
                          setEditingCell({ date, partner: 'B' })
                          const fullText = `${partnerBEvent.time || ''} ${partnerBEvent.title} ${partnerBEvent.location ? 'at ' + partnerBEvent.location : ''}`.trim()
                          setEditValue(fullText)
                        }}
                        title="Click to edit"
                      >
                        {partnerBEvent.time && <span className="event-time">{partnerBEvent.time}</span>}
                        <span className="event-title">{partnerBEvent.title}</span>
                        {partnerBEvent.location && <span className="event-location">at {partnerBEvent.location}</span>}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={inputValues[`${date}-B`] || ''}
                        onChange={(e) => setInputValues({ ...inputValues, [`${date}-B`]: e.target.value })}
                        onBlur={(e) => {
                          if (e.target.value.trim()) {
                            handleCellChange(date, 'title', e.target.value)
                            setInputValues({ ...inputValues, [`${date}-B`]: '' })
                          }
                        }}
                        className="sheet-input-inline event-input"
                      />
                    )}
                    {partnerBEvent && !editingB && (
                      <button
                        onClick={() => deleteEvent(partnerBEvent.id)}
                        className="btn-delete-inline"
                        title="Delete event"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header-section">
        <div className="calendar-title-row">
          <h2>Our Calendar</h2>
          <button
            onClick={() => setShowEventForm(!showEventForm)}
            className="btn btn-add-event"
          >
            + Add Event
          </button>
        </div>

        <div className="view-controls-row">
          {/* View Mode Toggle */}
          <div className="view-toggle-group">
            <button
              className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
            >
              📅 Calendar
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'sheet' ? 'active' : ''}`}
              onClick={() => setViewMode('sheet')}
            >
              📋 Sheet
            </button>
          </div>

        </div>
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

      {/* Render appropriate view */}
      {viewMode === 'calendar' && calendarView === 'month' && renderMonthView()}
      {viewMode === 'calendar' && calendarView === 'week' && renderWeekView()}
      {viewMode === 'calendar' && calendarView === 'day' && renderDayView()}
      {viewMode === 'sheet' && renderSheetView()}
    </div>
  )
}

export default Calendar
