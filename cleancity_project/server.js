const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const path = require('path')
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser')
const {checkForAuthentication} = require('./checkAuth.js')
const userRoute = require('./routes/user.js')
 
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')


// Middleware 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(checkForAuthentication('token'))
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));  
app.use(userRoute);

// Database connection
mongoose.connect('mongodb://localhost/cleancity')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
   