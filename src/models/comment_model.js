const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema(
    {
      comment: { type: String, require: true },
      date:{type:Date, default: Date.now},
      
      idauthor: 
        {
          type: mongoose.Schema.ObjectId,
          ref: 'User',
        },
        likes:{type:Number,default:0},
        idtarget:{type: mongoose.Schema.ObjectId, require:true}
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Comment', commentSchema)