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
      return res.json({
        success: false,
        msg: "Usuario no existe o contraseña inválida",
      });
    }

    const { idfaculty } = req.query;
    const faculty = await Faculty.findOne({ _id: idfaculty }) || null;

    if (faculty === null) {
      return res.json({
        success: false,
        msg: "Usuario no existe, idfaculty inválido",
      });
    }

    res.json(faculty);
  } catch (error) {

    res.json({ succes: false, msg: "error en controlador"});
  }
};

module.exports = {
  getFaculty,
};