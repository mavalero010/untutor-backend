const Subject = require("../models/subject_model");
const Source = require("../models/source_model");
const User = require("../models/user_model");
const Admin = require("../models/admin_model");
const Faculty = require("../models/faculty_model");
const Comment = require("../models/comment_model");
const Story = require("../models/story_model");
const ObjectId = require('mongodb').ObjectId;
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const bcrypt = require("bcrypt");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  headObject,
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();
const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);
const bucketProfilePhoto = process.env.BUCKET_PROFILE_PHOTO;
const bucketSource=process.env.BUCKET_SOURCE_UNTUTOR
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

const getAllSubjects = async (req, res) => {
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

    //Recibo params
    const { page, limit } = req.query;
    const myData = await Subject.paginate({}, { page, limit });
    const { docs, totalPages } = myData;

    // const command =  new GetObjectCommand(getObjectParams);
    //const url =  await getSignedUrl(s3, command, { expiresIn: 3600 });

    let tutors = await User.find({ role: "tutor" });
    const faculties = await Faculty.find({
      _id: { $in: docs.map((d) => d.idfaculty) },
    });
    let subs = [];

    for (const s of docs) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: s.url_background_image,
      };

      let url = null;
      if (s.url_background_image !== null) {
        const command = new GetObjectCommand(getObjectParams);
        url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      }
      subs.push({
        _id: s._id,
        name: s.name,
        credits: s.credits,
        description: s.description,
        url_background_image: url,
        difficulty_level: s.difficulty_level,
        faculty: faculties.filter(f=> f.equals(s.idfaculty)).map(fa=>{return{_id:fa._id,name:fa.name}})[0],
        tutors: tutors
          .filter((t) => s.idtutor_list.indexOf(t._id) !== -1)
          .map((tu) => {
            return { _id: tu._id, name: tu.name };
          }),
      });
    }

    res.status(200).json({ results: subs, totalPages, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en servidor" });
  }
};
const getAllSubjectsByID_Faculty = async (req, res) => {
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
        msg: "Usuario no existe, token inválido",
      });
    }

    //Recibo params
    const { page, limit } = req.query;
    const { idfaculty } = req.params;
    const myData = await Subject.paginate({ idfaculty }, { page, limit });

    const { docs, totalPages } = myData;
    const results = [];
    for (d of docs) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: d.url_background_image,
      };
      let url = null;
      if (d.url_background_image !== null) {
        const command = new GetObjectCommand(getObjectParams);
        url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      }

      results.push({
        _id: d._id,
        name: d.name,
        url_background_image: url,
        tutors: d.idtutor_list.length,
      });
    }

    res.status(200).json({ results, totalPages, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en controlador" });
  }
};

const createSubject = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const {
      name,
      credits,
      idcomment_list,
      idsource_list,
      idstory_list,
      url_background_image,
      description,
      difficulty_level,
      idfaculty,
      idtutor_list,
    } = req.body;

    let subject = await Subject.findOne({ name });
    if (subject !== null) {
      return res.status(409).json({
        success: false,
        msg: "Materia ya existe",
      });
    }

    subject = new Subject({
      name,
      credits,
      idcomment_list,
      idsource_list,
      idstory_list,
      url_background_image,
      description,
      difficulty_level,
      idfaculty,
      idtutor_list,
    });
    await subject.save().then((data) =>
      res.status(200).json({
        data,
        success: true,
        msg: "Materia creada",
      })
    );
  } catch (error) {
    res
      .status(500)
      .json({ succes: false, msg: "Error en controlador createSubject" });
  }
};

const updateSubject = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    const { idsubject } = req.query;
    const {
      name,
      credits,
      description,
      difficulty_level,
      idfaculty,
    } = req.body;

    const subject =
      (await Subject.findByIdAndUpdate(
        { _id: idsubject },
        {
          name,
          credits,
          description,
          difficulty_level,
          idfaculty,
        },
        { new: true }
      )) || null;

    if (subject === null) {
      return res.status(404).json({ success: false, msg: "Materia no existe" });
    }
    res.status(200).json(subject);
  } catch (error) {
    res
      .status(500)
      .json({ succes: false, msg: "Error en controlador updateSubject" });
  }
};

