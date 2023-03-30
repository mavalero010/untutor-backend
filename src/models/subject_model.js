const mongoose = require('mongoose')

const subjectSchema = new mongoose.Schema({
    
    name:{type:String,require:true},
    credits:{type:Number,require:true},
    description:{type:String, require:true},
    url_background_image:{type:String, require:true},//TODO: Ajustar tipo de dato correcto
    difficulty_level:{type:Number,require:true},
    ID_tutor_list:[{
        type:mongoose.Schema.ObjectId,
        ref:'User'}], //Role=Tutor
    ID_source_list:[{
        type:mongoose.Schema.ObjectId,
        ref:'Source'}], 
    ID_comment_list:[{
        type:mongoose.Schema.ObjectId,
        ref:'Comment'}], 
    ID_story_list:[{
        type:mongoose.Schema.ObjectId,
        ref:'Story'}],     
    },{
      versionKey:false
    })
module.exports = mongoose.model('Subject', subjectSchema)