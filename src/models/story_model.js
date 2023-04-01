const mongoose = require("mongoose")

const storySchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    IDUser: { type: mongoose.Schema.ObjectId, ref: "User", require: true },
    multimedia: { type: String, require: true }, //TODO:Especificar tipo de dato
    idcomment_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'Comment',
      },
    ],
  },
  {
    versionKey: false,
  }

)

module.exports = mongoose.model('Story', storySchema)
