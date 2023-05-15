const Subject = require("../models/subject_model");
const Source = require("../models/source_model");
const User = require("../models/user_model");
const Admin = require("../models/admin_model");
const Faculty = require("../models/faculty_model");
const Comment = require("../models/comment_model");
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
} = require("@aws-sdk/client-s3");
const dotenv = require("dotenv");
dotenv.config();

const saltRounds = parseInt(process.env.SALT_ROUNDS_ENCRYPT_PASSWORD);
const bucketSourceFile = process.env.BUCKET_SOURCE_UNTUTOR;
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

const createSource = async (req, res, file) => {
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
    const imageName = await bcrypt.hash(file.originalname, saltRounds);

    const params = {
      Bucket: bucketSourceFile,
      Key: imageName,
      Body: file.buffer, //buffer
      ContentType: file.mimetype,
    };
    const command = new PutObjectCommand(params);
    
    let source = await Source.findOne({ name: req.body.name });
    if (source !== null) {
      return res.status(409).json({
        success: false,
        msg: "Recurso ya existe, cambie el nombre del archivo",
      });
    }

    source = new Source({
      name: req.body.name,
      description: req.body.description,
      category: req.body.category,
      url_file: imageName,
      idsubject: req.body.idsubject,
      idcomment_list: [],
    });
    await source.save().then((data) =>
      res.status(200).json({
        data,
        success: true,
        msg: "Recurso creado",
      })
    );
    await s3.send(command);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en el servidor",
    });
  }
};
const getSourceById = async (req, res) => {
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

    const { idsource } = req.query;

    let source = await Source.findOne({ _id: idsource });
    const getObjectParams = {
      Bucket: bucketSourceFile,
      Key: source.url_file,
    };
    let url = null;
    if (source.url_file !== null) {
      const command = new GetObjectCommand(getObjectParams);
      url =(await getSignedUrl(s3, command)).split("?")[0];
    }
    res.json({
      _id: source._id,
      name: source.name,
      description: source.description,
      category: source.category,
      url_file: url,
      idsubject: source.idsubject,
      idcomment_list: source.idcomment_list,
    });
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en el servidor",
    });
  }
};

const deleteSourceById = async (req, res) => {
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
    const result=[]
    const { idsource, idsubject } = req.query;
    await Subject.updateOne(
      { _id: idsubject },
      { $pull: { idsource_list: idsource } }
    ).then(data=> result.push(data)).catch((err) => {
      return res.status(400).json({
        success: false,
        msg: "Error eliminando recurso de lista en Subject",
      });
    });

    await Source.deleteOne({ _id: idsource }).then(data=> result.push(data)).catch((err) => {
      return res
        .status(400)
        .json({ success: false, msg: "Error eliminando recurso" });
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({
      succes: false,
      msg: "Error en el servidor",
    });
  }
};
module.exports = {
  createSource,
  getSourceById,
  deleteSourceById,
};
