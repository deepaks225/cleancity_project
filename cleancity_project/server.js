const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const path = require('path')
const port = process.env.PORT || 3000;
const cookieParser = require('cookie-parser')
const {checkForAuthentication} = require('./checkAuth.js')
const userRoute = require('./routes/user.js')
const adminRoute = require('./routes/admin.js')
const {restrictTo} = require('./restrictTo.js')
const user = require('./models/user.js')

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/signin',(req, res)=>{
    return res.render('signin')
}) 

app.post('/signin', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const token = await user.matchPassword(email, password);
        // const User = await user.findOne({ email });

        if (token) {
            res.cookie("token", token);
            
            if (role === 'user') {
                return res.redirect('/home');
            } else if (role === 'admin') {
                return res.redirect('/admin');
            }
        }
        
        console.log('Invalid credentials for:', email);
        return res.render('signin', { error: 'Invalid credentials' });
    } catch (error) {
        console.error('Signin error:', error);
        return res.status(500).render('signin', { error: 'An error occurred during sign in' });
    }
});




// Middleware 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(checkForAuthentication('token'))
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));  

app.use('/',userRoute);
app.use('/admin',restrictTo(['admin']),adminRoute)

// Database connection
mongoose.connect('mongodb://localhost/cleancity')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
