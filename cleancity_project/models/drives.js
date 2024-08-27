const mongoose = require('mongoose')
const driveSchema = new mongoose.Schema({
    location:{
        type:String,
        required:true,
    },
    date:{
        type:String,
        required:true,
    },
    number:{
        type:Number,
        required: true,
    }
});

const driveModel = mongoose.model('drives',driveSchema);
module.exports = driveModel