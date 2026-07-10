import React, { useState, useEffect } from 'react';
import './App.css';

const API_URL = 'http://localhost:3001/todo';

const MOCK_TODOS = [
  { id: 1, title: 'NestJS va React Todo ilovasini ishga tushirish 🚀', completed: true },
  { id: 2, title: 'PostgreSQL bazasini sozlash 🐘', completed: false },
  { id: 3, title: 'Prisma migratsiyalarini bajarish 🛠️', completed: false },
  { id: 4, title: 'Birinchi vazifani muvaffaqiyatli yakunlash ✅', completed: false }
];

function App() {
  const [todos, setTodos] = useState([]);
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [filter, setFilter] = useState('all');
  const [theme, setTheme] = useState(() => {
    // Detect system theme or save preference
    const saved = localStorage.getItem('theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  const [isOffline, setIsOffline] = useState(false);
  const [showWarning, setShowWarning] = useState(true);

  // Fetch todos on component mount
  useEffect(() => {
    fetchTodos();
  }, []);

  // Update theme class on body
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch todos from the backend API
  const fetchTodos = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error('API server returned error');
      const data = await response.json();
      setTodos(data);
      setIsOffline(false);
    } catch (err) {
      console.warn('API serverga ulanib bo\'lmadi. Offline rejimga o\'tildi.', err);
      setIsOffline(true);
      // Load mock items if no local todos exist
      const local = localStorage.getItem('offline_todos');
      if (local) {
        setTodos(JSON.parse(local));
      } else {
        setTodos(MOCK_TODOS);
        localStorage.setItem('offline_todos', JSON.stringify(MOCK_TODOS));
      }
    }
  };

  // Helper to save offline state
  const saveOfflineTodos = (newTodos) => {
    setTodos(newTodos);
    if (isOffline) {
      localStorage.setItem('offline_todos', JSON.stringify(newTodos));
    }
  };

  // Add a new todo item
  const handleAddTodo = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const title = inputText.trim();

    if (isOffline) {
      const newTodo = {
        id: Date.now(),
        title,
        completed: false,
        createdAt: new Date().toISOString()
      };
      const updated = [newTodo, ...todos];
      saveOfflineTodos(updated);
      setInputText('');
    } else {
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title }),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setTodos([data, ...todos]);
        setInputText('');
      } catch (err) {
        alert('Serverga yuborishda xatolik yuz berdi.');
      }
    }
  };

  // Toggle todo completion
  const handleToggleTodo = async (id, completed) => {
    const nextCompleted = !completed;

    if (isOffline) {
      const updated = todos.map(t => t.id === id ? { ...t, completed: nextCompleted } : t);
      saveOfflineTodos(updated);
    } else {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completed: nextCompleted }),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setTodos(todos.map(t => t.id === id ? data : t));
      } catch (err) {
        alert('Vazifani o\'zgartirishda xatolik yuz berdi.');
      }
    }
  };

  // Remove a todo
  const handleDeleteTodo = async (id) => {
    if (isOffline) {
      const updated = todos.filter(t => t.id !== id);
      saveOfflineTodos(updated);
    } else {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error();
        setTodos(todos.filter(t => t.id !== id));
      } catch (err) {
        alert('Vazifani o\'chirishda xatolik yuz berdi.');
      }
    }
  };

  // Start inline editing
  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  // Save inline edit
  const handleSaveEdit = async (id) => {
    if (!editingText.trim()) return;

    if (isOffline) {
      const updated = todos.map(t => t.id === id ? { ...t, title: editingText.trim() } : t);
      saveOfflineTodos(updated);
      setEditingId(null);
    } else {
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editingText.trim() }),
        });
        if (!response.ok) throw new Error();
        const data = await response.json();
        setTodos(todos.map(t => t.id === id ? data : t));
        setEditingId(null);
      } catch (err) {
        alert('Vazifani tahrirlashda xatolik yuz berdi.');
      }
    }
  };

  // Handle keypress (Enter to save, Escape to cancel) during inline editing
  const handleKeyDown = (e, id) => {
    if (e.key === 'Enter') {
      handleSaveEdit(id);
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  // Filter logic
  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  // Stats logic
  const totalCount = todos.length;
  const completedCount = todos.filter(t => t.completed).length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="app-title-group">
          <h1>Mening Rejalarim</h1>
          <p>{isOffline ? '⚡ Offline Rejim (In-Memory)' : '🐘 PostgreSQL ulangan'}</p>
        </div>
        <button
          className="theme-toggle-btn"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          title="Mavzuni almashtirish"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {/* Progress Section */}
      <section className="progress-section">
        <div className="progress-header">
          <span className="progress-title">Bajarilish darajasi</span>
          <span className="progress-percentage">{progressPercent}%</span>
        </div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </section>

      {/* Input Form */}
      <form onSubmit={handleAddTodo} className="todo-form">
        <div className="todo-input-wrapper">
          <input
            type="text"
            className="todo-input"
            placeholder="Yangi vazifa kiriting..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
        </div>
        <button type="submit" className="add-btn">
          Vazifa Qo'shish
        </button>
      </form>

      {/* Filter Options */}
      <div className="filter-stats-row">
        <div className="filters-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Barchasi
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            Faol
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            Yakunlangan
          </button>
        </div>
        <div className="items-counter">
          {completedCount} / {totalCount} ta vazifa
        </div>
      </div>

      {/* Todo List */}
      <ul className="todo-list">
        {filteredTodos.length > 0 ? (
          filteredTodos.map((todo) => (
            <li key={todo.id} className={`todo-item ${todo.completed ? 'completed' : ''}`}>
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => handleToggleTodo(todo.id, todo.completed)}
                />
                <span className="checkmark"></span>
              </label>

              <div className="todo-content-wrapper">
                {editingId === todo.id ? (
                  <input
                    type="text"
                    className="todo-edit-input"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onBlur={() => handleSaveEdit(todo.id)}
                    onKeyDown={(e) => handleKeyDown(e, todo.id)}
                    autoFocus
                  />
                ) : (
                  <span className="todo-text" onDoubleClick={() => handleStartEdit(todo)}>
                    {todo.title}
                  </span>
                )}
              </div>

              <div className="todo-actions">
                <button
                  className="action-btn edit"
                  onClick={() => handleStartEdit(todo)}
                  title="Tahrirlash"
                >
                  ✏️
                </button>
                <button
                  className="action-btn delete"
                  onClick={() => handleDeleteTodo(todo.id)}
                  title="O'chirish"
                >
                  🗑️
                </button>
              </div>
            </li>
          ))
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📝</span>
            <h3 className="empty-title">Hech narsa yo'q</h3>
            <p className="empty-desc">
              {filter === 'all'
                ? "Hali hech qanday reja qo'shilmagan."
                : filter === 'active'
                  ? "Faol rejalar mavjud emas."
                  : "Bajarilgan vazifalar hali yo'q."}
            </p>
          </div>
        )}
      </ul>

      {/* Database Setup Help / Offline Banner */}
      {isOffline && showWarning && (
        <div className="db-warning-banner">
          <span className="db-warning-icon">⚠️</span>
          <div className="db-warning-content">
            <strong>Backend yoki PostgreSQL ulanmagan!</strong>
            <p>
              Ilova hozir offline rejimda ishlamoqda. Uni to'liq ishga tushirish uchun:
            </p>
            <p style={{ marginTop: '8px' }}>
              1. PostgreSQL-ni ishga tushiring yoki Prisma-ni SQLite-ga o'tkazing (<span className="db-warning-code">prisma/schema.prisma</span> faylida).
            </p>
            <p>
              2. Backend papkasida migratsiyani bajaring: <br />
              <span className="db-warning-code">npx prisma migrate dev --name init</span>
            </p>
            <p>
              3. NestJS serverni yoqing: <br />
              <span className="db-warning-code">npm run start:dev</span>
            </p>
            <button
              onClick={() => setShowWarning(false)}
              style={{
                marginTop: '10px',
                background: 'transparent',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '11px',
                textDecoration: 'underline'
              }}
            >
              Ushbu xabarni yashirish
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
