const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const port = 3000;
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');

// const User = require('./models/userModel');
const Record = require('./models/record-model');


const HeartRate = require('./models/heartRate-model.js');

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb://localhost/healthrecorddb', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));


// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));

// Use your auth routes
app.use('/auth', authRoutes);
app.use('/user', userRoutes);

// Define routes
app.get('/', (req, res) => {
  res.render('index');
});
app.get('/add', (req, res) => {
    // Check if the user is authenticated
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }
    res.render('addRecord');
});

app.post('/add', async (req, res) => {
    try {
      // Assuming you have a session with user information
      const user = req.session.user;
  
      if (!user) {
        return res.redirect('/login'); // Redirect to login if not authenticated
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
      res.render('addRecord', { errorMessage: 'Error creating health record.' });
    }
  });

app.get('/dashboard', async (req, res) => {
    try {
      if (!req.session.user) {
        return res.redirect('/auth/login');
      }
      const userEmail = req.session.user.email;
  
      Record.findOne({ "contact.email":userEmail})
      .then(async(record)=>{
        if(record){
            const chartData = await prepareChartData();
            console.log(chartData.categories);
            return res.render('dashboard',{record:record,categories:chartData.categories});
        }else{
            console.log("record not found");
        }
      })
      .catch(error => {
        console.error("Error finding record:", error);
      });
    } catch (error) {
      console.error(error);
    //   res.render('dashboard', { errorMessage: 'Error fetching health records.' });
        res.redirect('/');
    }
});
// Add route for patient dashboard
app.get('/edit-profile', async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/auth/login');
    }

    const userEmail = req.session.user.email;

    const record = await Record.findOne({ 'contact.email': userEmail });

    if (!record) {
      return res.redirect('/auth/login');
    }

    res.render('editProfile', { record });
  } catch (error) {
    console.error(error);
    res.render('dashboard', { errorMessage: 'Error fetching patient details.' });
  }
});

  

app.get('/getuser', (req, res) => {
    console.log(req.session.user.email);
    res.render('addRecord');
  });
  
  app.post('/edit-profile', async (req, res) => {
    try {
        const userEmail = req.session.user.email;

        // Update patient profile based on form data
        const updatedRecord = await Record.findOneAndUpdate({ 'contact.email': userEmail }, {
            $set: {
                'patient.firstName': req.body.firstName,
                'patient.lastName': req.body.lastName,
                'dateOfBirth': req.body.dateOfBirth,
                'gender': req.body.gender,
                'contact.phone': req.body.phone,
                'contact.email': req.body.email,
                'address.street': req.body.street,
                'address.city': req.body.city,
                'address.state': req.body.state,
                'address.zip': req.body.zip,
                // Add other fields from your schema similarly
            },
        }, { new: true });

        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.render('editProfile', { errorMessage: 'Error updating patient profile.' });
    }
});

async function prepareChartData() {
  try {
    const data = await HeartRate.find({}, { _id: 0 });

    // Prepare data for charts
    const timestamps = data.map(entry => entry.timestamp);
    const heartRates = data.map(entry => entry.heart_rate);

    // Group heart rates into categories
    const categories = { '<40': 0, '40-120': 0, '>120': 0 };
    heartRates.forEach(rate => {
      if (rate < 40) {
        categories['<40'] += 1;
      } else if (rate >= 40 && rate <= 120) {
        categories['40-120'] += 1;
      } else {
        categories['>120'] += 1;
      }
    });

    return { timestamps, heartRates, categories };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

app.get('/analytics', async (req, res) => {
  try {
    const chartData = await prepareChartData();
    res.render('analytics', chartData);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
