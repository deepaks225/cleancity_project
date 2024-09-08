const express = require('express')
const router = express.Router();
const {collectorModel} = require('../models/collector.js');
const {assignModel} = require('../models/taskAssign')

router.get('/',(req, res)=>{
    return res.render('collector/collector',{user: req.user})
})

router.get('/logout',(req, res)=>{
    res.clearCookie('token').redirect('/')
})
 
router.get('/profile',async(req, res)=>{
    const user = await collectorModel.findById(req.user.id)
    return res.render('collector/profile',{user: user})
})

router.get('/task', async(req, res)=>{  
    const collector = await collectorModel.findById(req.user.id)
    const user = await assignModel.find({assignee: collector.firstname})
    return res.render('collector/collectorAssigned',{user: user})
})

module.exports = router