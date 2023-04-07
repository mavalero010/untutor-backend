const Subject = require("../models/subject_model");
const Event = require("../models/event_model");
const User = require("../models/user_model");
const Phrase = require("../models/phrase_model");
const Source = require("../models/source_model")
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");
const Fuse = require("fuse.js");

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
      return res.status(401).json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.status(401).json({
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
    res.status(200).json({
      mantra: phrase.content,
      subjects,
      events: events.filter((d) => d.date_init > Date.now()),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error obteniendo Home",
    });
  }
};

const getBrowser = async (req, res) => {
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
      return res.status(401).json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Verifica que el user sea de rol student
    if (user.role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }

    //Obtengo el filtro para saber en que base de datos buscar, sea User, Subject, Source, Event etc
    const { filter,page, limit} = req.query;
    const { search_string } = req.body;
    let searchResults = false;
    let DB = false;
    const options = {
      includeScore: true,
      keys: ["name"], 
      threshold: 0.3,
    };

    //Busco en la base de datos según sea el filtro
    if (filter === "tutor") {
      DB = await User.find({ role: filter });
      const fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
    }
    if (filter === "subject") {
      DB = await Subject.find();
      const fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
    }
    if (filter === "source") {
      DB = await Source.find();
      const fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
    }
    if (filter === "event") {
      DB = await Event.find();
      const fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
    }

    if (!searchResults) {
     return res.status(200).json({
        success: false,
        msg: "No se encontró ningún resultado compatible",
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

     res.status(200).json({ results: searchResults.sort(function(a, b) {
        return b.score - a.score;
    }).slice(startIndex,endIndex) });
    

    
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error obteniendo Browser",
    });
  }
};
module.exports = {
  getHome,
  getBrowser,
};
