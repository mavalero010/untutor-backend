const mongoose = require("mongoose")

const commentSchema = new mongoose.Schema(
    {
      name: { type: String, require: true },
      comment: { type: String, require: true },
      date:{type:Date, default: Date.now},
      
      ID_author: 
        {
          type: mongoose.Schema.ObjectId,
          ref: "User",
        },
        likes:{type:Number,default:0}
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model("Comment", commentSchema)