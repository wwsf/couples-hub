import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import '../styles/BillsTracker.css'

const BillsTracker = () => {
  const { user } = useAuth()
  const { coupleId } = useCouple()

  const [bills, setBills] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    bill_type: 'electricity',
    amount: '',
    due_date: '',
    recurring: false,
    recurrence_period: 'monthly',
    payment_status: 'pending'
  })

  // Bill types with icons
  const billTypes = {
    electricity: { icon: '⚡', label: 'Electricity' },
    water: { icon: '💧', label: 'Water' },
    gas: { icon: '🔥', label: 'Gas' },
    internet: { icon: '🌐', label: 'Internet' },
    rent: { icon: '🏠', label: 'Rent' },
    phone: { icon: '📱', label: 'Phone' },
    insurance: { icon: '🛡️', label: 'Insurance' },
    subscription: { icon: '📺', label: 'Subscription' },
    other: { icon: '📄', label: 'Other' }
  }

  // Fetch bills from Supabase
  useEffect(() => {
    if (coupleId) {
      fetchBills()
    }
  }, [coupleId])

  // Set up real-time subscription for bills
  useEffect(() => {
    if (!coupleId) return

    console.log('Setting up real-time subscription for bills')

    const channel = supabase
      .channel('bills_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bills',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload) => {
          console.log('🔥 Bills real-time event:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            setBills((current) => [...current, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setBills((current) =>
              current.map((bill) =>
                bill.id === payload.new.id ? payload.new : bill
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setBills((current) =>
              current.filter((bill) => bill.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Bills subscription status:', status, err)
      })

    return () => {
      console.log('Cleaning up bills subscription')
      supabase.removeChannel(channel)
    }
  }, [coupleId])

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('couple_id', coupleId)
        .order('due_date', { ascending: true })

      if (error) throw error
      setBills(data || [])
    } catch (error) {
      console.log('Error fetching bills:', error.message)
    }
  }

  const addBill = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.amount || !formData.due_date || !coupleId || !user) return

    try {
      const { data, error } = await supabase
        .from('bills')
        .insert([{
          name: formData.name.trim(),
          bill_type: formData.bill_type,
          amount: parseFloat(formData.amount),
          due_date: formData.due_date,
          recurring: formData.recurring,
          recurrence_period: formData.recurring ? formData.recurrence_period : null,
          payment_status: formData.payment_status,
          couple_id: coupleId,
          created_by: user.id
        }])
        .select()

      if (error) throw error

      // Reset form
      setFormData({
        name: '',
        bill_type: 'electricity',
        amount: '',
        due_date: '',
        recurring: false,
        recurrence_period: 'monthly',
        payment_status: 'pending'
      })
      setShowAddForm(false)
    } catch (error) {
      console.log('Error adding bill:', error.message)
      alert(`Failed to add bill: ${error.message}`)
    }
  }

  const togglePaymentStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'paid' ? 'pending' : 'paid'

    try {
      const { error } = await supabase
        .from('bills')
        .update({
          payment_status: newStatus,
          paid_date: newStatus === 'paid' ? new Date().toISOString() : null,
          paid_by: newStatus === 'paid' ? user.id : null
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.log('Error toggling payment status:', error.message)
    }
  }

  const deleteBill = async (id) => {
    if (!window.confirm('Delete this bill?')) return

    try {
      const { error } = await supabase
        .from('bills')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.log('Error deleting bill:', error.message)
    }
  }

  // Filter bills
  const filteredBills = bills.filter(bill => {
    if (filterStatus === 'all') return true
    return bill.payment_status === filterStatus
  })

  // Calculate totals
  const totalAmount = filteredBills.reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)
  const paidAmount = filteredBills
    .filter(b => b.payment_status === 'paid')
    .reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)
  const pendingAmount = filteredBills
    .filter(b => b.payment_status === 'pending')
    .reduce((sum, bill) => sum + parseFloat(bill.amount || 0), 0)

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isOverdue = (bill) => {
    if (bill.payment_status === 'paid') return false
    const today = new Date()
    const dueDate = new Date(bill.due_date)
    return dueDate < today
  }

  return (
    <div className="bills-container">
      <div className="bills-header">
        <div>
          <h2>💳 Bills Tracker</h2>
          <p className="bills-stats">
            Total: ${totalAmount.toFixed(2)} · Paid: ${paidAmount.toFixed(2)} · Pending: ${pendingAmount.toFixed(2)}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary"
        >
          {showAddForm ? 'Cancel' : '+ Add Bill'}
        </button>
      </div>

      {/* Add Bill Form */}
      {showAddForm && (
        <form onSubmit={addBill} className="bill-form">
          <div className="form-row">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Bill name (e.g., Electric Company)"
              className="input-field"
              required
            />
            <select
              value={formData.bill_type}
              onChange={(e) => setFormData({ ...formData, bill_type: e.target.value })}
              className="bill-type-select"
            >
              {Object.entries(billTypes).map(([key, type]) => (
                <option key={key} value={key}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Amount"
              className="input-field amount-input"
              required
            />
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="input-field"
              required
            />
          </div>

          <div className="form-row recurring-row">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.recurring}
                onChange={(e) => setFormData({ ...formData, recurring: e.target.checked })}
              />
              Recurring bill
            </label>
            {formData.recurring && (
              <select
                value={formData.recurrence_period}
                onChange={(e) => setFormData({ ...formData, recurrence_period: e.target.value })}
                className="recurrence-select"
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            )}
          </div>

          <button type="submit" className="btn btn-primary">
            Add Bill
          </button>
        </form>
      )}

      {/* Filter Controls */}
      <div className="bills-controls">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Bills</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Bills List */}
      {filteredBills.length === 0 ? (
        <div className="empty-state">
          {bills.length === 0 ? (
            <>No bills added yet. Click "Add Bill" to get started!</>
          ) : (
            <>No bills match your filter.</>
          )}
        </div>
      ) : (
        <div className="bills-list">
          {filteredBills.map((bill) => {
            const overdue = isOverdue(bill)
            const billType = billTypes[bill.bill_type] || billTypes.other

            return (
              <div
                key={bill.id}
                className={`bill-item ${bill.payment_status} ${overdue ? 'overdue' : ''}`}
              >
                <div className="bill-icon">{billType.icon}</div>

                <div className="bill-details">
                  <div className="bill-name">
                    {bill.name}
                    {bill.recurring && <span className="recurring-badge">🔄 Recurring</span>}
                  </div>
                  <div className="bill-meta">
                    <span className="bill-type">{billType.label}</span>
                    {bill.recurring && (
                      <span className="recurrence-info">
                        · {bill.recurrence_period}
                      </span>
                    )}
                  </div>
                </div>

                <div className="bill-amount">
                  ${parseFloat(bill.amount).toFixed(2)}
                </div>

                <div className="bill-due-date">
                  <span className={overdue ? 'overdue-text' : ''}>
                    {overdue && '⚠️ '}
                    {formatDate(bill.due_date)}
                  </span>
                </div>

                <div className="bill-actions">
                  <button
                    onClick={() => togglePaymentStatus(bill.id, bill.payment_status)}
                    className={`btn-status ${bill.payment_status}`}
                  >
                    {bill.payment_status === 'paid' ? '✓ Paid' : 'Mark Paid'}
                  </button>
                  <button
                    onClick={() => deleteBill(bill.id)}
                    className="btn-delete-bill"
                    title="Delete bill"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default BillsTracker
