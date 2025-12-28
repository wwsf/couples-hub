import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import '../styles/GroceryList.css'

const GroceryList = () => {
  const { user } = useAuth()
  const { coupleId } = useCouple()

  const [items, setItems] = useState([])
  const [newItemName, setNewItemName] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('other')
  const [filterCategory, setFilterCategory] = useState('all')
  const [showChecked, setShowChecked] = useState(true)

  // Category configuration with icons and colors
  const categories = {
    produce: { icon: '🥬', label: 'Produce', color: '#7ED321' },
    dairy: { icon: '🥛', label: 'Dairy', color: '#4A90E2' },
    meat: { icon: '🥩', label: 'Meat', color: '#E74C3C' },
    pantry: { icon: '🥫', label: 'Pantry', color: '#F39C12' },
    frozen: { icon: '🧊', label: 'Frozen', color: '#4A90E2' },
    beverages: { icon: '🥤', label: 'Beverages', color: '#9B59B6' },
    snacks: { icon: '🍪', label: 'Snacks', color: '#F39C12' },
    household: { icon: '🧼', label: 'Household', color: '#5a6c7d' },
    other: { icon: '📦', label: 'Other', color: '#666' }
  }

  // Fetch grocery items from Supabase
  useEffect(() => {
    if (coupleId) {
      fetchItems()
    }
  }, [coupleId])

  // Set up real-time subscription for grocery items
  useEffect(() => {
    if (!coupleId) return

    console.log('Setting up real-time subscription for grocery items')

    const channel = supabase
      .channel('grocery_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'grocery_items',
          filter: `couple_id=eq.${coupleId}`
        },
        (payload) => {
          console.log('🔥 Grocery real-time event:', payload.eventType, payload)

          if (payload.eventType === 'INSERT') {
            setItems((current) => [...current, payload.new])
          } else if (payload.eventType === 'UPDATE') {
            setItems((current) =>
              current.map((item) =>
                item.id === payload.new.id ? payload.new : item
              )
            )
          } else if (payload.eventType === 'DELETE') {
            setItems((current) =>
              current.filter((item) => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe((status, err) => {
        console.log('Grocery subscription status:', status, err)
      })

    return () => {
      console.log('Cleaning up grocery subscription')
      supabase.removeChannel(channel)
    }
  }, [coupleId])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.log('Error fetching grocery items:', error.message)
    }
  }

  const addItem = async (e) => {
    e.preventDefault()
    if (!newItemName.trim() || !coupleId || !user) return

    try {
      const { data, error } = await supabase
        .from('grocery_items')
        .insert([{
          name: newItemName.trim(),
          category: selectedCategory,
          couple_id: coupleId,
          created_by: user.id,
          checked: false
        }])
        .select()

      if (error) throw error

      setNewItemName('')
      setSelectedCategory('other')
    } catch (error) {
      console.log('Error adding item:', error.message)
      alert(`Failed to add item: ${error.message}`)
    }
  }

  const toggleItem = async (id, currentChecked) => {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .update({
          checked: !currentChecked,
          checked_by: !currentChecked ? user.id : null,
          checked_at: !currentChecked ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.log('Error toggling item:', error.message)
    }
  }

  const deleteItem = async (id) => {
    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.log('Error deleting item:', error.message)
    }
  }

  const clearCompleted = async () => {
    if (!window.confirm('Remove all checked items?')) return

    try {
      const { error } = await supabase
        .from('grocery_items')
        .delete()
        .eq('couple_id', coupleId)
        .eq('checked', true)

      if (error) throw error
    } catch (error) {
      console.log('Error clearing completed items:', error.message)
    }
  }

  // Filter items
  const filteredItems = items.filter(item => {
    if (!showChecked && item.checked) return false
    if (filterCategory !== 'all' && item.category !== filterCategory) return false
    return true
  })

  // Group items by category
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    acc[item.category].push(item)
    return acc
  }, {})

  const uncheckedCount = items.filter(item => !item.checked).length
  const checkedCount = items.filter(item => item.checked).length

  return (
    <div className="grocery-container">
      <div className="grocery-header">
        <div>
          <h2>🛒 Grocery List</h2>
          <p className="grocery-stats">
            {uncheckedCount} to buy · {checkedCount} checked
          </p>
        </div>
        <div className="grocery-actions">
          {checkedCount > 0 && (
            <button onClick={clearCompleted} className="btn btn-secondary">
              Clear Checked ({checkedCount})
            </button>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={addItem} className="grocery-form">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Add grocery item..."
          className="input-field"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          {Object.entries(categories).map(([key, cat]) => (
            <option key={key} value={key}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>

      {/* Filter Controls */}
      <div className="grocery-controls">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Categories</option>
          {Object.entries(categories).map(([key, cat]) => (
            <option key={key} value={key}>
              {cat.icon} {cat.label}
            </option>
          ))}
        </select>
        <label className="show-checked-toggle">
          <input
            type="checkbox"
            checked={showChecked}
            onChange={(e) => setShowChecked(e.target.checked)}
          />
          Show checked items
        </label>
      </div>

      {/* Grocery List */}
      {filteredItems.length === 0 ? (
        <div className="empty-state">
          {items.length === 0 ? (
            <>Your grocery list is empty. Add items above!</>
          ) : (
            <>No items match your filters.</>
          )}
        </div>
      ) : (
        <div className="grocery-list">
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <div key={category} className="category-section">
              <h3 className="category-header" style={{ borderLeftColor: categories[category].color }}>
                <span className="category-icon">{categories[category].icon}</span>
                {categories[category].label}
                <span className="category-count">({categoryItems.length})</span>
              </h3>
              <div className="category-items">
                {categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className={`grocery-item ${item.checked ? 'checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleItem(item.id, item.checked)}
                      className="grocery-checkbox"
                    />
                    <span className="item-name">{item.name}</span>
                    {item.quantity && (
                      <span className="item-quantity">{item.quantity}</span>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="btn-delete-item"
                      title="Remove item"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default GroceryList
