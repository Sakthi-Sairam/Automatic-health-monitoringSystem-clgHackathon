const mongoose = require('mongoose');

const recordSchema = new mongoose.Schema({
  patient: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
  },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  contact: {
    phone: { type: String },
    email: { type: String },
  },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },
  medicalHistory: {
    allergies: [{ type: String }],
    medications: [{ type: String }],
    surgeries: [{ type: String }],
  },
  // Add more fields as needed
}, { timestamps: true });

const Record = mongoose.model('Record', recordSchema);

module.exports = Record;
