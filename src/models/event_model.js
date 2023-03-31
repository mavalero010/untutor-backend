const mongoose = require("mongoose")

const eventSchema = new mongoose.Schema(
    {
      name: { type: String, require: true },
      description: { type: String, require: true },
      category: { type: String, require: true },
      days_published: { type: Date, require: true },
      date_init: {
        type: Date,
        require: true,
      },
      priority:{type:Boolean, require:true}
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Event', eventSchema)