const mongoose = require("mongoose");

const phraseSchema = new mongoose.Schema(
  {
    content: { type: String, require: true },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Phrase", phraseSchema);
