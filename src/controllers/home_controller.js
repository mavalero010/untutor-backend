const Subject = require("../models/subject_model");
const Event = require("../models/event_model");
const User = require("../models/user_model");
const Phrase = require("../models/phrase_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

const getHome = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataUserDecoded = getTokenData(token);
    const mail = dataUserDecoded.data.email;
    //Lo busco en BD
    let user = (await User.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataUserDecoded, user);

    if (!validateInfo) {
      return res.json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }

    //Obtengo frases aleatorias de la DB en mongo
    const phrase =
      (await Phrase.aggregate([{ $sample: { size: 1 } }]))[0] || null;

    //Obtengo  las 6 primeras materias aleatorias relacionadas a la facultad del usuario
    const idfaculty = user.idfaculty;
    let subjects = (await Subject.find({ idfaculty })).map((s) => {
      return {
        _id: s._id,
        name: s.name,
        url_background_image: s.url_background_image,
        tutors: s.idtutor_list.length,
      };
    });

    if (subjects.length >= 6) {
      subjects = subjects
        .sort(function () {
          return Math.random() - 0.5;
        })
        .slice(0, 6);
    } else {
      subjects.sort(function () {
        return Math.random() - 0.5;
      });
    }

    //Obtengo lista de eventos prioritarios
    let events = (await Event.find({ priority: true })).map((e) => {
      return {
        _id: e._id,
        name: e.name,
        category: e.category,
        date_init: e.date_init,
      };
    });
    if (events.length >= 6) {
      events = events
        .sort(function () {
          return Math.random() - 0.5;
        })
        .slice(0, 6);
    } else {
      events.sort(function () {
        return Math.random() - 0.5;
      });
    }
    res.json({ mantra: phrase.content, subjects, events:events.filter((d) => d.date_init > Date.now()) });
  } catch (error) {
    return res.json({
      success: false,
      msg: "Error obteniendo Home",
    });
  }
};

module.exports = {
  getHome,
};
