const express = require('express');
const router = express.Router();
const user = require('../models/user.js');
const { complainModel } = require('../models/complain.js');
const path = require('path');
const drives = require('../models/drives.js');
const User = require('../models/user.js');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: 'dbhbtrccn',
    api_key: '466272138665527',
    api_secret: 'B6UEwglvi3jT5LRCF04lSOzxfgs'
 });  
  
// Set up Cloudinary storage for profile pictures and report images
const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pictures', // Cloudinary folder name
    allowed_formats: ['jpeg', 'png', 'jpg']
  }
});

const reportStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'litter_reports', // Cloudinary folder name
    allowed_formats: ['jpeg', 'png', 'jpg']
  }
});

// Multer middleware for Cloudinary storage
const uploadProfilePicture = multer({ storage: profileStorage });
const uploadReportImage = multer({ storage: reportStorage });

router.get('/', (req, res) => {
    return res.render('users/index');
});

router.get('/profile', async (req, res) => {
    const User = await user.findById(req.user.id);
    return res.render('users/profile', {
        user: User,
    });
});

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
                    profilePicture: users.profilePicture
                });
            }
        }
        const reversedData = complaints.map((complaint, index) => ({
            complaint,
            userInfo: usersInfo[index]
        })).reverse();

        return res.render('users/index', {
            user: req.user,
            reversedData: reversedData
        });
    } catch (error) {
        console.error('Error fetching complaints:', error);
        res.status(500).send('An error occurred while fetching complaints');
    }
});

router.get('/signup', (req, res) => {
    return res.render('users/signup');
});

router.post('/signup', uploadProfilePicture.single('profilePicture'), async (req, res) => {
    const { firstname, lastname, password, email, date } = req.body;

    try {
        let newUserData = {
            firstname: firstname,
            lastname: lastname,
            email: email,
            date: date,
            password: password,
        };

        if (req.file) {
            newUserData.profilePicture = req.file.path; // Cloudinary URL
        }

        const newUser = await user.create(newUserData);
        await newUser.save();

        return res.render('users/signin', { user: newUser });
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error occurred while creating the user.");
    }
});

router.get('/capture', (req, res) => {
    return res.render('users/capture', { user: req.user });
});

router.post('/upload', uploadReportImage.single('image'), async (req, res) => {
    const { complain, address, location, category, weight } = req.body;
    const locationArray = JSON.parse(location);

    try {
        if (!req.file) {
            return res.status(400).json({ message: 'File upload failed' });
        }

        await complainModel.create({
            imageURL: req.file.path, // Cloudinary URL
            complain: complain[1],
            address: address,
            createdBy: req.user.id,
            location: locationArray,
            date: Date.now(),
            category: category,
            weight: weight,
        });

        const newReports = {
            imageURL: req.file.path, // Cloudinary URL
            complain: complain[1],
            address: address,
            date: Date.now(),
            category: category,
            weight: weight,
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
    try {
        const userDrives = await drives.find({});
        res.render('users/drives', { user: req.user, drives: userDrives });
    } catch (error) {
        console.error('Error fetching drives:', error);
        res.status(500).render('error', { message: 'An error occurred while fetching drives' });
    }
});

router.get('/update', async (req, res) => {
    try {
        const userInfo = await user.findById(req.user.id);
        res.render('users/update', { user: req.user, users: userInfo });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/update/:taskId', async (req, res) => {
    try {
        const { status } = req.body;
        console.log("Request body status:", status); // Log the received status from the request body

        const taskId = req.params.taskId;
        const task = await assignModel.findById(taskId);

        if (!task) {
            console.log("Task not found"); // Log if the task is not found
            return res.status(404).send("Task not found");
        }

        const updatedTask = await assignModel.findByIdAndUpdate(taskId, { status }, { new: true });
        const complainID = updatedTask.complainID;

        // Update the complain's status and mark it as unread
        await complainModel.findByIdAndUpdate(complainID, { status, isRead: false }, { new: true });
        console.log("Complain status updated"); // Log complain status update

        const collector = await collectorModel.findById(req.user.id); // Fetch collector data

        if (status === STATUS_COMPLETED) {
            const updatedTaskCount = collector.taskCompleted + 1; 
            await collectorModel.findByIdAndUpdate(req.user.id, { taskCompleted: updatedTaskCount }); 
            console.log("Collector task count updated"); // Log the task count update
        }

        
        return res.redirect('/collector/task');
    } catch (error) {
        console.error("Error updating status:", error); // Log any error encountered during the process
        return res.status(500).send("Internal Server Error");
    }
});

router.get('/notifications', async(req, res) => {
    try {
        const complaints = await complainModel.find({createdBy: req.user.id});
        return res.render('users/notification', { user: req.user, complaints: complaints });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return res.status(500).render('error', { message: 'An error occurred while fetching notifications' });
    }
});

router.post('/apply', async (req, res) => {
    try {
        const userDrives = await drives.find({});
        const driveId = req.body.driveId;
        const userId = req.user.id;
        if (!driveId) {
            return res.status(400).json({ message: 'Drive ID is required' });
        }

        const drive = await drives.findById(driveId);

        if (!drive) {
            return res.status(404).json({ message: 'Drive not found' });
        }

        if (drive.appliedUsers.includes(userId)) {
            return res.status(400).json({ message: 'You have already applied to this drive' });
        }

        if (drive.Applied >= drive.number) {
            return res.status(400).json({ message: 'This drive is already full' });
        }

        const result = await drives.findByIdAndUpdate(
            driveId,
            { 
                $inc: { Applied: 1 },
                $push: { appliedUsers: userId }
            },
            { new: true }
        );
        console.log(result)

        res.redirect('/drives');
    } catch (error) {
        console.error('Error applying to drive:', error);
        res.status(500).json({ message: 'An error occurred while applying to the drive' });
    }
});

router.get('/logout', (req, res) => {
    return res.clearCookie('token').render('users/index');
});
module.exports = router
