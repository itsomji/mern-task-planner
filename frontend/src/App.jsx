import { useState, useEffect } from 'react'

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
      setTasks(data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!title || title.trim() === '') {
      setError('Title cannot be empty');
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

  // Task Delete karne ka function
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Task Planner Workshop</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input 
          type="text" 
          placeholder="Enter task title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          style={{ flex: 1, padding: '8px' }}
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ padding: '8px' }}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Add Task</button>
      </form>
      
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h3>My Pending Tasks</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(task => (
          <li key={task._id} style={{ 
            padding: '10px', 
            borderBottom: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{task.title}</span>
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
              <span style={{ 
                fontWeight: 'bold', 
                color: task.priority === 'High' ? 'red' : task.priority === 'Medium' ? 'orange' : 'green' 
              }}>
                {task.priority}
              </span>
              <button 
                onClick={() => handleDelete(task._id)}
                style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', borderRadius: '4px' }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default App;