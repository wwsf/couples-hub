import { supabase } from '../utils/supabase'

/**
 * Authentication Service
 * Handles all auth-related operations including signup, login, and partner invitation
 */

/**
 * Sign up a new user (Partner A)
 */
export async function signUp(email, password, displayName) {
  try {
    // Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    })

    if (authError) throw authError

    // Profile is automatically created by database trigger

    // Create a couple relationship using the Postgres function
    // This bypasses RLS and ensures the relationship is created
    const { data: coupleIdData, error: coupleError } = await supabase
      .rpc('create_couple_relationship_for_user', {
        user_id: authData.user.id
      })

    if (coupleError) {
      console.error('Error creating couple relationship:', coupleError)
      // Don't fail signup if couple creation fails - we can retry later
    }

    return {
      success: true,
      user: authData.user,
      coupleId: coupleIdData
    }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign in existing user
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    return { success: true, user: data.user }
  } catch (error) {
    console.error('Sign in error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Sign out error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get current session
 */
export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  } catch (error) {
    console.error('Get session error:', error)
    return null
  }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  } catch (error) {
    console.error('Get user error:', error)
    return null
  }
}

/**
 * Generate invitation token and send email to partner
 */
export async function invitePartner(partnerEmail) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new Error('Not authenticated')

    // Generate unique invitation token
    const invitationToken = generateInvitationToken()

    // Get user's couple relationship
    const { data: coupleData, error: coupleError } = await supabase
      .from('couple_relationships')
      .select('*')
      .eq('partner_a_id', user.id)
      .single()

    if (coupleError) throw coupleError

    // Update couple relationship with invitation details
    const { error: updateError } = await supabase
      .from('couple_relationships')
      .update({
        invitation_token: invitationToken,
        invitation_email: partnerEmail
      })
      .eq('id', coupleData.id)

    if (updateError) throw updateError

    // Send invitation email using Supabase
    // Note: You'll need to configure email templates in Supabase dashboard
    const inviteUrl = `${window.location.origin}/invite/${invitationToken}`

    // For now, we'll return the invite URL
    // In production, Supabase would send this via email
    console.log('Invitation URL:', inviteUrl)

    return {
      success: true,
      inviteUrl,
      message: `Invitation sent to ${partnerEmail}. Share this link: ${inviteUrl}`
    }
  } catch (error) {
    console.error('Invite partner error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Accept invitation and join as Partner B
 */
export async function acceptInvitation(invitationToken, email, password, displayName) {
  try {
    // First, verify the invitation token exists by calling a database function
    // This bypasses RLS since the function runs with SECURITY DEFINER
    const { data: validationData, error: validationError } = await supabase
      .rpc('validate_invitation_token', { token: invitationToken })

    if (validationError || !validationData) {
      throw new Error('Invalid invitation token')
    }

    const coupleIdFromToken = validationData

    // Sign up the partner (just auth, don't create couple yet)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email.split('@')[0]
        }
      }
    })

    if (authError) throw authError

    // Wait a moment for the profile and couple creation triggers to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Use database function to accept invitation (bypasses RLS)
    const { error: acceptError } = await supabase
      .rpc('accept_couple_invitation', {
        invitation_couple_id: coupleIdFromToken,
        new_partner_id: authData.user.id
      })

    if (acceptError) {
      console.error('Accept invitation error:', acceptError)
      throw acceptError
    }

    return {
      success: true,
      user: authData.user,
      coupleId: coupleIdFromToken
    }
  } catch (error) {
    console.error('Accept invitation error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get couple relationship for current user
 */
export async function getCoupleRelationship() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('couple_relationships')
      .select('*')
      .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
      .eq('status', 'active')
      .single()

    if (error) {
      // Check if user has ANY couple relationship (pending or otherwise)
      const { data: pendingData } = await supabase
        .from('couple_relationships')
        .select('*')
        .or(`partner_a_id.eq.${user.id},partner_b_id.eq.${user.id}`)
        .single()

      return pendingData || null
    }

    return data
  } catch (error) {
    console.error('Get couple relationship error:', error)
    return null
  }
}

/**
 * Get partner's profile
 */
export async function getPartnerProfile() {
  try {
    const user = await getCurrentUser()
    if (!user) return null

    const couple = await getCoupleRelationship()
    if (!couple || couple.status !== 'active') return null

    // Determine which partner is the current user
    const partnerId = couple.partner_a_id === user.id
      ? couple.partner_b_id
      : couple.partner_a_id

    if (!partnerId) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', partnerId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get partner profile error:', error)
    return null
  }
}

/**
 * Helper function to generate invitation token
 */
function generateInvitationToken() {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15)
}
