const express = require('express')
const router = express.Router();
const {collectorModel} = require('../models/collector.js');
const {assignModel} = require('../models/taskAssign')

router.get('/home',(req, res)=>{
    return res.render('collector',{user: req.user})
})

router.get('/logout',(req, res)=>{
    res.clearCookie('token').redirect('/')
})
 
router.get('/profile',async(req, res)=>{
    const user = await collectorModel.findById(req.user.id)
    return res.render('collectorProfile',{user: user})
})

router.get('/assigned', async(req, res)=>{
    const collector = await collectorModel.findById(req.user.id)
    const user = await assignModel.find({assignee: collector.fullName})
    return res.render('collectorAssigned',{user: user})
})

module.exports = router