const addIdTutorAtList = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(404).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const { idtutor } = req.body;

    const tutor = (await User.findById({ _id: idtutor })) || null;

    if (tutor === null) {
      return res.status(404).json({
        success: false,
        msg: "Tutor no existe",
      });
    }
    if (tutor.role !== "tutor") {
      return res.status(401).json({
        success: false,
        msg: "Usuario no es de rol tutor",
      });
    }

    if (tutor.active === false) {
      return res.status(401).json({
        success: false,
        msg: "Tutor inactivo",
      });
    }

    const { idsubject } = req.query;

    let subject = (await Subject.findOne({ _id: idsubject })) || null;
    if (subject === null) {
      return res.status(404).json({
        success: false,
        msg: "Materia no existe",
      });
    }

    if (subject.idtutor_list.indexOf(tutor._id) !== -1) {
      return res.status(409).json({
        success: false,
        msg: "Tutor ya existe en la lista de materias",
      });
    }

    subject.idtutor_list.push(tutor._id);
    await subject.save();

    res.status(200).json(subject);
  } catch (error) {
    res
      .status(500)
      .json({ succes: false, msg: "Error en controlador addIdTutorAtList" });
  }
};

const addIdSourceAtList = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const { idsource } = req.body;

    const source = (await Source.findById({ _id: idsource })) || null;

    if (source === null) {
      return res.status(404).json({
        success: false,
        msg: "Recurso no existe",
      });
    }

    const { idsubject } = req.query;

    let subject = (await Subject.findOne({ _id: idsubject })) || null;
    if (subject === null) {
      return res.status(404).json({
        success: false,
        msg: "Materia no existe",
      });
    }

    if (subject.idsource_list.indexOf(subject._id) !== -1) {
      return res.status(409).json({
        success: false,
        msg: "Source ya existe en la lista de materias",
      });
    }

    subject.idsource_list.push(subject._id);
    await subject.save();

    res.status(200).json(subject);
  } catch (error) {
    res
      .status(500)
      .json({ succes: false, msg: "Error en controlador addIdsourceAtList" });
  }
};

const uploadBackgroundImageSubject = async (req, res, file) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const buffer = await sharp(file.buffer)
      .resize({ height: 1920, width: 1080, fit: "contain" })
      .toBuffer();
    const imageName = await bcrypt.hash(file.originalname, saltRounds);
    const params = {
      Bucket: bucketProfilePhoto,
      Key: imageName,
      Body: file.buffer, //buffer
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);
    const { idsubject } = req.query;
    const subject = await Subject.updateOne(
      { _id: idsubject },
      { $set: { url_background_image: imageName } }
    );

    res.status(200).json(subject);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en controlador uploadBackgroundImageSubject",
    });
  }
};

