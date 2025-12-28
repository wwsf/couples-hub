import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import Calendar from '../components/Calendar'
import TodoList from '../components/TodoList'
import GroceryList from '../components/GroceryList'
import BillsTracker from '../components/BillsTracker'
import './HomePage.css'

function HomePage() {
  const { user, signOut, invitePartner, createCoupleRelationship } = useAuth()
  const { couple, partner, loading, isActive, isPending } = useCouple()
  const [activeTab, setActiveTab] = useState('calendar')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [partnerEmail, setPartnerEmail] = useState('')
  const [inviteMessage, setInviteMessage] = useState(null)

  const handleInvite = async (e) => {
    e.preventDefault()
    const result = await invitePartner(partnerEmail)

    if (result.success) {
      setInviteMessage(result.message)
      setPartnerEmail('')
    } else {
      setInviteMessage(`Error: ${result.error}`)
    }
  }

  const handleSignOut = async () => {
    await signOut()
  }

  const handleCreateCouple = async () => {
    const result = await createCoupleRelationship()
    if (result.success) {
      alert('Couple relationship created! Refreshing page...')
      window.location.reload()
    } else {
      alert(`Error: ${result.error}`)
    }
  }

  return (
    <div className="home-page">
      {/* Header */}
      <header className="app-header">
        <div className="header-left">
          <h1>Couples Hub</h1>
          {isActive && partner && (
            <div className="partner-badge partner-connected">
              <span className="heart-icon">❤️</span>
              <span>Connected with {partner.display_name || partner.email.split('@')[0]}</span>
            </div>
          )}
          {!isActive && !loading && (
            <div className="partner-badge partner-solo">
              <span className="solo-icon">👤</span>
              <span>Solo mode</span>
            </div>
          )}
        </div>
        <div className="header-right">
          {!isActive && !loading && (
            <button
              onClick={() => setShowInviteForm(true)}
              className="btn-invite-partner"
            >
              + Invite Partner
            </button>
          )}
          <button onClick={handleSignOut} className="btn-signout">
            Sign Out
          </button>
        </div>
      </header>

      {/* Horizontal Navigation */}
      <nav className="horizontal-nav">
        <button
          className={`nav-item ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span className="nav-icon">📅</span>
          Calendar
        </button>
        <button
          className={`nav-item ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          <span className="nav-icon">📋</span>
          Todos
        </button>
        <button
          className={`nav-item ${activeTab === 'groceries' ? 'active' : ''}`}
          onClick={() => setActiveTab('groceries')}
        >
          <span className="nav-icon">🛒</span>
          Groceries
        </button>
        <button
          className={`nav-item ${activeTab === 'bills' ? 'active' : ''}`}
          onClick={() => setActiveTab('bills')}
        >
          <span className="nav-icon">📄</span>
          Bills
        </button>
      </nav>

      {/* Partner Invite Modal - Only shown when user clicks invite button */}
      {showInviteForm && !isActive && (
        <div className="setup-modal">
          <div className="setup-content">
            <h3>👫 Invite Your Partner</h3>
            <p>Share your Couples Hub with your partner. They can sign up using the email you invite them with!</p>
            <form onSubmit={handleInvite} className="invite-form-inline">
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="Partner's email"
                required
                className="input-field"
              />
              <button type="submit" className="btn btn-primary">
                Send Invitation
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteMessage(null)
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
            </form>
            {inviteMessage && (
              <div className="invite-message">{inviteMessage}</div>
            )}
          </div>
        </div>
      )}

      {/* Setup Modal - Only for users without couple profile */}
      {!couple && !loading && (
        <div className="setup-modal">
          <div className="setup-content">
            <h3>Welcome to Couples Hub! 👋</h3>
            <p>Let's get you started. You can use the app solo or invite your partner later.</p>
            <button onClick={handleCreateCouple} className="btn btn-primary">
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'todos' && <TodoList />}
        {activeTab === 'groceries' && <GroceryList />}
        {activeTab === 'bills' && <BillsTracker />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with love for couples ❤️</p>
      </footer>
    </div>
  )
}

export default HomePage
