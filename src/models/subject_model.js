const mongoose = require("mongoose");
const mongoosePaginate = require('mongoose-paginate-v2')
const subjectSchema = new mongoose.Schema(
  {
    name: { type: String, require: true, unique:true},
    credits: { type: Number, require: true },
    description: { type: String, require: true },
    url_background_image: { type: Object, require: true }, //TODO: Ajustar tipo de dato correcto
    difficulty_level: { type: Number, require: true },
    idfaculty:{type:mongoose.Schema.ObjectId, //TODO: DEBE SER REQUIRE TRUE
    ref:'Faculty',require:true},
    idtutor_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ], //Role=Tutor
    idsource_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Source",
      },
    ],
    idcomment_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Comment",
      },
    ],
    idstory_list: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Story",
      },
    ],
  },
  {
    versionKey: false,
  }
);
module.exports = mongoose.model("Subject", subjectSchema.plugin(mongoosePaginate));
