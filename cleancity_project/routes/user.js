const express = require('express');
const router = express.Router();
const user = require('../models/user.js')
const multer = require('multer')
const {complainModel} = require('../models/complain.js')
const path = require('path');
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
    // console.log(req.user)
    const User = await user.findById(req.user.id)
    // console.log(User)      
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
    console.log(firstname);  

    try {
        const User = await new user({ firstname, lastname, email, date, password });
        await User.save();
        return res.render('index',{user : User});
    } catch (error) {
        console.error(error);
        return res.status(500).send("Error occurred while creating the user.");
    }
});

router.get('/signin',(req, res)=>{
    return res.render('signin')
}) 

router.post('/signin',async(req, res)=>{
    const {email, password} = await req.body;
    const token = await user.matchPassword(email,password) 
    const User = await user.find({email}) 
    if(token)
        return res.cookie("token", token).render('index' , {user: User})
    else
        return res.render('signin')
})

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
router.get('/', (req, res) => {
    const userDrives = [{location:"Wadala", date:"2022/3/03", volunteers:15},
        {location:"Bandra", date:"2022/3/04", volunteers:20},
        {location:"Bandra", date:"2022/3/04", volunteers:20},
    ]
    res.render('home', {drives: userDrives});
});
router.get('/logout',(req , res)=>{
    return res.clearCookie('token').render('index');
})

module.exports = router