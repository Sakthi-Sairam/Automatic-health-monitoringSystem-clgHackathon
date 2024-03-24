const express = require('express');
const router = express.Router();
const HeartRate = require('../models/heartRate-model.js');
const Record = require('../models/record-model');



router.get('/dashboard', (req, res) => {
    try {
        if (!req.session.user) {
          return res.redirect('/user/login');
        }
        const userEmail = req.session.user.email;
    
        Record.findOne({ "contact.email":userEmail})
        .then(async(record)=>{
          if(record){
              const chartData = await prepareChartData();
              console.log(chartData.categories);
              return res.render('./user/dashboard',{record:record,categories:chartData.categories});
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

router.get('/history', (req, res) => {
    res.render('./user/history');
});
router.get('/medication', (req, res) => {
    res.render('./user/medication');
});
router.get('/report', (req, res) => {
    res.render('./user/report');
});
router.get('/profile', async(req, res) => {
    // res.render('./user/profile');
    try {
      if (!req.session.user) {
        return res.redirect('/auth/user/login');
      }
  
      const userEmail = req.session.user.email;
  
      const record = await Record.findOne({ 'contact.email': userEmail });
  
      if (!record) {
        return res.redirect('/auth/login');
      }
  
      res.render('./user/profile', { record });
    } catch (error) {
      console.error(error);
      res.render('dashboard', { errorMessage: 'Error fetching patient details.' });
    }

  });

module.exports = router;