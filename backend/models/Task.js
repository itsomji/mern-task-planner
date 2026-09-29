const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Task', taskSchema);
