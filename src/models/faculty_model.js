const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema(
    {
      name: { type: String, require: true, unique:true },
      description: { type: String, require: true },
      ID_subject_list:[{
        type: mongoose.Schema.ObjectId,
        ref: 'Subject',
        require: true,
      }]
      
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Event', eventSchema)