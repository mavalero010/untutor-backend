const Subject = require("../models/subject_model");
const Source = require("../models/source_model");
const User = require("../models/user_model");
const Admin = require("../models/admin_model");
const Faculty = require("../models/faculty_model");
const Comment = require("../models/comment_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

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
      return res.json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    //Recibo params
    const { page, limit } = req.query;
    const myData = await Subject.paginate({}, { page, limit });
    const { docs, totalPages } = myData;

    res.json({ results:docs, totalPages, page: parseInt(page) });
  } catch (error) {
    res.json({ success: false, msg: "Error en controlador" });
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
      return res.json({
        success: false,
        msg: "Usuario no existe, token inválido",
      });
    }

    //Recibo params
    const { page, limit, idfaculty } = req.query;
    const myData = await Subject.paginate({ idfaculty }, { page, limit });

    const { docs, totalPages } = myData;
    const results = docs.map((d) => {
      return {
        _id: d._id,
        name: d.name,
        url_background_image: d.url_background_image,
        tutors: d.idtutor_list.length,
      };
    });

    res.json({ results, totalPages, page: parseInt(page) });
  } catch (error) {
    res.json({ succes: false, msg: "Error en controlador" });
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
      return res.json({
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
      return res.json({
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
      res.json({
        data,
        success: true,
        msg: "Materia creada",
      })
    );
  } catch (error) {
    res.json({ succes: false, msg: "Error en controlador createSubject" });
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
      return res.json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }
    const { idsubject } = req.query;
    const {
      name,
      credits,
      url_background_image,
      description,
      difficulty_level,
      idfaculty,
    } = req.body;

    const subject = await Subject.findByIdAndUpdate(
      { _id: idsubject },
      {
        name,
        credits,
        url_background_image,
        description,
        difficulty_level,
        idfaculty,
      },
      { new: true }
    ) || null;

    if(subject===null){
      return res.json({success:false,msg:"Materia no existe"})
    }
    res.json(subject);
  } catch (error) {
    res.json({ succes: false, msg: "Error en controlador updateSubject" });
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
      return res.json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const {idtutor}=req.body

    const tutor = await User.findById({_id:idtutor})||null

    if(tutor===null){
      return res.json({
        success: false,
        msg: "Tutor no existe",
      });
    }
    if(tutor.role!=="tutor"){
      return res.json({
        success: false,
        msg: "Usuario no es de rol tutor",
      });
    }

    if(tutor.active===false){
      return res.json({
        success: false,
        msg: "Tutor inactivo",
      });
    }

    const {idsubject}=req.query

    let subject = await Subject.findOne({_id:idsubject}) || null
    if(subject===null){
      return res.json({
        success: false,
        msg: "Materia no existe",
      });
    }

    
    if(subject.idtutor_list.indexOf(tutor._id)!==-1){
      return res.json({success:false,msg:"Tutor ya existe en la lista de materias"})
    }

    subject.idtutor_list.push(tutor._id);
    await subject.save();

    res.json(subject)
  } catch (error) {
    res.json({ succes: false, msg: "Error en controlador addIdTutorAtList" });
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
      return res.json({
        success: false,
        msg: "Admin no existe, token inválido",
      });
    }

    const {idsource}=req.body

    const source = await Source.findById({_id:idsource})||null

    if(source===null){
      return res.json({
        success: false,
        msg: "Recurso no existe",
      });
    }

    const {idsubject}=req.query

    let subject = await Subject.findOne({_id:idsubject}) || null
    if(subject===null){
      return res.json({
        success: false,
        msg: "Materia no existe",
      });
    }

    
    if(subject.idsource_list.indexOf(subject._id)!==-1){
      return res.json({success:false,msg:"Source ya existe en la lista de materias"})
    }

    subject.idsource_list.push(subject._id);
    await subject.save();
    
    res.json(subject)
  } catch (error) {
    res.json({ succes: false, msg: "Error en controlador addIdsourceAtList" });
  }
};


module.exports = {
  getAllSubjects,
  getAllSubjectsByID_Faculty,
  createSubject,
  updateSubject,
  addIdTutorAtList,
  addIdSourceAtList,
  
};
