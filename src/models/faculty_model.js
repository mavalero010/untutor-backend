const mongoose = require("mongoose")

const facultySchema = new mongoose.Schema(
    {
      name: { type: String, require: true, unique:true },
      description: { type: String, require: true }
      
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Faculty', facultySchema)