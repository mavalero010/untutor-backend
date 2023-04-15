const User = require("../models/user_model");
const {
    getToken,
    getTokenData,
    authTokenDecoded,
    getUnexpiredToken,
  } = require("../config/jwt.config");

  const createTutory =async (req,res)=>{
    try {
    // Aquí se verificaría si el token JWT enviado por el cliente es válido
    // En este ejemplo, lo simulamos decodificando el token y comprobando si el ID del usuario existe
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No se proporcionó un token" });
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
        msg: "Token inválido",
      });
    }
res.status(200).json(user)
    } catch (error) {
        res.status(500).json({ succes: false, msg: "Error en servidor" });
    }
  }
module.exports = {
    createTutory
};

