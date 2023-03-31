const mongoose = require("mongoose");

const sourceSchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    description: { type: String, require: true },
    category: { type: String, require: true },
    url_file: { type: String, require: true },
    ID_subject: {
      type: mongoose.Schema.ObjectId,
      ref: "Subject",
      require: true,
    },
    ID_comment_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
  },
  {
    versionKey: false,
  }
)
module.exports = mongoose.model("Source", sourceSchema);
