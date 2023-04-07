const Faculty = require("../models/faculty_model");
const User = require("../models/user_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

const getFaculty = async (req, res) => {
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

    let { idfaculty,page, limit } = req.query;
    if(idfaculty===undefined){
      let iduniversity=user.iduniversity
      const f = await Faculty.paginate({iduniversity}, { page, limit })
      const {docs,totalPages} = f 
      return res.status(200).json({ results:docs, totalPages, page: parseInt(page) });
      
    }
    const faculty = await Faculty.findOne({ _id: idfaculty , iduniversity:user.iduniversity}) || null;
    
    if (faculty === null) {
      return res.status(404).json({
        success: false,
        msg: "idfaculty inválido",
      });
  }
  res.status(200).json(faculty);
  } catch (error) {

    res.status(500).json({ succes: false, msg: "error en controlador"});
  }
};

module.exports = {
  getFaculty,
};
