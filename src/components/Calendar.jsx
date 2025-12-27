import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import '../styles/Calendar.css'

function Calendar() {
  const [events, setEvents] = useState([])
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' })
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Fetch events from Supabase when component loads
  useEffect(() => {
    fetchEvents()
  }, [])

  // Function to get events from database
  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })

      if (error) throw error
      setEvents(data || [])
    } catch (error) {
      console.log('Note: Connect Supabase to fetch events', error.message)
    }
  }

  // Function to add a new event
  const addEvent = async (e) => {
    e.preventDefault()

    if (!newEvent.title || !newEvent.date) {
      alert('Please fill in at least title and date')
      return
    }

    try {
      const { data, error } = await supabase
        .from('events')
        .insert([newEvent])
        .select()

      if (error) throw error

      setEvents([...events, ...data])
      setNewEvent({ title: '', date: '', time: '' })
    } catch (error) {
      console.log('Note: Connect Supabase to add events', error.message)
      // For now, add locally without database
      setEvents([...events, { ...newEvent, id: Date.now() }])
      setNewEvent({ title: '', date: '', time: '' })
    }
  }

  // Function to delete an event
  const deleteEvent = async (id) => {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      setEvents(events.filter(event => event.id !== id))
    } catch (error) {
      console.log('Note: Connect Supabase to delete events', error.message)
      setEvents(events.filter(event => event.id !== id))
    }
  }

  return (
    <div className="calendar-container">
      <h2>Our Calendar</h2>

      {/* Add Event Form */}
      <form onSubmit={addEvent} className="event-form">
        <input
          type="text"
          placeholder="Event title"
          value={newEvent.title}
          onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
          className="input-field"
        />
        <input
          type="date"
          value={newEvent.date}
          onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
          className="input-field"
        />
        <input
          type="time"
          value={newEvent.time}
          onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
          className="input-field"
        />
        <button type="submit" className="btn btn-primary">Add Event</button>
      </form>

      {/* Events List */}
      <div className="events-list">
        <h3>Upcoming Events</h3>
        {events.length === 0 ? (
          <p className="empty-state">No events yet. Add your first event above!</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-card">
              <div className="event-info">
                <h4>{event.title}</h4>
                <p>
                  {new Date(event.date).toLocaleDateString()}
                  {event.time && ` at ${event.time}`}
                </p>
              </div>
              <button
                onClick={() => deleteEvent(event.id)}
                className="btn btn-delete"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Calendar
