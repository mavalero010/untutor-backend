const Avatar = require("../models/avatar_model");
const User = require("../models/user_model");
const Admin = require("../models/admin_model");

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
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const createAvatar = async (req, res, file) => {
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

    const params = {
      Bucket: bucketProfilePhoto,
      Key: file.originalname,
      Body: file.buffer, //buffer
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    await s3.send(command);

    const avatar = new Avatar({ name: file.originalname });
    await avatar.save().then((data) =>
      res.status(200).json({
        data,
        success: true,
        msg: "Avatar creado",
      })
    );
  } catch (error) {
    res.status(500).json({ succes: false, msg: "Error en servidor" });
  }
};

const getAvatars = async (req, res) => {
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
    const avatars = await Avatar.find();
    res.status(200).json(avatars);
  } catch (error) {
    res.status(500).json({ success: false, msg: "Error en controlador" });
  }
};
module.exports = {
  createAvatar,
  getAvatars,
};
