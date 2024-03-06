const express = require('express');
const User = require('../models/userModel'); // Adjust the path accordingly

const router = express.Router();

router.get('/register', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
  res.render('register');
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('register', { errorMessage: 'User already exists.' });
    }

    // Create a new user
    const newUser = new User({ username, email, password });
    await newUser.save();

    req.session.user = newUser; // Store user information in the session
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.render('register', { errorMessage: 'Error registering user.' });
  }
});

router.get('/login', (req, res) => {
    if (req.session.user) {
        return res.redirect('/');
    }
  res.render('login');
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return res.render('login', { errorMessage: 'Invalid username or password.' });
    }

    // Compare the entered password with the stored hash
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.render('login', { errorMessage: 'Invalid username or password.' });
    }

    req.session.user = user; // Store user information in the session
    res.redirect('/');
  } catch (error) {
    console.error(error);
    res.render('login', { errorMessage: 'Error logging in.' });
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
