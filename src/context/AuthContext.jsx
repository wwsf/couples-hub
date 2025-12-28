import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import * as authService from '../services/authService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session
    authService.getCurrentSession().then((session) => {
      setSession(session)
      setUser(session?.user || null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        setSession(session)
        setUser(session?.user || null)
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  // Function to create couple relationship for current user
  const createCoupleRelationship = async () => {
    if (!user) return { success: false, error: 'Not authenticated' }

    try {
      const { data: coupleId, error } = await supabase
        .rpc('create_couple_relationship_for_user', {
          user_id: user.id
        })

      if (error) throw error

      return { success: true, coupleId }
    } catch (error) {
      console.error('Error creating couple relationship:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    session,
    loading,
    signUp: authService.signUp,
    signIn: authService.signIn,
    signOut: authService.signOut,
    invitePartner: authService.invitePartner,
    acceptInvitation: authService.acceptInvitation,
    createCoupleRelationship
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
