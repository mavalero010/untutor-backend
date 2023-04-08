const mongoose = require("mongoose");
const universitySchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    url_page: { type: String, require: true },
    latitude: { type: String, required: true },
    longitude: { type: String, required: true },
    phone: { type: String, require: true },
    email: { type: String, require: true },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("University", universitySchema);
