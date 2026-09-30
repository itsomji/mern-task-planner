import { useState, useEffect, useMemo, useRef } from 'react';
import './App.css';

// Workshop Backend URL (Change to http://localhost:5000 if testing local backend)
const API_BASE_URL = 'https://mern-task-planner-1-iori.onrender.com';

const PRESET_DURATIONS = [
  { label: '15m Quick', value: 15, emoji: '⚡' },
  { label: '25m Pomodoro', value: 25, emoji: '🍅' },
  { label: '45m Focus', value: 45, emoji: '📖' },
  { label: '60m 1 Hour', value: 60, emoji: '🎯' },
  { label: '90m Deep Work', value: 90, emoji: '🚀' },
];

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [duration, setDuration] = useState(45); // Kitne time padhna hai (minutes)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('study_theme') || 'dark');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [sortBy, setSortBy] = useState('newest');

  // Interactive Focus Timer Modal State
  const [focusTask, setFocusTask] = useState(null);
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef(null);

  // Sync theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('study_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Play synthesized notification sound using Web Audio API
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
      // AudioContext fallback
    }
  };

  // Fetch all tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/tasks`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Add Task with Title, Priority, and Duration (Kitne time padhna hai)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || title.trim() === '') {
      setError('⚠️ Task title cannot be empty!');
      return;
    }

    const durationNum = Number(duration) || 30;

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          priority,
          duration: durationNum
        })
      });

      if (res.ok) {
        setTitle('');
        setPriority('Medium');
        setDuration(45);
        fetchTasks();
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.error || 'Failed to save task.');
      }
    } catch (err) {
      console.error("Error adding task:", err);
      setError('Network error while saving task. Please check server.');
    }
  };

  // Delete Task
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        // Optimistic UI update
        setTasks(prev => prev.filter(t => (t._id || t.id) !== id));
        if (focusTask && (focusTask._id || focusTask.id) === id) {
          closeFocusTimer();
        }
      } else {
        console.error("Failed to delete task");
        setError("Could not delete task from server.");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Network error deleting task.");
    }
  };

  // Toggle task completed status
  const handleToggleComplete = async (task) => {
    const taskId = task._id || task.id;
    const newStatus = !task.completed;

    // Optimistic update
    setTasks(prev => prev.map(t => (t._id || t.id) === taskId ? { ...t, completed: newStatus } : t));

    try {
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: newStatus })
      });
    } catch (err) {
      console.error("Failed to update status on server:", err);
    }
  };

  // Start Focus Session for a specific task
  const openFocusTimer = (task) => {
    const taskMinutes = task.duration || 30;
    setFocusTask(task);
    setTimerSecondsLeft(taskMinutes * 60);
    setIsTimerRunning(true);
  };

  const closeFocusTimer = () => {
    clearInterval(timerIntervalRef.current);
    setIsTimerRunning(false);
    setFocusTask(null);
  };

  // Timer Countdown Effect
  useEffect(() => {
    if (isTimerRunning && timerSecondsLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerIntervalRef.current);
            setIsTimerRunning(false);
            playChime();
            alert(`🎉 Great job! Study session for "${focusTask?.title}" is completed!`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }

    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning, timerSecondsLeft, focusTask]);

  // Add 5 minutes to active timer
  const addFiveMinutes = () => {
    setTimerSecondsLeft(prev => prev + 300);
  };

  // Format MM:SS
  const formatTime = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Calculate Dashboard Statistics
  const stats = useMemo(() => {
    const total = tasks.length;
    const completedCount = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.filter(t => !t.completed);

    // Sum total study minutes planned for pending tasks
    const totalPendingMinutes = pendingTasks.reduce((acc, t) => acc + (Number(t.duration) || 30), 0);
    const hours = Math.floor(totalPendingMinutes / 60);
    const mins = totalPendingMinutes % 60;
    const formattedStudyTime = hours > 0 ? `${hours}h ${mins > 0 ? `${mins}m` : ''}` : `${mins}m`;

    const progressPercent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

    return {
      total,
      completedCount,
      pendingCount: pendingTasks.length,
      formattedStudyTime,
      totalPendingMinutes,
      progressPercent
    };
  }, [tasks]);

  // Filtered & Sorted Tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Search filter
        const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        // Priority / Status filter
        if (filterPriority === 'All') return true;
        if (filterPriority === 'Pending') return !task.completed;
        if (filterPriority === 'Completed') return task.completed;
        return task.priority === filterPriority;
      })
      .sort((a, b) => {
        if (sortBy === 'duration-desc') return (b.duration || 30) - (a.duration || 30);
        if (sortBy === 'duration-asc') return (a.duration || 30) - (b.duration || 30);
        return 0; // Default order
      });
  }, [tasks, searchQuery, filterPriority, sortBy]);

  // SVG Circular progress for focus modal
  const totalFocusSeconds = (focusTask?.duration || 30) * 60;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = totalFocusSeconds > 0
    ? circumference - (timerSecondsLeft / totalFocusSeconds) * circumference
    : 0;

  return (
    <div className="app-container">
      {/* Background Decorative Glows */}
      <div className="ambient-glow ambient-glow-1" />
      <div className="ambient-glow ambient-glow-2" />
      <div className="ambient-glow ambient-glow-3" />

      <main className="app-wrapper">
        {/* Top Header Card */}
        <header className="header-card">
          <div className="brand-section">
            <div className="brand-icon">📚</div>
            <div className="brand-text">
              <h1>StudyFlow • Task Planner</h1>
              <p>MERN Stack Study Tracker & Focus Planner</p>
            </div>
          </div>
          <div className="header-actions">
            <span className="date-badge">
              🗓️ {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
            <button 
              type="button" 
              className="theme-toggle-btn" 
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </header>

        {/* Dashboard Statistics Overview */}
        <section className="stats-grid" aria-label="Study Statistics">
          <div className="stat-card">
            <div className="stat-icon tasks">📋</div>
            <div className="stat-info">
              <div className="stat-label">Total Tasks</div>
              <div className="stat-value">{stats.total}</div>
              <div className="stat-sub">{stats.pendingCount} to study</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon time">⏱️</div>
            <div className="stat-info">
              <div className="stat-label">Total Study Time</div>
              <div className="stat-value">{stats.formattedStudyTime}</div>
              <div className="stat-sub">Target study duration</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon done">✅</div>
            <div className="stat-info">
              <div className="stat-label">Completed</div>
              <div className="stat-value">{stats.completedCount}</div>
              <div className="stat-sub">{stats.progressPercent}% finished</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon progress">🔥</div>
            <div className="stat-info">
              <div className="stat-label">Progress</div>
              <div className="stat-value">{stats.progressPercent}%</div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ width: `${stats.progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Study Planner Input Form */}
        <section className="planner-form-card">
          <div className="form-header">
            <div className="form-title">
              <span>✍️</span> Plan New Study Session
            </div>
            <span className="form-badge">Smart Study Planner</span>
          </div>

          <form onSubmit={handleSubmit} className="form-grid">
            <div className="input-row">
              {/* Task Title */}
              <div className="input-group flex-grow">
                <label htmlFor="task-title">📖 What do you need to study?</label>
                <input
                  id="task-title"
                  type="text"
                  placeholder="e.g. Solve 5 LeetCode DP problems, Math Chapter 4..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="custom-input"
                  maxLength={120}
                />
              </div>

              {/* Priority Selector */}
              <div className="input-group">
                <label htmlFor="task-priority">⚡ Priority</label>
                <select
                  id="task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="custom-select"
                >
                  <option value="High">🔥 High Priority</option>
                  <option value="Medium">⚡ Medium Priority</option>
                  <option value="Low">🌱 Low Priority</option>
                </select>
              </div>
            </div>

            {/* Target Study Duration Section */}
            <div className="duration-box">
              <div className="duration-header">
                <span className="duration-title">
                  ⏱️ Target Study Duration:
                </span>
                <span className="duration-active-badge">
                  🎯 Target: {duration} mins ({duration >= 60 ? `${(duration / 60).toFixed(1)} hrs` : `${duration} minutes`})
                </span>
              </div>

              <div className="duration-custom-row">
                {/* Custom Number Input */}
                <div className="number-input-wrap">
                  <input
                    type="number"
                    min="5"
                    max="360"
                    step="5"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(5, Number(e.target.value)))}
                    aria-label="Custom study duration in minutes"
                  />
                  <span className="unit">mins</span>
                </div>

                {/* Preset Chips */}
                <div className="preset-chips">
                  {PRESET_DURATIONS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      className={`chip-btn ${duration === preset.value ? 'active' : ''}`}
                      onClick={() => setDuration(preset.value)}
                    >
                      <span>{preset.emoji}</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              className="submit-btn" 
              disabled={loading || !title.trim()}
            >
              <span>➕</span> Add Study Task ({duration}m)
            </button>
          </form>

          {error && (
            <div className="error-banner">
              <span>⚠️</span> {error}
            </div>
          )}
        </section>

        {/* Task Filters & Search */}
        <section className="filter-card">
          <div className="search-box">
            <span>🔍</span>
            <input
              type="text"
              placeholder="Search study tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-pills">
            {['All', 'Pending', 'Completed', 'High', 'Medium', 'Low'].map((item) => (
              <button
                key={item}
                type="button"
                className={`filter-pill ${filterPriority === item ? 'active' : ''}`}
                onClick={() => setFilterPriority(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        {/* Tasks List */}
        <section className="tasks-container">
          <div className="tasks-header">
            <h2>Study Schedule</h2>
            <span className="task-count">{filteredTasks.length} {filteredTasks.length === 1 ? 'Task' : 'Tasks'}</span>
          </div>

          {filteredTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🎯</div>
              <div className="empty-title">
                {tasks.length === 0 ? 'No study tasks added yet!' : 'No matching tasks found.'}
              </div>
              <p className="empty-subtitle">
                {tasks.length === 0
                  ? 'Set your study goals, choose your target duration, and kickstart your focus session!'
                  : 'Try clearing your search query or switching your active filter.'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const taskId = task._id || task.id;
              const taskMinutes = task.duration || 30;

              return (
                <article 
                  key={taskId} 
                  className={`task-item ${task.completed ? 'completed' : ''}`}
                >
                  <div className="task-left">
                    <button
                      type="button"
                      className={`custom-checkbox ${task.completed ? 'checked' : ''}`}
                      onClick={() => handleToggleComplete(task)}
                      aria-label="Toggle task completed"
                    >
                      {task.completed ? '✓' : ''}
                    </button>

                    <div className="task-content">
                      <div className={`task-title ${task.completed ? 'done' : ''}`}>
                        {task.title}
                      </div>
                      <div className="task-meta">
                        <span className={`priority-tag ${task.priority}`}>
                          {task.priority === 'High' && '🔥'}
                          {task.priority === 'Medium' && '⚡'}
                          {task.priority === 'Low' && '🌱'}
                          {task.priority} Priority
                        </span>
                        <span className="duration-tag">
                          ⏱️ {taskMinutes} min study
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    {/* Live Focus Session Launcher */}
                    <button
                      type="button"
                      className="focus-btn"
                      onClick={() => openFocusTimer(task)}
                      title="Start Focus Timer"
                    >
                      <span>🚀</span> Start Focus
                    </button>

                    {/* Delete Button */}
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => handleDelete(taskId)}
                      aria-label="Delete task"
                      title="Delete task"
                    >
                      <span>🗑️</span> Delete
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      </main>

      {/* ========================================================================= */}
      {/* Interactive Focus Timer Modal (Focus Mode)                                */}
      {/* ========================================================================= */}
      {focusTask && (
        <div className="modal-overlay" onClick={closeFocusTimer}>
          <div className="timer-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              type="button" 
              className="modal-close-btn" 
              onClick={closeFocusTimer}
              aria-label="Close Focus Mode"
            >
              ✕
            </button>

            <span className="timer-tag">🎯 Active Focus Session</span>
            <h3 className="timer-task-title">{focusTask.title}</h3>

            {/* Circular Progress Ring */}
            <div className="timer-circle-wrap">
              <svg className="timer-svg" viewBox="0 0 200 200">
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--primary)" />
                    <stop offset="100%" stopColor="var(--secondary)" />
                  </linearGradient>
                </defs>
                <circle
                  className="timer-circle-bg"
                  cx="100"
                  cy="100"
                  r={radius}
                />
                <circle
                  className="timer-circle-progress"
                  cx="100"
                  cy="100"
                  r={radius}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="timer-digits">
                {formatTime(timerSecondsLeft)}
              </div>
            </div>

            <div className="timer-status-hint">
              {isTimerRunning ? '🔥 Session in progress... Keep going!' : '⏸️ Timer paused'}
            </div>

            {/* Timer Controls */}
            <div className="timer-controls" style={{ marginTop: '20px' }}>
              <button
                type="button"
                className="ctrl-btn play"
                onClick={() => setIsTimerRunning(prev => !prev)}
              >
                {isTimerRunning ? '⏸️ Pause' : '▶️ Resume Focus'}
              </button>

              <button
                type="button"
                className="ctrl-btn secondary"
                onClick={addFiveMinutes}
                title="Add 5 more minutes"
              >
                +5 Mins
              </button>

              <button
                type="button"
                className="ctrl-btn secondary"
                onClick={() => {
                  setTimerSecondsLeft((focusTask.duration || 30) * 60);
                  setIsTimerRunning(false);
                }}
                title="Reset timer"
              >
                🔄 Reset
              </button>
            </div>

            <div className="timer-footer-quote">
              💡 Tip: Put your phone on silent and focus on one concept at a time.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;