const mongoose = require("mongoose");
mongoose.Schema.Types.Double = require("@mongoosejs/double")(mongoose);
const universitySchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    Url_page: { type: String, require: true },
    latitude: { type: mongoose.Schema.Types.Double, required: true },
    longitude: { type: mongoose.Schema.Types.Double, required: true },
    phone: { type: String, require: true },
    email: { type: String, require: true },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("University", universitySchema);
