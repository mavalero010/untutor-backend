const mongoose = require("mongoose");

const tutorySchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    description: { type: String, require: true },
    idtutor: {type:mongoose.Schema.ObjectId,
    ref:'User',require:true}, //Role = Tutor
    idstudent_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ], //Role=Estudiante

    idsubject: {
      type: mongoose.Schema.ObjectId,
      ref: "Subject",
      require: true,
    },
    date_start: { type: String, require: true },
    end: { type: String, require: true },
    location: { type: String, require: true },
    isVirtual: { type: Boolean, require: true },
    available: { type: Boolean, require: true },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("Tutory", tutorySchema);
