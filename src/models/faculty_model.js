const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2')
const facultySchema = new mongoose.Schema(
    {
      name: { type: String, require: true, unique:true },
      description: { type: String, require: true },
      iduniversity:{
        type: mongoose.Schema.ObjectId,
        ref: "University",
        require: true,
      }
      
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Faculty', facultySchema.plugin(mongoosePaginate))