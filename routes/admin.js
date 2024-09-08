const express = require('express')
const router = express.Router();

const {collectorModel} = require('../models/collector.js');
const User = require('../models/user.js');
const {complainModel} = require('../models/complain.js');
const {assignModel} = require('../models/taskAssign.js');

router.get('/',async (req, res)=>{
    const collector = await collectorModel.find({})
    return res.render('admin/admin', {user: req.user,collectors: collector})
})

router.get('/assign/:collectorId', async (req, res) => {
    try {
        const user = req.user;
        const collectorId = req.params.collectorId;
        const complain = await complainModel.find({status: "pending"});
        return res.render('admin/assign', { user: user, complain: complain, collectorId: collectorId });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});

router.get('/create',(req, res)=> {
    return res.render('admin/createCollector',{user: req.user});
})

router.post('/create',async(req, res)=>{
    await collectorModel.create(req.body);
    return res.render('admin/createCollector',{user: req.user})
})

router.get('/collector',async(req, res)=>{
    const collector = await collectorModel.find({})
    return res.render('admin/collectorList',{user: req.user, collectors: collector})
})

router.get('/user',async(req, res)=>{
    const allUsers = await User.find({});
    return res.render('admin/users',{user: req.user, allUsers: allUsers})
})

router.get('/complain',async(req, res)=>{
    const complain = await complainModel.find({})
    return res.render('admin/complain', {user: req.user, complains: complain})
})


router.get('/logout',(req, res)=>{
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
        });

        complain.status = "assigned";
        
        await complain.updateOne({status:'assigned'});
        await complain.save();
        return res.redirect(`/admin/assign/${collectorId}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server error');
    }
});



router.get('/task',async(req, res)=>{
    const task = await assignModel.find({status:'assigned'})
    return res.render('admin/taskAssigned' ,{task: task, user: req.user})
})


module.exports = router