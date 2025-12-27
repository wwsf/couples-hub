import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Calendar from './components/Calendar'
import TodoList from './components/TodoList'
import './App.css'

function App() {
  const [activeTab, setActiveTab] = useState('calendar')

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <h1>Couples Hub</h1>
        <p>Your shared productivity space</p>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          Calendar
        </button>
        <button
          className={`nav-tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          Todos
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'todos' && <TodoList />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with love for couples</p>
      </footer>
    </div>
  )
}

export default App
