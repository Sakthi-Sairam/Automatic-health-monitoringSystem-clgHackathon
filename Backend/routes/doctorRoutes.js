const express = require('express');
const router = express.Router();

const Record = require('../models/record-model');

router.get('/dashboard', (req, res) => {
    res.render('./doctor/dashboard');
});
router.get('/appointments', (req, res) => {
    res.render('./doctor/appointments');
});

router.get('/add', (req, res) => {
    // Check if the user is authenticated
    if (!req.session.user) {
      return res.redirect('/auth/doctor/login');
    }
    res.render('./doctor/addRecord');
});

router.post('/add', async (req, res) => {
    try {
        // Assuming you have a session with user information
        const user = req.session.user;
    
        if (!user) {
          return res.redirect('/auth/doctor/login'); // Redirect to login if not authenticated
        }
    
        // Create a health record for the user
        const record = new Record({
          patient: {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
          },
          dateOfBirth: req.body.dateOfBirth,
          gender: req.body.gender,
          contact: {
            phone: req.body.phone,
            email: req.body.email,
          },
          address: {
            street: req.body.street,
            city: req.body.city,
            state: req.body.state,
            zip: req.body.zip,
          },
          medicalHistory: {
            allergies: req.body.allergies.split(',').map(item => item.trim()), // Assuming allergies are comma-separated
            medications: req.body.medications.split(',').map(item => item.trim()),
            surgeries: req.body.surgeries.split(',').map(item => item.trim()),
          },
        });
    
        // Save the health record to MongoDB
        await record.save();
    
        res.redirect('/dashboard'); // Redirect to dashboard or any other page
      } catch (error) {
        console.error(error);
        res.render('./doctor/addRecord', { errorMessage: 'Error creating health record.' });
      }
});

module.exports = router;