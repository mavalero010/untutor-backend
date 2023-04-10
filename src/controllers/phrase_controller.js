const Phrase = require("../models/phrase_model");
const User = require("../models/user_model");
const { getTokenData, authTokenDecoded } = require("../config/jwt.config");

const getPhrase = async (req, res) => {
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
   /* if (user.role !== "student") {
      return res.status(401).json({
        success: false,
        msg: "Válido solo para rol student",
      });
    }*/
    //Obtengo de los params el ID de Phrase
    const { idphrase } = req.query;
    let phrase = (await Phrase.findOne({ _id: idphrase })) || null;

    if (phrase === null) {
      return res.status(404).json({
        success: false,
        msg: "Frase no existe",
      });
    }

    res.status(200).json(phrase);
  } catch (error) {
    return res.status(500).json({
      success: false,
      msg: "Error obteniendo frase",
    });
  }
};

module.exports = {
  getPhrase,
};
