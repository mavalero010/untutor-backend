const Subject = require("../models/subject_model");
const Event = require("../models/event_model");
const User = require("../models/user_model");
const Phrase = require("../models/phrase_model");
const Source = require("../models/source_model")
const Faculty = require("../models/faculty_model")
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
const bucketProfilePhoto=process.env.BUCKET_PROFILE_PHOTO
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.AWS_ACCESS_KEY;
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
    let subjects = (await Subject.find({ idfaculty:idfaculty }))
    let sus =[]
    let faculty = await Faculty.findOne({_id:idfaculty})
    let tutors = await User.find()

    for(let i=0;i<subjects.length;i++){
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
        credits:subjects[i].credits,
        description:subjects[i].description,
        url_background_image: url,
        difficulty_level:subjects[i].difficulty_level,
        faculty:{_id:subjects[i].idfaculty,name:faculty.name},
        tutors: tutors.filter(t=> subjects[i].idtutor_list.indexOf(t._id)!==-1).map(tu=>{return {_id:tu._id,name:tu.name}}),
      })
    }

    subjects=sus
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
    const {page, limit} = req.query;
    const { search_string } = req.body;
    let searchResults = false;
    let results=[]
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
      for (let i = 0 ; i<searchResults.length;i++){
        searchResults[i].type="Tutor"
        searchResults[i].item.password="Invalid access"
      }
      results.push(searchResults)
    
    
      DB = await Subject.find();
       fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
      let subList=[]

      for (s of searchResults){
        const getObjectParams = {
          Bucket: bucketProfilePhoto,
          Key: s.item.url_background_image
        };
        let url=null
        if(s.item.url_background_image!==null){
        const command =  new GetObjectCommand(getObjectParams);
         url =  (await getSignedUrl(s3, command)).split("?")[0];
      }
      subList.push({
        item:{
          _id:s.item._id,
          name:s.item.name,
          credits:s.item.credits,
          description:s.item.description,
          category:s.item.category,
          url_background_image:url,
          difficulty_level:s.item.difficulty_level,
          idfaculty:s.item.idfaculty,
          idtutor_list:s.item.idtutor_list,
          idsource_list:s.item.idsource_list,
          idcomment_list:s.item.idcomment_list,
          idstory_list:s.item.idstory_list,
        }
      ,
      refIndex:s.refIndex,
      score:s.score,
      type:"Subject"
    })

      }
     searchResults=subList
     results.push(searchResults)
    
    
      DB = await Source.find();
       fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
    
      let sourList=[]

      for (s of searchResults){
        const getObjectParams = {
          Bucket: bucketSourceFile,
          Key: s.item.url_file
        };
        let url=null
        if(s.item.url_file!==null){
        const command =  new GetObjectCommand(getObjectParams);
         url =  (await getSignedUrl(s3, command)).split("?")[0];
      }
      sourList.push({
        item:{
        _id:s.item._id,
        name:s.item.name,
        description:s.item.description,
        category:s.item.category,
        url_file:url,
        idsubject:s.item.idsubject,
        idcomment_list:s.item.idcomment_list,
      },
      refIndex:s.refIndex,
      score:s.score,
      type:"Source"
    })

      }
     searchResults=sourList
     results.push(searchResults)
    
    
      DB = await Event.find();
       fuse = new Fuse(DB, options);
      searchResults = fuse.search(search_string);
      for(let i = 0; i<searchResults.length;i++){
        searchResults[i].type="Event"
      }
      results.push(searchResults)
    

    if (!searchResults) {
     return res.status(200).json({
        success: false,
        msg: "No se encontró ningún resultado compatible",
      });
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

     res.status(200).json({ results: results.flat().sort(function(a, b) {
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
