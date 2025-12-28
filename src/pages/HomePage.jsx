import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import Calendar from '../components/Calendar'
import TodoList from '../components/TodoList'
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
        <div className="header-content">
          <h1>Couples Hub</h1>
          <div className="header-actions">
            <span className="user-email">{user?.email}</span>
            <button onClick={handleSignOut} className="btn-signout">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Partner Status */}
      {loading ? (
        <div className="partner-status loading">
          <p>Loading partner info...</p>
        </div>
      ) : isPending ? (
        <div className="partner-status pending">
          <div className="status-content">
            <h3>👫 Invite Your Partner</h3>
            <p>Share your Couples Hub with your partner to get started!</p>

            {!showInviteForm ? (
              <button
                onClick={() => setShowInviteForm(true)}
                className="btn btn-primary"
              >
                Send Invitation
              </button>
            ) : (
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
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteForm(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </form>
            )}

            {inviteMessage && (
              <div className="invite-message">
                {inviteMessage}
              </div>
            )}
          </div>
        </div>
      ) : isActive && partner ? (
        <div className="partner-status active">
          <p>💕 Connected with {partner.display_name || partner.email}</p>
        </div>
      ) : !couple ? (
        <div className="partner-status pending">
          <div className="status-content">
            <h3>⚠️ Setup Required</h3>
            <p>Your couple relationship needs to be initialized.</p>
            <button onClick={handleCreateCouple} className="btn btn-primary">
              Initialize Couple Profile
            </button>
          </div>
        </div>
      ) : null}

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📅 Calendar
        </button>
        <button
          className={`nav-tab ${activeTab === 'todos' ? 'active' : ''}`}
          onClick={() => setActiveTab('todos')}
        >
          ✅ Todos
        </button>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'calendar' && <Calendar />}
        {activeTab === 'todos' && <TodoList />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built with love for couples ❤️</p>
      </footer>
    </div>
  )
}

export default HomePage
