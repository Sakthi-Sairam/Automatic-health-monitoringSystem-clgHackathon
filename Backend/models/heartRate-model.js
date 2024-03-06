const mongoose = require('mongoose');

const heartRateSchema = new mongoose.Schema({
  user_id: String,
  heart_rate: Number,
  timestamp: Date
});

const HeartRate = mongoose.model('HeartRate', heartRateSchema, 'heart_rate');

module.exports = HeartRate;
