const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Task Model Import kiya
const Task = require('./models/Task');

const app = express();
app.use(cors());
app.use(express.json());

// Basic check route
app.get('/', (req, res) => {
  res.send("Task Planner Backend is running!");
});

// POST Route: Naya Task Add karne ke liye (supports kitne time padhna hai)
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, priority, duration } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title cannot be empty" });
    }
    const newTask = new Task({
      title: title.trim(),
      priority: priority || 'Medium',
      duration: duration ? Number(duration) : 30
    });
    await newTask.save();
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: "Server error while saving task" });
  }
});

// GET Route: Saare Tasks dekhne ke liye
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Server error while fetching tasks" });
  }
});

// PATCH Route: Task status update ya complete karne ke liye
app.patch('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updatedTask = await Task.findByIdAndUpdate(id, req.body, { new: true });

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE Route: Task delete karne ke liye
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while deleting task' });
  }
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB successfully!"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});