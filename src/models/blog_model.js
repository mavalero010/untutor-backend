const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2')
const blogSchema = new mongoose.Schema(
    {
      name: { type: String, require: true },
      description: { type: String, require: true },
      category: { type: String, require: true },
      publication_day: { type: String, require: true },
      date_init: {
        type: Date,
        require: true,
      }
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Blog', blogSchema.plugin(mongoosePaginate))