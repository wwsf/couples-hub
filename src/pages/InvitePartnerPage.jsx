import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './InvitePartnerPage.css'

function InvitePartnerPage() {
  const { token } = useParams()
  const { acceptInvitation } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await acceptInvitation(token, email, password, displayName)

      if (result.success) {
        navigate('/')
      } else {
        setError(result.error || 'Failed to accept invitation')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="invite-page">
      <div className="invite-container">
        <div className="invite-header">
          <h1>💕</h1>
          <h2>You're Invited!</h2>
          <p>Your partner has invited you to join Couples Hub</p>
        </div>

        <div className="invite-card">
          <h3>Create Your Account</h3>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="invite-form">
            <div className="form-group">
              <label htmlFor="displayName">Your Name</label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you?"
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Create Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                required
                minLength={6}
                className="input-field"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Join Your Partner'}
            </button>
          </form>

          <div className="invite-footer">
            <p>By joining, you'll be able to share calendars, todos, and more!</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InvitePartnerPage
