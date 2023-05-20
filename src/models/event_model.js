const mongoose = require("mongoose")
const mongoosePaginate = require('mongoose-paginate-v2')
const eventSchema = new mongoose.Schema(
    {
      name: { type: String, require: true },
      description: { type: String, require: true },
      category: { type: String, require: true },
      publication_day: { type: String, require: true }, //Dia de publicación de notificación
      date_init: { //Día de inicio del evento 
        type: String,
        require: true,
      },
      priority:{type:Boolean, require:true}
    },
    {
      versionKey: false,
    }
  )

module.exports = mongoose.model('Event', eventSchema.plugin(mongoosePaginate))