const express = require('express');
const router = express.Router();
const user = require('../models/user.js')
const multer = require('multer')
const {complainModel} = require('../models/complain.js')
const path = require('path');
const drives = require('../models/drives.js')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/',(req, res)=>{
    return res.render('index')
})
router.get('/profile',async(req, res)=>{
    const User = await user.findById(req.user.id) 
    return res.render('profile', {
        user: User, 
    });
})

router.get('/home',(req, res)=>{
    console.log(req.user)
    return res.render('index',{
        user: req.user
    })
})
router.get('/signup',(req, res)=>{
    return res.render('signup')
})
router.post('/signup', async (req, res) => {
    
    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const password = req.body.password;
    const email = req.body.email;
    const date = req.body.date;

    try {
        const User = await user.create({ firstname, lastname, email, date, password });

        return res.render('signin',{user : User});
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error occurred while creating the user.");
    }
});

router.get('/capture',(req, res)=>{
    return res.render('capture',{user: req.user})
})

router.post('/upload', upload.single('image'), async (req, res) => {
    const { complain,location } = req.body;
    const locationArray = JSON.parse(location);
    try {
        await complainModel.create({
            imageURL: `/uploads/${req.file.filename}`,
            complain: complain[1],
            createdBy: req.user._id,
            location: locationArray,
            date: Date.now(),
        });
        res.json({ message: 'File uploaded successfully', file: req.file });
    } catch (error) {
        console.log('Complain creation error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
router.get('/drives', async(req, res) => {
    
    const userDrives = await drives.find({});    
    res.render('drives', {user: req.user,drives: userDrives});
});

router.post('/drives',async(req, res)=>{
    const {location, date, number} = req.body;
    await drives.create({location, date, number});

    const userDrives = await drives.find({});
    res.render('drives',{user: req.user,drives: userDrives});

})
router.get('/logout',(req , res)=>{
    return res.clearCookie('token').render('index');
});

router.get('/analytics', (req, res) => {
    // Example data, replace with actual database queries
    const totalDrives = 10;
    const totalVolunteers = 150;
    const totalLocations = 8;
    const totalLitter = 300; // kg

    const drivesData = [
        { location: 'Central Park', litterCollected: 50 },
        { location: 'Beachside', litterCollected: 40 },
        { location: 'Downtown', litterCollected: 60 },
        { location: 'Riverside', litterCollected: 30 },
        { location: 'Uptown', litterCollected: 20 },
        { location: 'Suburbs', litterCollected: 50 },
        { location: 'Industrial Area', litterCollected: 20 },
        { location: 'Old Town', litterCollected: 30 }
    ];

    res.render('analytics', {
        user: req.user,
        totalDrives,
        totalVolunteers,
        totalLocations,
        totalLitter,
        drivesData
    });
});


module.exports = router