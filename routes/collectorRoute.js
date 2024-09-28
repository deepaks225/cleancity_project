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
        if (!task) {
            console.log(`Task not found for ID: ${req.params.taskId}`);
            return res.status(404).render('error', { message: "Task not found" });
        }
        const complain = await complainModel.find({complain: task.task});
        return res.render('collector/collectorstatus', { user: req.user, task: task, complain: complain });
    } catch (error) {
        console.error("Error fetching task:", error);
        return res.status(500).render('error', { message: "Error fetching task", error: error.message });
    }
});

router.post('/update/:taskId', async (req, res) => {
    const { status } = req.body;
    const taskId = req.params.taskId;
    
    try {
        const task = await assignModel.findById(taskId);
        if (!task) {
            console.log(`Task not found for ID: ${taskId}`);
            return res.status(404).render('error', { message: "Task not found" });
        }

        const updatedTask = await assignModel.findByIdAndUpdate(taskId, { status }, { new: true });
        const ID = updatedTask.complainID;
        await complainModel.findByIdAndUpdate(ID, { status, isRead: false }, { new: true });

        const collector = await collectorModel.findById(req.user.id);
        if (!collector) {
            console.log(`Collector not found for ID: ${req.user.id}`);
            return res.status(404).render('error', { message: "Collector not found" });
        }

        if (status === "completed") {
            const taskCompletedByCollector = collector.taskCompleted + 1;
            await collectorModel.findByIdAndUpdate(req.user.id, { taskCompleted: taskCompletedByCollector });
        }

        const tasks = await assignModel.find({ assignee: collector.firstname });
        return res.redirect('/collector/task');
    } catch (error) {
        console.error("Error updating status:", error);
        return res.status(500).render('error', { message: "Error updating status", error: error.message });
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