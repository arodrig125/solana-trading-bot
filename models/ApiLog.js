const mongoose = require('mongoose');

const ApiLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  apiKey: {
    type: String,
    required: false
  },
  route: {
    type: String,
    required: true
  },
  method: {
    type: String,
    required: true
  },
  status: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  },
  userAgent: {
    type: String
  },
  authType: {
    type: String,
    enum: ['jwt', 'apikey', 'none'],
    required: true
  },
  reqBody: {
    type: Object,
    required: false
  }
});

module.exports = mongoose.model('ApiLog', ApiLogSchema);
