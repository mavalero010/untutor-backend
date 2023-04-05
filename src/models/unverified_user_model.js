const mongoose = require("mongoose")
const unverifiedUserSchema = new mongoose.Schema(
  {
    name: { type: String, require: true },
    iduniversity: {
      type: mongoose.Schema.ObjectId,
      ref: "University",
      require: true,
    },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: true },
    gender: { type: String, require: true },
    birthday: { type: Date, require: true },
    biography: { type: String, require: true },
    active: { type: Boolean, require: true, default: false },
    role: { type: String, require: true },
    idfaculty: { type: mongoose.Schema.ObjectId,
      ref: 'Faculty', require: true },
    city_of_birth: { type: String },
    perfil_photo: { type: String },
    idfavorite_subjects: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Subject",
      },
    ],
    phone: { type: String },
    createdAt: { type: Date, expires: "1h", default: Date.now },
  },
  {
    versionKey: false,
  }
)
module.exports = mongoose.model("UnverifiedUser", unverifiedUserSchema)
