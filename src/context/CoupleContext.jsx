import { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import * as authService from '../services/authService'

const CoupleContext = createContext({})

export const useCouple = () => {
  const context = useContext(CoupleContext)
  if (!context) {
    throw new Error('useCouple must be used within CoupleProvider')
  }
  return context
}

export function CoupleProvider({ children }) {
  const { user } = useAuth()
  const [couple, setCouple] = useState(null)
  const [partner, setPartner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setCouple(null)
      setPartner(null)
      setLoading(false)
      return
    }

    // Fetch couple relationship and partner profile
    const fetchCoupleData = async () => {
      setLoading(true)

      const coupleData = await authService.getCoupleRelationship()
      console.log('Couple data:', coupleData)
      setCouple(coupleData)

      if (coupleData && coupleData.status === 'active') {
        const partnerData = await authService.getPartnerProfile()
        setPartner(partnerData)
      }

      setLoading(false)
    }

    fetchCoupleData()
  }, [user])

  const value = {
    couple,
    partner,
    loading,
    isActive: couple?.status === 'active',
    isPending: couple?.status === 'pending',
    coupleId: couple?.id
  }

  return (
    <CoupleContext.Provider value={value}>
      {children}
    </CoupleContext.Provider>
  )
}
