const express = require('express');
const app = express();
require('dotenv').config();
const nocache = require('nocache');
const mongoose = require('mongoose');
const path = require('path')

// MongoDB connection
mongoose.connect(process.env.MONGO_URL)
  .then(() => {
    console.log('DB connected successfully');
  }).catch((err) => {
    console.error(`Error occurred ${err}`);
  });

const PORT = process.env.PORT || 8080;

// Express configuration
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.static(path.join(__dirname,'public')))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(nocache());
app.use('/uploads', express.static('uploads'));




// Routes
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

app.use('/', userRoute);
app.use('/admin', adminRoute);

// 404 page
app.use('*', (req, res) => {
  res.status(404).render('page404');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
