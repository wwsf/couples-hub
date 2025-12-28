import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'
import { useAuth } from '../context/AuthContext'
import { useCouple } from '../context/CoupleContext'
import '../styles/TodoList.css'

function TodoList() {
  const { user } = useAuth()
  const { coupleId, isActive } = useCouple()
  const [todos, setTodos] = useState([])
  const [newTodo, setNewTodo] = useState('')

  // Fetch todos when component loads or couple changes
  useEffect(() => {
    if (coupleId) {
      fetchTodos()
    }
  }, [coupleId])

  // Get all todos from database
  const fetchTodos = async () => {
    if (!coupleId) return

    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('couple_id', coupleId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTodos(data || [])
    } catch (error) {
      console.log('Error fetching todos:', error.message)
    }
  }

  // Add a new todo
  const addTodo = async (e) => {
    e.preventDefault()

    if (!newTodo.trim()) {
      alert('Please enter a todo')
      return
    }

    if (!coupleId || !user) {
      alert('Unable to add todo. Please try refreshing the page.')
      return
    }

    try {
      const { data, error } = await supabase
        .from('todos')
        .insert([{
          text: newTodo,
          completed: false,
          couple_id: coupleId,
          created_by: user.id
        }])
        .select()

      if (error) throw error

      setTodos([...data, ...todos])
      setNewTodo('')
    } catch (error) {
      console.log('Error adding todo:', error.message)
      alert(`Failed to add todo: ${error.message}`)
    }
  }

  // Toggle todo completion status
  const toggleTodo = async (id, completed) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ completed: !completed })
        .eq('id', id)

      if (error) throw error

      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    } catch (error) {
      console.log('Note: Connect Supabase to update todos', error.message)
      setTodos(todos.map(todo =>
        todo.id === id ? { ...todo, completed: !completed } : todo
      ))
    }
  }

  // Delete a todo
  const deleteTodo = async (id) => {
    try {
      const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTodos(todos.filter(todo => todo.id !== id))
    } catch (error) {
      console.log('Note: Connect Supabase to delete todos', error.message)
      setTodos(todos.filter(todo => todo.id !== id))
    }
  }

  return (
    <div className="todo-container">
      <h2>Our Todo List</h2>

      {/* Add Todo Form */}
      <form onSubmit={addTodo} className="todo-form">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          className="input-field"
        />
        <button type="submit" className="btn btn-primary">Add</button>
      </form>

      {/* Todos List */}
      <div className="todos-list">
        {todos.length === 0 ? (
          <p className="empty-state">No todos yet. Add your first task above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, todo.completed)}
                className="todo-checkbox"
              />
              <span className="todo-text">{todo.text}</span>
              <button
                onClick={() => deleteTodo(todo.id)}
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

export default TodoList
