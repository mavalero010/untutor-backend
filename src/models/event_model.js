const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2')
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

module.exports = mongoose.model('Event', eventSchema.plugin(mongoosePaginate))