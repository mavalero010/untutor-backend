const Subject = require("../models/subject_model");
const User = require("../models/user_model");
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

    const {docs, totalPages} = myData

    const results=docs.map(d=>{return{
        _id:d._id,
        name:d.name,
        url_background_image:d.url_background_image,
        tutors: d.idtutor_list.length
    }})

    res.json({results,totalPages,page:parseInt(page)})

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

    const {docs, totalPages} = myData

    const results=docs.map(d=>{return{
        _id:d._id,
        name:d.name,
        url_background_image:d.url_background_image,
        tutors: d.idtutor_list.length
    }})

    res.json({results,totalPages,page:parseInt(page)});
  } catch (error) {
    res.json({ succes: false, msg: "Error en controlador" });
  }
};
module.exports = {
  getAllSubjects,
  getAllSubjectsByID_Faculty,
};
