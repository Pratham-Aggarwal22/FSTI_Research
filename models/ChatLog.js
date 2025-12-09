import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const chatLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  messages: [chatMessageSchema],
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: Date,
  closed: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model('ChatLog', chatLogSchema);

