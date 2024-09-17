const express = require('express')
const router = express.Router();
const { collectorModel } = require('../models/collector.js');
const { assignModel } = require('../models/taskAssign');
const { complainModel } = require('../models/complain.js')


router.get('/logout', (req, res) => {
    res.clearCookie('token').redirect('/')
})

router.get('/profile', async (req, res) => {
    const user = await collectorModel.findById(req.user.id)
    return res.render('collector/profile', { user: user })
})

router.get('/update/:taskId', async (req, res) => {
    try {
        const task = await assignModel.findById(req.params.taskId);
        const complain = await complainModel.find({complain:task.task})
        if (!task) {
            return res.status(404).send("Task not found");
        }
        return res.render('collector/collectorStatus', { user: req.user, task: task , complain: complain });
    } catch (error) {
        console.error("Error fetching task:", error);
        return res.status(500).send("Error fetching task");
    }
});

router.post('/update/:taskId', async (req, res) => {
    const { status } = req.body;
    console.log(req.body)
    const taskId = req.params.taskId;
    const task = await assignModel.findById(req.params.taskId);
    try {
        const updatedTask = await assignModel.findByIdAndUpdate(taskId, { status }, { new: true });
        await complainModel.findOneAndUpdate({complain:task.task},{status},{new: true});
        if (updatedTask) {
            console.log("Success");
            const collector = await collectorModel.findById(req.user.id);
            const tasks = await assignModel.find({ assignee: collector.firstname });
            return res.render('collector/collectorAssigned', { user: req.user, tasks: tasks });
        } else {
            console.log("No task found");
            return res.status(404).send("Task not found");
        }
     } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).send("Error updating status");
    }
});

router.get('/task', async (req, res) => {
    try {
        const collector = await collectorModel.findById(req.user.id);
        const tasks = await assignModel.find({ assignee: collector.firstname });
        return res.render('collector/collectorAssigned', { user: req.user, tasks: tasks });
    } catch (error) {
        console.error("Error fetching tasks:", error);
        return res.status(500).send("Error fetching tasks");
    }
});

module.exports = router