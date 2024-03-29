const Subject = require("../models/subject_model");
const Event = require("../models/event_model");
const User = require("../models/user_model");
const Blog = require("../models/blog_model");
const Story = require("../models/story_model");
const Phrase = require("../models/phrase_model");
const Source = require("../models/source_model");
const Faculty = require("../models/faculty_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");
const Fuse = require("fuse.js");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bcrypt = require("bcrypt");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();

const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);
const bucketSourceFile = process.env.BUCKET_SOURCE_UNTUTOR;
const bucketProfilePhoto = process.env.BUCKET_PROFILE_PHOTO;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY_BACKEND;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const s3 = new S3Client({
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
});
const sharp = require("sharp");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

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
    let subjects = await Subject.find({ idfaculty: idfaculty });
    let sus = [];
    let faculty = await Faculty.findOne({ _id: idfaculty });
    let tutors = await User.find();

    for (let i = 0; i < subjects.length; i++) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: subjects[i].url_background_image,
      };
      let url = null;
      if (subjects[i].url_background_image !== null) {
        const command = new GetObjectCommand(getObjectParams);
        url = (await getSignedUrl(s3, command)).split("?")[0];
      }
      sus.push({
        _id: subjects[i]._id,
        name: subjects[i].name,
        credits: subjects[i].credits,
        description: subjects[i].description,
        url_background_image: url,
        difficulty_level: subjects[i].difficulty_level,
        faculty: { _id: subjects[i].idfaculty, name: faculty.name },
        tutors: tutors
          .filter((t) => subjects[i].idtutor_list.indexOf(t._id) !== -1)
          .map((tu) => {
            return { _id: tu._id, name: tu.name };
          }),
      });
    }

    subjects = sus;
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
      events: events.filter((d) => new Date(d.date_init) > Date.now()),
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
    const { page, limit } = req.query;
    const { search_string } = req.body;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    let searchResults = false;
    let results = {};
    let DB = false;
    const options = {
      includeScore: true,
      keys: ["name"],
      threshold: 0.3,
    };

    //Busco en la base de datos según sea el filtro

    DB = await User.find({ role: "tutor" });
    let fuse = new Fuse(DB, options);
    searchResults = fuse.search(search_string);
    for (let i = 0; i < searchResults.length; i++) {
      searchResults[i].type = "tutor";
      searchResults[i].item.password = "Invalid access";
    }
    results.tutors = searchResults
      .flat()
      .sort(function (a, b) {
        return a.score - b.score;
      })
      .slice(startIndex, endIndex);

    DB = await Subject.find();
    fuse = new Fuse(DB, options);
    searchResults = fuse.search(search_string);
    let subList = [];

    for (s of searchResults) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: s.item.url_background_image,
      };
      let url = null;
      if (s.item.url_background_image !== null) {
        const command = new GetObjectCommand(getObjectParams);
        url = (await getSignedUrl(s3, command)).split("?")[0];
      }
      let storiess = s.item.idstory_list;
      for (let i = 0; i < s.item.idstory_list.length; i++) {
        const story_finder = await Story.findOne({
          _id: s.item.idstory_list[i],
        });

        if (story_finder === null) {
          storiess = await Subject.findOneAndUpdate(
            { _id: s.item._id },
            { $pull: { idstory_list: s.item.idstory_list[i] } },
            { new: true }
          ).catch((err) => {
            return res.status(400).json({
              success: false,
              msg: "Error eliminando story de lista en Subject",
            });
          });
        }
      }
      subList.push({
        item: {
          _id: s.item._id,
          name: s.item.name,
          credits: s.item.credits,
          description: s.item.description,
          category: s.item.category,
          url_background_image: url,
          difficulty_level: s.item.difficulty_level,
          idfaculty: s.item.idfaculty,
          idtutor_list: s.item.idtutor_list,
          idsource_list: s.item.idsource_list,
          idcomment_list: s.item.idcomment_list,
          idstory_list: storiess.idstory_list,
        },
        refIndex: s.refIndex,
        score: s.score,
        type: "subject",
      });
    }
    searchResults = subList;
    results.subjects = searchResults
      .flat()
      .sort(function (a, b) {
        return a.score - b.score;
      })
      .slice(startIndex, endIndex);

    DB = await Source.find();
    fuse = new Fuse(DB, options);
    searchResults = fuse.search(search_string);

    let sourList = [];

    for (s of searchResults) {
      const getObjectParams = {
        Bucket: bucketSourceFile,
        Key: s.item.url_file,
      };
      let url = null;
      if (s.item.url_file !== null) {
        const command = new GetObjectCommand(getObjectParams);
        url = (await getSignedUrl(s3, command)).split("?")[0];
      }
      sourList.push({
        item: {
          _id: s.item._id,
          name: s.item.name,
          description: s.item.description,
          category: s.item.category,
          url_file: url,
          idsubject: s.item.idsubject,
          idcomment_list: s.item.idcomment_list,
        },
        refIndex: s.refIndex,
        score: s.score,
        type: "source",
      });
    }
    searchResults = sourList;
    results.sources = searchResults
      .flat()
      .sort(function (a, b) {
        return a.score - b.score;
      })
      .slice(startIndex, endIndex);

    DB = await Event.find();
    fuse = new Fuse(DB, options);
    searchResults = fuse.search(search_string);
    for (let i = 0; i < searchResults.length; i++) {
      searchResults[i].type = "event";
    }
    results.events = searchResults
      .flat()
      .sort(function (a, b) {
        return a.score - b.score;
      })
      .slice(startIndex, endIndex);

    DB = await Blog.find();
    fuse = new Fuse(DB, options);
    searchResults = fuse.search(search_string);
    for (let i = 0; i < searchResults.length; i++) {
      searchResults[i].type = "Blog";
    }
    results.blogs = searchResults
      .flat()
      .sort(function (a, b) {
        return a.score - b.score;
      })
      .slice(startIndex, endIndex);

    if (!searchResults) {
      return res.status(200).json({
        success: false,
        msg: "No se encontró ningún resultado compatible",
      });
    }

    res.status(200).json({ results: results });
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
