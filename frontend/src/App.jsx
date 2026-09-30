import { useState, useEffect } from 'react';

const API_BASE_URL = 'https://mern-task-planner-1-iori.onrender.com';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [error, setError] = useState('');

  const fetchTasks = async () => {
    try {
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
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || title.trim() === '') {
      setError('Task title cannot be empty!');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, priority })
      });

      if (res.ok) {
        setTitle(''); 
        setPriority('Medium');
        fetchTasks(); 
      }
    } catch (err) {
      console.error("Error adding task:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTasks();
      } else {
        console.error("Failed to delete task");
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '40px 20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        maxWidth: '650px',
        margin: '0 auto',
        background: '#ffffff',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ color: '#2d3748', margin: '0 0 8px 0', fontSize: '28px' }}>📝 Advanced Task Planner</h2>
          <p style={{ color: '#718096', margin: 0, fontSize: '14px' }}>MERN Stack Full-Stack Application Workshop</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ marginBottom: '25px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="What needs to be done?" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            style={{ 
              flex: 1, 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e0', 
              outline: 'none',
              fontSize: '15px'
            }}
          />
          <select 
            value={priority} 
            onChange={(e) => setPriority(e.target.value)} 
            style={{ 
              padding: '12px 16px', 
              borderRadius: '8px', 
              border: '1px solid #cbd5e0', 
              outline: 'none',
              background: '#fff',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            <option value="Low">Low Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="High">High Priority</option>
          </select>
          <button 
            type="submit" 
            style={{ 
              padding: '12px 24px', 
              background: '#4f46e5', 
              color: 'white', 
              border: 'none', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '15px',
              transition: 'background 0.2s'
            }}
          >
            Add Task
          </button>
        </form>
        
        {error && <div style={{ 
          background: '#fee2e2', 
          color: '#991b1b', 
          padding: '10px 14px', 
          borderRadius: '6px', 
          marginBottom: '20px', 
          fontSize: '14px' 
        }}>{error}</div>}

        <h3 style={{ color: '#4a5568', borderBottom: '2px solid #edf2f7', paddingBottom: '10px', fontSize: '18px' }}>
          My Tasks ({tasks.length})
        </h3>
        
        {tasks.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#a0aec0', padding: '30px 0' }}>No tasks found. Add a new task above!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {tasks.map(task => {
              const priorityColor = 
                task.priority === 'High' ? '#ef4444' : 
                task.priority === 'Medium' ? '#f59e0b' : '#10b981';

              return (
                <li key={task._id || task.id} style={{ 
                  padding: '16px', 
                  marginBottom: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  <span style={{ fontSize: '16px', color: '#1f2937', fontWeight: '500', wordBreak: 'break-all', marginRight: '10px' }}>
                    {task.title}
                  </span>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ 
                      fontSize: '13px',
                      fontWeight: 'bold', 
                      color: priorityColor,
                      background: `${priorityColor}15`,
                      padding: '4px 10px',
                      borderRadius: '20px'
                    }}>
                      {task.priority}
                    </span>
                    <button 
                      onClick={() => handleDelete(task._id || task.id)}
                      style={{ 
                        background: '#ef4444', 
                        color: 'white', 
                        border: 'none', 
                        padding: '6px 14px', 
                        cursor: 'pointer', 
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: '600'
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;