const getSubjectById = async (req, res) => {
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
        msg: "Usuario no existe, token inválido",
      });
    }

    const { idsubject } = req.query;
    const subject = (await Subject.findOne({ _id: idsubject })) || null;
    if (subject === null) {
      return res.status(404).json({ msg: "Subject no existe" });
    }
    let favorites=await User.find({idfavorite_subjects: { $elemMatch: { $eq: idsubject } }})
    let tutors = await User.find({ role: "tutor" });
    let stories = await Story.find({ idsubject });
    let faculty = await Faculty.findOne({ _id: subject.idfaculty });
    let comments = await Comment.find({ idtarget: idsubject });
    let authors = await User.find({ role: "student" });
      let comms=[]
      let tam=0
      if(comments.length-4<0){
          tam=0
      }else{
        tam = comments.length-4
      }
    for(let co = tam;co<comments.length;co++){
      
      let au = {}
      for(let i = 0;i<authors.length;i++){
        let url = null
        if (authors[i].perfil_photo !== null) {
          const getObjectParams = {
            Bucket: bucketProfilePhoto,
            Key: authors[i].perfil_photo,
          };
    
          const command = new GetObjectCommand(getObjectParams);
           url = await getSignedUrl(s3, command, { expiresIn: 3600 });
        
        }
        if(authors[i]._id.equals(comments[co].idauthor)){
         
          au={_id: authors[i]._id,
            name: authors[i].name,
            perfil_photo: url}
          
        }
      }
      comms.push({
        _id: comments[co]._id,
        comment: comments[co].comment,
        author:au,
        date:comments[co].date
      })
    }
    /*stories.map((s) => {
        return { _id: s._id, name: s.name, multimedia: s.multimedia };
      }),*/
      let tamS=0
      let ss=[]
      if(stories.length-4<0){
        tamS=0
      }else{
        tamS = stories.length-4
      }
      for(let i=tamS;i<stories.length;i++){
        let urlS=null
        if (stories[i].multimedia !== null) {
          const getObjectParams = {
            Bucket: bucketSource,
            Key: stories[i].multimedia,
          };
          const command = new GetObjectCommand(getObjectParams);
          urlS = await getSignedUrl(s3, command, { expiresIn: 3600 });
          }
          ss.push({_id: stories[i]._id, name: stories[i].name, multimedia: urlS})
      }
    let sources= await Source.find({idsubject})
    let isfavorite=false
    user.idfavorite_subjects.forEach(element => {
      if(element.toString()==idsubject){
        isfavorite=true
      }
    });

    if (subject.url_background_image !== null) {
      const getObjectParams = {
        Bucket: bucketProfilePhoto,
        Key: subject.url_background_image,
      };

      const command = new GetObjectCommand(getObjectParams);
      const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
      subject.url_background_image = url;
    }
    const s = {
      _id: subject._id,
      name: subject.name,
      credits: subject.credits,
      description: subject.description,
      url_background_image: subject.url_background_image,
      difficulty_level: subject.difficulty_level,
      faculty: { _id: faculty._id, name: faculty.name },
      tutors: tutors
        .filter((t) => subject.idtutor_list.indexOf(t._id) !== -1)
        .map((tu) => {
          return { _id: tu._id, name: tu.name };
        }),
      stories:ss,
      comments: comms,
      sources:sources.map(s=>{return {name:s.name,url:s.url_file}}).length,
      isfavorite,
      likes:favorites.length
    };

    res.json(s);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en servidor",
    });
  }
};

const deleteProfilePhotoSubject = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const { idsubject } = req.query;
    const subject = (await Subject.findOne({ _id: idsubject })) || null;

    if (subject === null) {
      return res.status(404).json({
        msg: "Materia no existe",
      });
    }

    if (subject.url_background_image === null) {
      return res.status(401).json({
        msg: "No hay imagenes para borrar",
      });
    }
    const params = {
      Bucket: bucketProfilePhoto,
      Key: subject.url_background_image,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    const newsub = await Subject.updateOne(
      { _id: idsubject },
      { $set: { url_background_image: null } },
      { new: true }
    );
    res.json(newsub);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en servidor ",
    });
  }
};

const deleteSubjectById = async (req, res) => {
  try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      res.status(401).json({ message: "No se proporcionó un token" });
    }

    //Decodifico Token
    const dataAdminDecoded = getTokenData(token);
    const mail = dataAdminDecoded.data.email;
    //Lo busco en BD
    let admin = (await Admin.findOne({ email: mail })) || null;
    //valido que la info decodificada del token sea válida
    const validateInfo = authTokenDecoded(dataAdminDecoded, admin);

    if (!validateInfo) {
      return res.status(401).json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    const { idsubject } = req.query;
    const subject = (await Subject.findOne({ _id: idsubject })) || null;

    if (subject === null) {
      return res.status(404).json({
        msg: "Materia no existe",
      });
    }

    if (subject.url_background_image === null) {
      return res.status(401).json({
        msg: "No hay imagenes para borrar",
      });
    }
    const params = {
      Bucket: bucketProfilePhoto,
      Key: subject.url_background_image,
    };

    const command = new DeleteObjectCommand(params);
    await s3.send(command);

    const s = await Subject.deleteOne({ _id: idsubject });

    res.json(s);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en servidor ",
    });
  }
};
module.exports = {
  getAllSubjects,
  getAllSubjectsByID_Faculty,
  createSubject,
  updateSubject,
  addIdTutorAtList,
  addIdSourceAtList,
  uploadBackgroundImageSubject,
  getSubjectById,
  deleteProfilePhotoSubject,
  deleteSubjectById,
};
