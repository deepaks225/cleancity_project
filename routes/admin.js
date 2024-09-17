const express = require('express')
const router = express.Router();

const { collectorModel } = require('../models/collector.js');
const User = require('../models/user.js');
const { complainModel } = require('../models/complain.js');
const { assignModel } = require('../models/taskAssign.js');
const driveModel = require('../models/drives.js')

router.get('/', async (req, res) => {
    const collector = await collectorModel.find({})
    return res.render('admin/admin', { user: req.user, collectors: collector })
})

router.get('/assign/:collectorId', async (req, res) => {
    try {
        const user = req.user;
        const collectorId = req.params.collectorId;
        const complain = await complainModel.find({ status: "pending" });
        return res.render('admin/assign', { user: user, complain: complain, collectorId: collectorId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.get('/create', (req, res) => {
    return res.render('admin/createCollector', { user: req.user });
})

router.post('/create', async (req, res) => {
    await collectorModel.create(req.body);
    return res.render('admin/createCollector', { user: req.user })
})

router.get('/collector', async (req, res) => {
    const collector = await collectorModel.find({})
    return res.render('admin/collectorList', { user: req.user, collectors: collector })
})

router.get('/user', async (req, res) => {
    const allUsers = await User.find({});
    return res.render('admin/users', { user: req.user, allUsers: allUsers })
})

router.get('/complain', async (req, res) => {
    const complain = await complainModel.find({})

    let complainInfo = [];
    complain.forEach(element => {
        if (element.status === 'pending') {
            complainInfo.push(element)
        }
    })
    return res.render('admin/complain', { user: req.user, complains: complainInfo })
})


router.get('/logout', (req, res) => {
    res.clearCookie('token').redirect('/')
})

router.post('/assign', async (req, res) => {
    try {
        const { complainId, collectorId } = req.body;
        const user = await User.findById(req.user.id);
        const complain = await complainModel.findById(complainId);
        const collector = await collectorModel.findById(collectorId);

        if (!complain || !collector) {
            return res.status(400).send('Invalid complain or collector ID');
        }

        await assignModel.create({
            assignee: collector.firstname,
            assigner: user.firstname,
            task: complain.complain,
            status: "assigned",
            imageURL: complain.imageURL,
            location: complain.location,
            address: complain.address,
            complainID: complain._id,
        });

        complain.status = "assigned";

        await complain.updateOne({ status: 'assigned' });
        await complain.save();
        return res.redirect(`/admin/assign/${collectorId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.get('/drives', async (req, res) => {
    try {
        const drives = await driveModel.find({}).populate('appliedUsers', 'firstname lastname email');
        return res.render('admin/drives', { user: req.user, drives: drives });
    } catch (error) {
        console.error('Error fetching drives:', error);
        res.status(500).send('An error occurred while fetching drives');
    }
});

router.post('/drives', async (req, res) => {
    const { location, date, number } = req.body
    await driveModel.create({ location, date, number })
    const drives = await driveModel.find({})
    return res.render('admin/drives', { user: req.user, drives: drives });
});
router.get('/drives/:driveId/participants', async (req, res) => {
    try {
        const drive = await driveModel.findById(req.params.driveId).populate('appliedUsers', 'firstname lastname email');
        if (!drive) {
            return res.status(404).send('Drive not found');
        }
        res.json(drive.appliedUsers);
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).send('An error occurred while fetching participants');
    }
});

router.post('/drives/delete/:driveId', async (req, res) => {
    try {
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).send('Unauthorized');
      }
  
      const driveId = req.params.driveId;
      
      await driveModel.findByIdAndDelete(driveId);
      const drives = await driveModel.find({}).populate('appliedUsers', 'firstname lastname email');
      res.redirect('/admin/drives');
    } catch (error) {
      console.error('Error deleting drive:', error);
      res.status(500).send('An error occurred while deleting the drive');
    }
  });

router.get('/task', async (req, res) => {
    const task = await assignModel.find()
    return res.render('admin/taskAssigned', { task: task, user: req.user })
})


module.exports = router