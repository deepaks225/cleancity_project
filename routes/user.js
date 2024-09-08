const express = require('express');
const router = express.Router();
const user = require('../models/user.js')
const multer = require('multer')
const { complainModel } = require('../models/complain.js')
const path = require('path');
const drives = require('../models/drives.js');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = 'public/images/uploads';
        // Check if directory exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true }); // Create the directory if it doesn't exist
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Custom filename with timestamp
    }
});
 

const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    return res.render('users/index')
})
router.get('/profile', async (req, res) => {
    const User = await user.findById(req.user.id);
    return res.render('users/profile', {
        user: User,
    });
})

router.get('/home', async (req, res) => {
    try {
        const complaints = await complainModel.find({});
        let usersInfo = [];

        for (const complaint of complaints) {
            const users = await user.findById(complaint.createdBy);
            if (users) {
                usersInfo.push({
                    firstname: users.firstname,
                    lastname: users.lastname,
                });
            }
        }

        return res.render('users/index', {
            user: req.user,
            complain: complaints,
            usersInfo: usersInfo,
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).send('An error occurred while fetching complaints');
    }
});
router.get('/signup', (req, res) => {
    return res.render('users/signup')
})
router.post('/signup', async (req, res) => {

    const firstname = req.body.firstname;
    const lastname = req.body.lastname;
    const password = req.body.password;
    const email = req.body.email;
    const date = req.body.date;

    try {
        const User = await user.create({ firstname, lastname, email, date, password });

        return res.render('users/signin', { user: User });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error occurred while creating the user.");
    }
});

router.get('/capture', (req, res) => {
    return res.render('users/capture', { user: req.user })
})

router.post('/upload', upload.single('image'), async (req, res) => {
    const { complain, location } = req.body;
    const locationArray = JSON.parse(location);

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File upload failed' });
        }

        await complainModel.create({
            imageURL: `/images/uploads/${req.file.filename}`,
            complain: complain[1],
            createdBy: req.user.id,
            location: locationArray,
            date: Date.now(),
        });
        console.log(req.user.id)
        const newReports = {
            imageURL: `/images/uploads/${req.file.filename}`,
            complain: complain[1],
            date: Date.now(),
        };


        await user.findByIdAndUpdate(
            req.user.id,
            { $push: { reports: newReports } },
            { new: true, runValidators: true }
        );

        res.json({ message: 'File uploaded successfully', file: req.file });
    } catch (error) {
        console.log('Complain creation error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

router.get('/drives', async (req, res) => {

    const userDrives = await drives.find({});
    res.render('users/drives', { user: req.user, drives: userDrives });
});

router.post('/drives', async (req, res) => {
    const { location, date, number } = req.body;
    await drives.create({ location, date, number });

    const userDrives = await drives.find({});
    res.render('users/drives', { user: req.user, drives: userDrives });

})
router.get('/logout', (req, res) => {
    return res.clearCookie('token').render('users/index');
});

router.get('/analytics', (req, res) => {
    const totalDrives = 10;
    const totalVolunteers = 150;
    const totalLocations = 8;
    const totalLitter = 300;

    const drivesData = [
        { location: 'Juhu beach', litterCollected: 50 },
        { location: 'Antop hill', litterCollected: 40 },
        { location: 'colaba', litterCollected: 60 },
        { location: 'fort', litterCollected: 30 },
        { location: 'BPT colony', litterCollected: 20 },
        { location: 'New colony', litterCollected: 50 },
        { location: 'Industrial Area', litterCollected: 20 },
        { location: 'City park', litterCollected: 30 }
    ];

    res.render('users/analytics', {
        user: req.user,
        totalDrives,
        totalVolunteers,
        totalLocations,
        totalLitter,
        drivesData
    });
});


module.exports = router
