const mongoose = require("mongoose");

const avatarSchema = new mongoose.Schema(
  {
    name: { type: String, require: true , unique:true}
   
  },

  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Avatar", avatarSchema);
